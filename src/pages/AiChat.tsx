import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import avatarImg from "@/assets/wad-al-halal-avatar.png";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const defaultMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content:
      "حبابك عشرة يا زول! 👋 أنا ود الحلال، مساعدك الذكي السوداني. اسألني أي حاجة عن التطبيق أو أي شي تاني وأبشر!\n\nHello! I'm Wad Al-Halal, your Sudanese AI assistant. Ask me anything!",
  },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wad-chat`;

const AiChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { id: Date.now(), role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setIsLoading(true);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) {
          toast.error("في زحمة، جرب تاني بعد شوية يا زول.");
        } else if (resp.status === 402) {
          toast.error("الرصيد خلص. ضيف كريديتات من إعدادات Lovable AI.");
        } else {
          toast.error("ما قدرت أرد عليك الآن.");
        }
        setIsLoading(false);
        return;
      }

      const assistantId = Date.now() + 1;
      let assistantSoFar = "";
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: assistantSoFar } : m)),
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (err) {
      console.error("chat error:", err);
      toast.error("في مشكلة في الاتصال يا زول.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <button
          onClick={() => navigate("/")}
          className="p-1.5 rounded-xl hover:bg-muted transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-gold">
          <img src={avatarImg} alt="Wad Al-Halal" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold font-cairo text-foreground">ود الحلال</p>
          <p className="text-[10px] text-nile">{isLoading ? "بكتب..." : "Online"}</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line font-cairo ${
                msg.role === "user"
                  ? "gradient-gold text-primary-foreground rounded-br-md"
                  : "bg-card border border-border text-foreground rounded-bl-md"
              }`}
            >
              {msg.content || (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card/80 backdrop-blur-xl sticky bottom-0">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isLoading}
            placeholder="اكتب رسالتك... Type a message..."
            className="flex-1 h-11 rounded-full bg-muted border-0 px-4 text-sm font-cairo text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-11 h-11 rounded-full gradient-gold flex items-center justify-center shrink-0 active:scale-95 transition-transform disabled:opacity-50"
            aria-label="Send"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-primary-foreground" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChat;
