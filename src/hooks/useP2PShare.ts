import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Symmetric WebRTC P2P file share with Supabase Realtime as a tiny signaling channel.
 * - "host" generates the 6-digit code/QR and waits.
 * - "join" enters/scans the code to connect.
 * - DataChannel is negotiated (id 0), so EITHER party can send a file once connected.
 * - On the same Wi-Fi/LAN, ICE picks the local candidate → zero internet data for the file bytes.
 */

export type P2PMode = "host" | "join";
export type P2PStatus =
  | "idle"
  | "waiting"
  | "connecting"
  | "connected"
  | "transferring"
  | "done"
  | "error"
  | "fallback";

export interface IncomingFileMeta {
  name: string;
  size: number;
  type: string;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

const CHUNK_SIZE = 16 * 1024;
const BUFFER_LOW = 256 * 1024;
const BUFFER_HIGH = 1024 * 1024;

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

export function useP2PShare() {
  const [status, setStatus] = useState<P2PStatus>("idle");
  const [code, setCode] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<IncomingFileMeta | null>(null);
  const [receivedUrl, setReceivedUrl] = useState<string | null>(null);
  const [receivedName, setReceivedName] = useState<string>("");
  const [usingLocalCandidate, setUsingLocalCandidate] = useState<boolean | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const modeRef = useRef<P2PMode | null>(null);

  const incomingChunksRef = useRef<ArrayBuffer[]>([]);
  const incomingMetaRef = useRef<IncomingFileMeta | null>(null);
  const incomingReceivedRef = useRef(0);

  const cleanup = useCallback(() => {
    try { dcRef.current?.close(); } catch (_e) { /* noop */ }
    try { pcRef.current?.close(); } catch (_e) { /* noop */ }
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    dcRef.current = null;
    pcRef.current = null;
    channelRef.current = null;
    incomingChunksRef.current = [];
    incomingMetaRef.current = null;
    incomingReceivedRef.current = 0;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setStatus("idle");
    setCode("");
    setProgress(0);
    setError(null);
    setIncoming(null);
    setReceivedUrl(null);
    setReceivedName("");
    setUsingLocalCandidate(null);
    modeRef.current = null;
  }, [cleanup]);

  const inspectSelectedCandidate = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    try {
      const stats = await pc.getStats();
      stats.forEach((report) => {
        if (report.type === "candidate-pair" && (report as RTCIceCandidatePairStats).state === "succeeded") {
          const localId = (report as RTCIceCandidatePairStats).localCandidateId;
          stats.forEach((r) => {
            if (r.id === localId && r.type === "local-candidate") {
              const cand = r as RTCIceCandidate & { candidateType?: string };
              setUsingLocalCandidate(cand.candidateType === "host" || cand.candidateType === "prflx");
            }
          });
        }
      });
    } catch (_e) { /* noop */ }
  }, []);

  const wireDataChannel = useCallback(
    (dc: RTCDataChannel) => {
      dc.binaryType = "arraybuffer";
      dc.bufferedAmountLowThreshold = BUFFER_LOW;
      dc.onopen = () => {
        setStatus("connected");
        inspectSelectedCandidate();
      };
      dc.onerror = () => {
        setError("Data channel error");
        setStatus("error");
      };
      dc.onmessage = (ev) => {
        if (typeof ev.data === "string") {
          try {
            const msg = JSON.parse(ev.data);
            if (msg.kind === "meta") {
              const meta: IncomingFileMeta = { name: msg.name, size: msg.size, type: msg.type };
              incomingMetaRef.current = meta;
              incomingChunksRef.current = [];
              incomingReceivedRef.current = 0;
              setIncoming(meta);
              setProgress(0);
              setStatus("transferring");
            } else if (msg.kind === "done") {
              const meta = incomingMetaRef.current;
              if (meta) {
                const blob = new Blob(incomingChunksRef.current, { type: meta.type || "application/octet-stream" });
                const url = URL.createObjectURL(blob);
                setReceivedUrl(url);
                setReceivedName(meta.name);
                setProgress(100);
                setStatus("done");
              }
            }
          } catch (_e) { /* noop */ }
        } else {
          const buf = ev.data as ArrayBuffer;
          incomingChunksRef.current.push(buf);
          incomingReceivedRef.current += buf.byteLength;
          const meta = incomingMetaRef.current;
          if (meta && meta.size > 0) {
            setProgress(Math.min(99, Math.round((incomingReceivedRef.current / meta.size) * 100)));
          }
        }
      };
    },
    [inspectSelectedCandidate],
  );

  const setupSignaling = useCallback(
    (pairCode: string, self: P2PMode, onRemoteSdp: (sdp: RTCSessionDescriptionInit) => void) => {
      const channel = supabase.channel(`p2p:${pairCode}`, {
        config: { broadcast: { self: false, ack: false } },
      });

      channel
        .on("broadcast", { event: "sdp" }, ({ payload }) => {
          if (payload?.from === self) return;
          onRemoteSdp(payload.sdp as RTCSessionDescriptionInit);
        })
        .on("broadcast", { event: "ice" }, async ({ payload }) => {
          if (payload?.from === self) return;
          const pc = pcRef.current;
          if (pc && payload?.candidate) {
            try { await pc.addIceCandidate(payload.candidate); } catch (_e) { /* noop */ }
          }
        })
        .subscribe();

      channelRef.current = channel;
      return channel;
    },
    [],
  );

  /** HOST: generate code, create offer, wait for joiner's answer. Returns the code. */
  const startHost = useCallback(async (): Promise<string> => {
    reset();
    modeRef.current = "host";
    const pairCode = generateCode();
    setCode(pairCode);
    setStatus("waiting");

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;
    // Negotiated DataChannel — both peers create with same id.
    const dc = pc.createDataChannel("file", { negotiated: true, id: 0, ordered: true });
    dcRef.current = dc;
    wireDataChannel(dc);

    pc.onicecandidate = (ev) => {
      if (ev.candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "ice",
          payload: { from: "host", candidate: ev.candidate.toJSON() },
        });
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setStatus((s) => (s === "transferring" ? s : "connected"));
        inspectSelectedCandidate();
      }
      if (pc.connectionState === "failed") {
        setError("Connection failed");
        setStatus("fallback");
      }
    };

    const channel = setupSignaling(pairCode, "host", async (sdp) => {
      try { await pc.setRemoteDescription(sdp); }
      catch (e) { setError((e as Error).message); setStatus("error"); }
    });

    await new Promise<void>((resolve) => {
      const check = () => (channel.state === "joined" ? resolve() : setTimeout(check, 100));
      check();
    });

    setStatus("connecting");
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    channel.send({
      type: "broadcast",
      event: "sdp",
      payload: { from: "host", sdp: pc.localDescription },
    });

    return pairCode;
  }, [inspectSelectedCandidate, reset, setupSignaling, wireDataChannel]);

  /** JOIN: with a 6-digit code, answer the host's offer. */
  const startJoin = useCallback(
    async (pairCode: string) => {
      reset();
      modeRef.current = "join";
      setCode(pairCode);
      setStatus("connecting");

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;
      const dc = pc.createDataChannel("file", { negotiated: true, id: 0, ordered: true });
      dcRef.current = dc;
      wireDataChannel(dc);

      pc.onicecandidate = (ev) => {
        if (ev.candidate && channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "ice",
            payload: { from: "join", candidate: ev.candidate.toJSON() },
          });
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          setError("Connection failed");
          setStatus("fallback");
        }
      };

      setupSignaling(pairCode, "join", async (sdp) => {
        try {
          await pc.setRemoteDescription(sdp);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          channelRef.current?.send({
            type: "broadcast",
            event: "sdp",
            payload: { from: "join", sdp: pc.localDescription },
          });
        } catch (e) {
          setError((e as Error).message);
          setStatus("error");
        }
      });
    },
    [reset, setupSignaling, wireDataChannel],
  );

  const sendFile = useCallback(async (file: File) => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") {
      setError("Channel not open");
      return;
    }
    setStatus("transferring");
    setProgress(0);

    dc.send(JSON.stringify({ kind: "meta", name: file.name, size: file.size, type: file.type }));

    let offset = 0;
    const reader = file.stream().getReader();
    const waitForBuffer = () =>
      new Promise<void>((resolve) => {
        if (dc.bufferedAmount < BUFFER_HIGH) return resolve();
        const onLow = () => {
          dc.removeEventListener("bufferedamountlow", onLow);
          resolve();
        };
        dc.addEventListener("bufferedamountlow", onLow);
      });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      let chunkOffset = 0;
      while (chunkOffset < value.byteLength) {
        const slice = value.slice(chunkOffset, chunkOffset + CHUNK_SIZE);
        if (dc.bufferedAmount >= BUFFER_HIGH) await waitForBuffer();
        dc.send(slice);
        chunkOffset += slice.byteLength;
        offset += slice.byteLength;
        setProgress(Math.min(99, Math.round((offset / file.size) * 100)));
      }
    }

    dc.send(JSON.stringify({ kind: "done" }));
    setProgress(100);
    setStatus("done");
  }, []);

  return {
    status,
    code,
    progress,
    error,
    incoming,
    receivedUrl,
    receivedName,
    usingLocalCandidate,
    startHost,
    startJoin,
    sendFile,
    reset,
    // Back-compat aliases (used elsewhere if any)
    startSender: startHost,
    startReceiver: startJoin,
  };
}
