import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Loader2, Bot, User, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function SupportChatBot() {
  const [open, setOpen] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "👋 Hi! I'm Kharis, your Khareus support assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const bottomRef = useRef(null);
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!open) setShowPromo(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages.slice(1); // exclude initial greeting
      const { data } = await base44.functions.invoke("supportChat", {
        message: userMessage,
        history: history.slice(-10),
        sessionId: sessionId.current
      });

      const reply = data.reply || "Sorry, I couldn't process that. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);

      // Show escalation option only if AI suggests it or after 5+ user messages
      const aiSuggestsEscalation = reply.toLowerCase().includes('notify an admin') || reply.toLowerCase().includes('escalate');
      const userMessageCount = newMessages.filter(m => m.role === "user").length;
      if (aiSuggestsEscalation || userMessageCount >= 5) {
        setShowEscalate(true);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke("supportChat", { notifyAdmin: true, sessionId: sessionId.current, history: messages.slice(1).slice(-10) });
      setEscalated(true);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "✅ An admin has been notified and will join this chat shortly. You can also reach out via the **Messages** section."
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Failed to notify admin. Please try the Messages section directly." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Promo Tooltip */}
      {showPromo && !open && (
        <div className="fixed bottom-40 md:bottom-24 right-4 z-50 flex flex-col items-end">
          <div className="relative bg-linen dark:bg-[#221D19] rounded-none border border-[rgba(59,50,43,0.16)] dark:border-[rgba(241,232,224,0.18)] px-4 py-3 max-w-[220px] mb-2">
            <button
              onClick={() => setShowPromo(false)}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-sm text-ink dark:text-[#F1E8E0] pr-4">
              <span className="font-serif text-base">How can we help?</span> Chat with us now
            </p>
            {/* Tail */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-linen dark:bg-[#221D19] border-r border-b border-[rgba(59,50,43,0.16)] dark:border-[rgba(241,232,224,0.18)] rotate-45" />
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => { setOpen(o => !o); setShowPromo(false); }}
        className="fixed bottom-24 md:bottom-6 right-4 z-50 w-14 h-14 rounded-full bg-ink hover:bg-ink-deep text-cream border border-[rgba(169,126,46,0.5)] flex items-center justify-center transition-colors"
        aria-label="Open Support Chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-40 md:bottom-24 right-4 z-50 w-[350px] max-w-[calc(100vw-2rem)] bg-cream dark:bg-[#1B1714] rounded-none border border-[rgba(59,50,43,0.18)] dark:border-[rgba(241,232,224,0.18)] flex flex-col overflow-hidden" style={{ height: '480px' }}>
          {/* Header */}
          <div className="bg-ink text-cream px-4 py-3 flex items-center gap-3 border-b border-gold/40">
            <div className="w-9 h-9 rounded-full bg-cream/10 border border-gold/40 flex items-center justify-center">
              <Bot className="h-5 w-5 text-gold-dark" />
            </div>
            <div>
              <p className="font-serif text-base leading-none mb-1">Kharis</p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-cream/60">AI Assistant • Always here to help</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-cream dark:bg-[#1B1714]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-linen dark:bg-[#221D19] border border-gold/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-4 w-4 text-gold-text dark:text-gold-dark" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-none px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-ink text-cream"
                    : "bg-linen dark:bg-[#221D19] text-ink dark:text-[#F1E8E0] border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)]"
                }`}>
                  {msg.role === "assistant" ? (
                    <ReactMarkdown className="prose prose-sm max-w-none [&>p]:m-0 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-ink flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="h-4 w-4 text-cream" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-linen dark:bg-[#221D19] border border-gold/40 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-gold-text dark:text-gold-dark" />
                </div>
                <div className="bg-linen dark:bg-[#221D19] border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] rounded-none px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gold-text dark:text-gold-dark" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Escalation Banner */}
          {showEscalate && !escalated && (
            <div className="px-3 py-2 bg-linen dark:bg-[#221D19] border-t border-gold/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-ink/70 dark:text-[#F1E8E0]/70">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Not satisfied? Notify an admin.</span>
              </div>
              <button
                onClick={handleEscalate}
                disabled={loading || escalated}
                className="text-[11px] uppercase tracking-[0.14em] text-gold-text dark:text-gold-dark hover:text-ink dark:hover:text-[#F1E8E0] whitespace-nowrap"
              >
                Notify Admin
              </button>
            </div>
          )}

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-[rgba(59,50,43,0.18)] dark:border-[rgba(241,232,224,0.18)] bg-cream dark:bg-[#1B1714] flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Kharis anything about Khareus..."
              className="flex-1 text-sm border border-[rgba(59,50,43,0.18)] dark:border-[rgba(241,232,224,0.18)] rounded-none px-3 py-2 focus:outline-none focus:border-gold bg-linen dark:bg-[#221D19] text-ink dark:text-[#F1E8E0] placeholder:text-ink/40"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-none bg-ink hover:bg-ink-deep text-cream flex items-center justify-center disabled:opacity-40 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}