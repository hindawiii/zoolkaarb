import { ArrowLeft, Upload, Download, Loader2, FileDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { pickSudaneseMessage } from "@/lib/sudaneseLoading";
import { toast } from "@/hooks/use-toast";

const formatBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
};

const DataSaver = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [original, setOriginal] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [compressed, setCompressed] = useState<File | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setOriginal(f);
    setOriginalUrl(URL.createObjectURL(f));
    setCompressed(null);
    setCompressedUrl(null);
    await compress(f);
  };

  const compress = async (f: File) => {
    setLoading(true);
    setMsg(pickSudaneseMessage());
    try {
      const out = await imageCompression(f, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.8,
      });
      setCompressed(out);
      setCompressedUrl(URL.createObjectURL(out));
    } catch (err) {
      toast({
        title: "حصل خطأ",
        description: err instanceof Error ? err.message : "Compression failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!compressed || !compressedUrl) return;
    const a = document.createElement("a");
    a.href = compressedUrl;
    a.download = `compressed-${compressed.name}`;
    a.click();
  };

  const savedPct =
    original && compressed ? Math.max(0, Math.round((1 - compressed.size / original.size) * 100)) : 0;

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-8">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={() => navigate("/")} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-base font-bold font-cairo text-foreground" dir="rtl">موفر البيانات</h1>
          <p className="text-[10px] text-muted-foreground">Data Saver — Image Compression</p>
        </div>
      </header>

      <div className="px-5 mt-5 space-y-4">
        {!original && (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-3xl border-2 border-dashed border-border bg-card p-10 flex flex-col items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-gold/20 flex items-center justify-center">
              <Upload className="w-6 h-6 text-gold" />
            </div>
            <p className="text-sm font-semibold text-foreground">Upload an image</p>
            <p className="text-xs text-muted-foreground font-cairo" dir="rtl">ارفع صورة وانضغطها ليك</p>
          </button>
        )}

        {originalUrl && (
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <img src={compressedUrl ?? originalUrl} alt="preview" className="w-full aspect-square object-contain bg-muted" />
            <div className="p-4 space-y-3">
              {original && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Original</span>
                  <span className="font-semibold text-foreground">{formatBytes(original.size)}</span>
                </div>
              )}
              {compressed && (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Compressed</span>
                    <span className="font-semibold text-gold">{formatBytes(compressed.size)}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-2 border-t border-border">
                    <span className="text-muted-foreground">Saved</span>
                    <span className="font-bold text-nile">{savedPct}%</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="rounded-2xl bg-card border border-border p-5 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-gold animate-spin shrink-0" />
            <p className="text-sm font-cairo text-foreground" dir="rtl">{msg}</p>
          </div>
        )}

        {compressed && !loading && (
          <button
            onClick={download}
            className="w-full rounded-full gradient-gold text-primary-foreground py-3.5 font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Download className="w-4 h-4" /> Download Compressed
          </button>
        )}

        {original && !loading && (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-full border border-border py-3 text-sm font-semibold text-foreground flex items-center justify-center gap-2"
          >
            <FileDown className="w-4 h-4" /> Pick another image
          </button>
        )}

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePick} />
      </div>
    </div>
  );
};

export default DataSaver;
