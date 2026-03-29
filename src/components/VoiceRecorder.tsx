import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/ui/icon";

const TRANSCRIBE_URL = "https://functions.poehali.dev/7459322a-fe72-48af-aa5b-ea94813655eb";

interface VoiceRecorderProps {
  onResult?: (text: string) => void;
}

export default function VoiceRecorder({ onResult }: VoiceRecorderProps) {
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setError("");
    setResult("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        await transcribe(blob, mimeType);
      };
      recorder.start();
      mediaRef.current = recorder;
      setRecording(true);
    } catch {
      setError("Нет доступа к микрофону. Разрешите его в браузере.");
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
    setLoading(true);
  };

  const transcribe = async (blob: Blob, mimeType: string) => {
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetch(TRANSCRIBE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: base64, mimeType }),
        });
        const data = await res.json();
        setLoading(false);
        if (data.text) {
          setResult(data.text);
          onResult?.(data.text);
        } else {
          setError("Не удалось распознать речь. Попробуй ещё раз.");
        }
      };
      reader.readAsDataURL(blob);
    } catch {
      setLoading(false);
      setError("Ошибка при отправке. Проверь соединение.");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-black text-white px-6 py-2.5 text-sm uppercase tracking-wide hover:bg-neutral-800 transition-colors flex items-center gap-2"
      >
        <Icon name="Mic" size={16} />
        Надиктовать запись
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4"
            onClick={(e) => e.target === e.currentTarget && !recording && setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md p-8 relative"
            >
              <button
                onClick={() => !recording && setOpen(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900"
              >
                <Icon name="X" size={20} />
              </button>

              <h2 className="text-xl font-bold text-neutral-900 mb-1">Голосовая запись</h2>
              <p className="text-neutral-500 text-sm mb-8">
                Расскажи о своём дне — ИИ распознает и сохранит
              </p>

              <div className="flex flex-col items-center gap-6">
                {!recording && !loading && !result && (
                  <button
                    onClick={startRecording}
                    className="w-20 h-20 rounded-full bg-black flex items-center justify-center hover:bg-neutral-800 transition-colors"
                  >
                    <Icon name="Mic" size={32} className="text-white" />
                  </button>
                )}

                {recording && (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center cursor-pointer"
                      onClick={stopRecording}
                    >
                      <Icon name="Square" size={28} className="text-white" />
                    </motion.div>
                    <p className="text-sm text-neutral-500">Говори... Нажми чтобы остановить</p>
                  </>
                )}

                {loading && (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-20 h-20 rounded-full border-4 border-neutral-200 border-t-black"
                    />
                    <p className="text-sm text-neutral-500">Распознаю речь...</p>
                  </>
                )}

                {result && (
                  <div className="w-full">
                    <div className="bg-neutral-50 border border-neutral-200 p-4 rounded text-neutral-800 text-sm leading-relaxed mb-4">
                      {result}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setResult(""); setError(""); }}
                        className="flex-1 border border-neutral-300 text-neutral-700 py-2.5 text-sm uppercase tracking-wide hover:border-neutral-600 transition-colors"
                      >
                        Записать ещё
                      </button>
                      <button
                        onClick={() => setOpen(false)}
                        className="flex-1 bg-black text-white py-2.5 text-sm uppercase tracking-wide hover:bg-neutral-800 transition-colors"
                      >
                        Готово
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="w-full bg-red-50 border border-red-200 p-4 text-red-700 text-sm rounded">
                    {error}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
