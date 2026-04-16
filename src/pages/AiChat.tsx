import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
    content: "أهلاً يا زول! أنا ود الحلال، مساعدك الذكي. كيف أقدر أساعدك اليوم؟\n\nHello! I'm Wad Al-Halal, your AI assistant. How can I help you today?",
  },
];

const AiChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulated AI response
    setTimeout(() => {
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "شكراً يا زول! هذه الميزة قيد التطوير حالياً. قريباً إن شاء الله!\n\nThanks! This feature is currently under development. Coming soon insha'Allah!",
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={() => navigate("/")} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-gold">
          <img src={avatarImg} alt="Wad Al-Halal" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold font-cairo text-foreground">ود الحلال</p>
          <p className="text-[10px] text-nile">Online</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border border-border text-foreground rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Mic className="w-4 h-4 text-muted-foreground" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="اكتب رسالتك... Type a message..."
            className="flex-1 h-10 rounded-full bg-muted border-0 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleSend}
            className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChat;
