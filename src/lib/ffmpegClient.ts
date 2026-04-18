import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

const CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

export const getFFmpeg = async (
  onProgress?: (ratio: number) => void,
  onLog?: (msg: string) => void,
): Promise<FFmpeg> => {
  if (ffmpegInstance) {
    if (onProgress) ffmpegInstance.on("progress", ({ progress }) => onProgress(progress));
    if (onLog) ffmpegInstance.on("log", ({ message }) => onLog(message));
    return ffmpegInstance;
  }
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const ff = new FFmpeg();
    if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
    if (onLog) ff.on("log", ({ message }) => onLog(message));
    await ff.load({
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegInstance = ff;
    return ff;
  })();

  return loadingPromise;
};

export const fetchFile = async (file: File): Promise<Uint8Array> => {
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf);
};
