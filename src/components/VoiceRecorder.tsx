import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/ui/icon";

interface VoiceRecorderProps {
  onResult?: (text: string) => void;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default function VoiceRecorder({ onResult }: VoiceRecorderProps) {
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const startRecording = () => {
    setError("");
    setResult("");
    setInterim("");

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Ваш браузер не поддерживает распознавание речи. Используйте Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ru-RU";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let final = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + " ";
        } else {
          interimText += event.results[i][0].transcript;
        }
      }
      if (final) setResult(final.trim());
      setInterim(interimText);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setError("Нет доступа к микрофону. Разрешите его в браузере.");
      } else if (event.error === "no-speech") {
        setError("Речь не обнаружена. Попробуй ещё раз.");
      } else {
        setError(`Ошибка: ${event.error}`);
      }
      setRecording(false);
    };

    recognition.onend = () => {
      setRecording(false);
      setInterim("");
    };

    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
    setInterim("");
  };

  const handleDone = () => {
    if (result) onResult?.(result);
    setOpen(false);
  };

  const handleClose = () => {
    if (!recording) {
      recognitionRef.current?.stop();
      setOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => { setResult(""); setError(""); setInterim(""); setOpen(true); }}
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
            onClick={(e) => e.target === e.currentTarget && handleClose()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md p-8 relative"
            >
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900"
              >
                <Icon name="X" size={20} />
              </button>

              <h2 className="text-xl font-bold text-neutral-900 mb-1">Голосовая запись</h2>
              <p className="text-neutral-500 text-sm mb-8">
                Расскажи о своём дне — платформа сохранит всё по категориям
              </p>

              <div className="flex flex-col items-center gap-6">
                {!recording && !result && (
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
                    {interim && (
                      <p className="text-sm text-neutral-400 italic text-center px-2">{interim}</p>
                    )}
                  </>
                )}

                {result && !recording && (
                  <div className="w-full">
                    <div className="bg-neutral-50 border border-neutral-200 p-4 rounded text-neutral-800 text-sm leading-relaxed mb-4">
                      {result}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setResult(""); setError(""); startRecording(); }}
                        className="flex-1 border border-neutral-300 text-neutral-700 py-2.5 text-sm uppercase tracking-wide hover:border-neutral-600 transition-colors"
                      >
                        Записать ещё
                      </button>
                      <button
                        onClick={handleDone}
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
