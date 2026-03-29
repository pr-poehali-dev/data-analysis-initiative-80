import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/ui/icon";

const ASSISTANT_URL = "https://functions.poehali.dev/d46b436c-9add-4591-bbbc-c4fc89984e09";

interface Message {
  role: "user" | "assistant";
  content: string;
  actions?: { tool: string; result: string }[];
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const SUGGESTIONS = [
  "Отметь что Кузю покормили",
  "Купи корм для Умки",
  "Добавь задачу в Цех: проверить оборудование",
  "Запиши Шурика к ветеринару",
];

export default function AssistantChat({ onAction }: { onAction?: () => void }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Привет! Я твой личный ассистент Life·OS. Говори или пиши команды — выполню всё сам. Например: «Отметь что Кузю покормили»" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const history = messages.slice(1).map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(ASSISTANT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply, actions: data.actions }]);
      if (data.actions?.length > 0) onAction?.();
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Что-то пошло не так. Попробуй ещё раз." }]);
    }
    setLoading(false);
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "ru-RU";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      sendMessage(text);
    };
    rec.onend = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  const toolIcon = (tool: string) => {
    if (tool.includes("feed")) return "Utensils";
    if (tool.includes("task")) return "CheckSquare";
    if (tool.includes("business")) return "Briefcase";
    return "Zap";
  };

  return (
    <>
      {/* Плавающая кнопка */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-neutral-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-neutral-700 transition-colors"
      >
        <Icon name="MessageCircle" size={24} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-full max-w-sm bg-white shadow-2xl border border-neutral-200 flex flex-col"
            style={{ height: "520px" }}
          >
            {/* Шапка */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-900">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                  <Icon name="Bot" size={18} className="text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">Life·OS Ассистент</div>
                  <div className="text-neutral-400 text-xs">Голос и текст</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-white transition-colors">
                <Icon name="X" size={18} />
              </button>
            </div>

            {/* Сообщения */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] ${msg.role === "user" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-800"} px-4 py-3 text-sm leading-relaxed`}>
                    {msg.content}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1">
                        {msg.actions.map((a, j) => (
                          <div key={j} className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                            <Icon name={toolIcon(a.tool)} size={12} />
                            {a.result}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-neutral-100 px-4 py-3 flex items-center gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                        className="w-1.5 h-1.5 bg-neutral-400 rounded-full" />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Подсказки */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => sendMessage(s)}
                    className="flex-shrink-0 text-xs border border-neutral-200 text-neutral-600 px-3 py-1.5 hover:border-neutral-400 transition-colors whitespace-nowrap">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Ввод */}
            <div className="border-t border-neutral-100 px-4 py-3 flex items-center gap-2">
              <motion.button
                onClick={recording ? stopVoice : startVoice}
                animate={recording ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: recording ? Infinity : 0, duration: 1 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${recording ? "bg-red-500 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
              >
                <Icon name={recording ? "Square" : "Mic"} size={16} />
              </motion.button>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Напиши команду..."
                className="flex-1 text-sm border border-neutral-200 px-3 py-2 focus:outline-none focus:border-neutral-500"
              />
              <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
                className="w-9 h-9 bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-700 transition-colors disabled:opacity-40 flex-shrink-0">
                <Icon name="Send" size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
