import { ArrowLeft, Upload, Share2, Link as LinkIcon, Copy, Check, ScanLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";

const ZoolShare = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [tempUrl, setTempUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-8">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={() => navigate("/")} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold font-cairo text-foreground" dir="rtl">زول شير</h1>
          <p className="text-[10px] text-muted-foreground">Zool Share — Files & Scanner</p>
        </div>
        <button
          onClick={() => navigate("/scanner")}
          className="px-3 py-1.5 rounded-full bg-card border border-border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-transform"
        >
          <ScanLine className="w-3.5 h-3.5" /> Scanner
        </button>
      </header>

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
    </div>
  );
};

export default ZoolShare;
