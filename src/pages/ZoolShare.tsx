import {
  ArrowLeft,
  Upload,
  Share2,
  Link as LinkIcon,
  Copy,
  Check,
  ScanLine,
  Wifi,
  WifiOff,
  Radio,
  Download,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { useP2PShare } from "@/hooks/useP2PShare";

const ZoolShare = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const p2pFileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [tempUrl, setTempUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [localMode, setLocalMode] = useState(false);
  const [p2pRole, setP2pRole] = useState<"sender" | "receiver" | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const p2p = useP2PShare();

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (tempUrl) URL.revokeObjectURL(tempUrl);
    setTempUrl(URL.createObjectURL(f));
    setCopied(false);
  };

  const nativeShare = async () => {
    if (!file) return;
    const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Zool Share", text: "Shared via Zool 🇸🇩" });
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          toast({ title: "Share cancelled", description: (e as Error).message });
        }
      }
    } else {
      toast({
        title: "ما مدعوم",
        description: "Native share not available — use the link below or WhatsApp/Telegram buttons.",
      });
    }
  };

  const copyLink = async () => {
    if (!tempUrl) return;
    await navigator.clipboard.writeText(tempUrl);
    setCopied(true);
    toast({ title: "تمام!", description: "Link copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTo = (target: "whatsapp" | "telegram") => {
    const text = encodeURIComponent(`Check this file via Zool Share: ${tempUrl}`);
    const url =
      target === "whatsapp"
        ? `https://wa.me/?text=${text}`
        : `https://t.me/share/url?url=${encodeURIComponent(tempUrl ?? "")}&text=Zool%20Share`;
    window.open(url, "_blank");
  };

  // ===== P2P flow =====
  const startAsSender = async () => {
    setP2pRole("sender");
    try {
      await p2p.startSender();
      toast({
        title: "الخال جهّز الكود",
        description: "أدّي الكود للمستلم وخلّيهو يفتح زول شير في وضع الاستلام",
      });
    } catch (e) {
      toast({ title: "ما زبط", description: (e as Error).message });
    }
  };

  const startAsReceiver = async () => {
    if (joinCode.length !== 6) {
      toast({ title: "كود ناقص", description: "أدخل 6 أرقام" });
      return;
    }
    setP2pRole("receiver");
    try {
      await p2p.startReceiver(joinCode);
    } catch (e) {
      toast({ title: "ما زبط", description: (e as Error).message });
    }
  };

  // When connected and sender has a pending file, push it
  useEffect(() => {
    if (p2pRole === "sender" && p2p.status === "connected" && pendingFile) {
      p2p.sendFile(pendingFile);
      toast({
        title: "الخال ربط الأجهزة",
        description: "أرسل ملفاتك بالهواء وبدون رصيد!",
      });
    }
  }, [p2p.status, p2pRole, pendingFile, p2p]);

  // Auto-fallback toast
  useEffect(() => {
    if (p2p.status === "fallback") {
      toast({
        title: "رجعنا للرابط الكلاودي",
        description: "ما قدرنا نوصّل مباشرة، استخدم الرابط فوق",
      });
      setLocalMode(false);
      setP2pRole(null);
    }
  }, [p2p.status]);

  const onPickP2PFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPendingFile(f);
  };

  const downloadReceived = () => {
    if (!p2p.receivedUrl) return;
    const a = document.createElement("a");
    a.href = p2p.receivedUrl;
    a.download = p2p.receivedName || "zool-share-file";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const resetP2P = () => {
    p2p.reset();
    setP2pRole(null);
    setPendingFile(null);
    setJoinCode("");
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-8">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={() => navigate("/")} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold font-cairo text-foreground" dir="rtl">زول شير</h1>
          <p className="text-[10px] text-muted-foreground">Zool Share — Files & P2P</p>
        </div>
        <button
          onClick={() => navigate("/scanner")}
          className="px-3 py-1.5 rounded-full bg-card border border-border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-transform"
        >
          <ScanLine className="w-3.5 h-3.5" /> Scanner
        </button>
      </header>

      {/* Local P2P toggle */}
      <div className="px-5 mt-4">
        <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3" dir="rtl">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              localMode ? "bg-nile/15 text-nile" : "bg-muted text-muted-foreground"
            }`}
          >
            {localMode ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground font-cairo">إرسال محلي (بدون إنترنت)</p>
            <p className="text-[11px] text-muted-foreground">
              نفس الواي فاي → الملف يمشي مباشرة بين الأجهزة
            </p>
          </div>
          <Switch
            checked={localMode}
            onCheckedChange={(v) => {
              setLocalMode(v);
              if (!v) resetP2P();
            }}
          />
        </div>
      </div>

      {/* P2P MODE */}
      {localMode && (
        <div className="px-5 mt-4 space-y-4">
          {!p2pRole && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={startAsSender}
                className="rounded-2xl bg-card border border-border p-5 flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center">
                  <Radio className="w-6 h-6 text-gold" />
                </div>
                <p className="text-sm font-bold text-foreground">إرسال</p>
                <p className="text-[10px] text-muted-foreground">Send a file</p>
              </button>
              <button
                onClick={() => setP2pRole("receiver")}
                className="rounded-2xl bg-card border border-border p-5 flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 rounded-xl bg-nile/15 flex items-center justify-center">
                  <Download className="w-6 h-6 text-nile" />
                </div>
                <p className="text-sm font-bold text-foreground">استلام</p>
                <p className="text-[10px] text-muted-foreground">Receive a file</p>
              </button>
            </div>
          )}

          {p2pRole === "sender" && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-card border border-border p-5 text-center" dir="rtl">
                <p className="text-xs text-muted-foreground font-cairo">شارك الكود ده مع المستلم</p>
                <p className="text-4xl font-bold tracking-[0.4em] text-foreground mt-2 font-mono">
                  {p2p.code || "------"}
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-1 rounded-full ${
                      p2p.status === "connected" || p2p.status === "transferring" || p2p.status === "done"
                        ? "bg-nile/15 text-nile"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p2p.status === "waiting" && "في انتظار المستلم..."}
                    {p2p.status === "connecting" && "جاري التوصيل..."}
                    {p2p.status === "connected" && "متصل ✓"}
                    {p2p.status === "transferring" && `إرسال ${p2p.progress}%`}
                    {p2p.status === "done" && "تم الإرسال ✓"}
                    {p2p.status === "error" && "خطأ"}
                  </span>
                  {p2p.usingLocalCandidate === true && (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-gold/15 text-gold">LAN</span>
                  )}
                </div>
              </div>

              {!pendingFile ? (
                <button
                  onClick={() => p2pFileRef.current?.click()}
                  className="w-full rounded-3xl border-2 border-dashed border-border bg-card p-8 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
                >
                  <Upload className="w-6 h-6 text-sand-dark" />
                  <p className="text-sm font-semibold text-foreground">اختار الملف</p>
                  <p className="text-[11px] text-muted-foreground">يبدأ الإرسال تلقائياً لما يتصل المستلم</p>
                </button>
              ) : (
                <div className="rounded-2xl bg-card border border-border p-4">
                  <p className="text-sm font-semibold text-foreground truncate">{pendingFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(pendingFile.size / 1024).toFixed(1)} KB</p>
                  {(p2p.status === "transferring" || p2p.status === "done") && (
                    <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full gradient-gold transition-all"
                        style={{ width: `${p2p.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={resetP2P}
                className="w-full rounded-full border border-border py-3 text-sm font-semibold text-foreground flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> إعادة
              </button>
            </div>
          )}

          {p2pRole === "receiver" && (
            <div className="space-y-4" dir="rtl">
              {p2p.status === "idle" && (
                <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
                  <p className="text-sm font-bold text-foreground font-cairo">أدخل الكود من المرسل</p>
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full text-center text-3xl font-mono tracking-[0.4em] py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="------"
                    dir="ltr"
                  />
                  <button
                    onClick={startAsReceiver}
                    className="w-full rounded-full gradient-gold text-primary-foreground py-3 font-semibold active:scale-95 transition-transform"
                  >
                    اتصل
                  </button>
                </div>
              )}

              {p2p.status !== "idle" && (
                <div className="rounded-2xl bg-card border border-border p-5 text-center">
                  <p className="text-xs text-muted-foreground">
                    {p2p.status === "connecting" && "جاري التوصيل..."}
                    {p2p.status === "connected" && "متصل — في انتظار الملف"}
                    {p2p.status === "transferring" && `استلام ${p2p.progress}%`}
                    {p2p.status === "done" && "وصل الملف ✓"}
                    {p2p.status === "error" && "خطأ في التوصيل"}
                  </p>
                  {p2p.incoming && (
                    <div className="mt-3 text-start">
                      <p className="text-sm font-semibold text-foreground truncate">{p2p.incoming.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(p2p.incoming.size / 1024).toFixed(1)} KB
                      </p>
                      <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full gradient-gold transition-all"
                          style={{ width: `${p2p.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {p2p.status === "done" && p2p.receivedUrl && (
                    <button
                      onClick={downloadReceived}
                      className="mt-4 w-full rounded-full gradient-gold text-primary-foreground py-3 font-semibold flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Download className="w-4 h-4" /> حفظ الملف
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={resetP2P}
                className="w-full rounded-full border border-border py-3 text-sm font-semibold text-foreground flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> إعادة
              </button>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground text-center font-cairo" dir="rtl">
            الملف بيمشي مباشرة بين الأجهزة. لو ما اشتغل، حنرجع تلقائياً للرابط الكلاودي.
          </p>

          <input ref={p2pFileRef} type="file" className="hidden" onChange={onPickP2PFile} />
        </div>
      )}

      {/* CLOUD/LOCAL LINK MODE (existing) */}
      {!localMode && (
        <div className="px-5 mt-5 space-y-4">
          {!file && (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-3xl border-2 border-dashed border-border bg-card p-10 flex flex-col items-center gap-3 active:scale-[0.98] transition-transform"
            >
              <div className="w-14 h-14 rounded-2xl bg-sand-dark/20 flex items-center justify-center">
                <Upload className="w-6 h-6 text-sand-dark" />
              </div>
              <p className="text-sm font-semibold text-foreground">Pick a file to share</p>
              <p className="text-xs text-muted-foreground font-cairo" dir="rtl">اختار ملف وأرسلو لأي زول</p>
            </button>
          )}

          {file && (
            <>
              <div className="rounded-2xl bg-card border border-border p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB · {file.type || "file"}
                </p>
              </div>

              <button
                onClick={nativeShare}
                className="w-full rounded-full gradient-gold text-primary-foreground py-3.5 font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Share2 className="w-4 h-4" /> Share via device
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => shareTo("whatsapp")}
                  className="rounded-2xl bg-card border border-border py-3 text-sm font-semibold text-foreground active:scale-95 transition-transform"
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => shareTo("telegram")}
                  className="rounded-2xl bg-card border border-border py-3 text-sm font-semibold text-foreground active:scale-95 transition-transform"
                >
                  Telegram
                </button>
              </div>

              {tempUrl && (
                <div className="rounded-2xl bg-card border border-border p-3 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-nile shrink-0" />
                  <span className="text-[11px] text-muted-foreground flex-1 truncate">{tempUrl}</span>
                  <button
                    onClick={copyLink}
                    className="px-3 py-1.5 rounded-full bg-muted text-xs font-semibold flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-nile" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground text-center font-cairo" dir="rtl">
                الرابط مؤقت ويشتغل في هذا الجهاز فقط
              </p>

              <button
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-full border border-border py-3 text-sm font-semibold text-foreground"
              >
                Pick another file
              </button>
            </>
          )}

          <input ref={fileRef} type="file" className="hidden" onChange={onPick} />
        </div>
      )}
    </div>
  );
};

export default ZoolShare;
