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
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 px-4 py-3 max-w-[220px] mb-2">
            <button
              onClick={() => setShowPromo(false)}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-sm text-slate-800 dark:text-slate-200 pr-4">
              <span className="font-bold">How can we help?</span> Chat with us now
            </p>
            {/* Tail */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white dark:bg-slate-800 border-r border-b border-slate-200 dark:border-slate-700 rotate-45" />
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => { setOpen(o => !o); setShowPromo(false); }}
        className="fixed bottom-24 md:bottom-6 right-4 z-50 w-14 h-14 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-xl flex items-center justify-center transition-all hover:scale-110"
        aria-label="Open Support Chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-40 md:bottom-24 right-4 z-50 w-[350px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden" style={{ height: '480px' }}>
          {/* Header */}
          <div className="bg-indigo-600 text-white px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Kharis</p>
              <p className="text-xs text-indigo-200">AI Assistant • Always here to help</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-4 w-4 text-indigo-600" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-sm"
                    : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-sm shadow-sm"
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
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Escalation Banner */}
          {showEscalate && !escalated && (
            <div className="px-3 py-2 bg-amber-50 border-t border-amber-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-amber-700">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Not satisfied? Notify an admin.</span>
              </div>
              <button
                onClick={handleEscalate}
                disabled={loading || escalated}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
              >
                Notify Admin
              </button>
            </div>
          )}

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Kharis anything about Khareus..."
              className="flex-1 text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}