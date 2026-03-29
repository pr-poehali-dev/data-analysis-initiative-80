import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";

const animals = [
  { name: "Кузя", type: "Кот", task: "Гадит — разобраться с причиной", attention: 70, emoji: "🐱" },
  { name: "Умка", type: "Кошка", task: "Записать к ветеринару", attention: 90, emoji: "🐈" },
  { name: "Шурик", type: "Попугай", task: "Купить подругу", attention: 55, emoji: "🦜" },
];

export default function Promo() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-10vh", "10vh"]);

  return (
    <div
      ref={container}
      className="relative flex items-center justify-center h-screen overflow-hidden"
      style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
    >
      <div className="fixed top-[-10vh] left-0 h-[120vh] w-full">
        <motion.div style={{ y }} className="relative w-full h-full">
          <img
            src="/images/spiral-circles.jpg"
            alt="Абстрактные паттерны"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </motion.div>
      </div>

      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center px-6">
        <p className="uppercase tracking-widest text-xs text-neutral-400 mb-4">Пример — Семья / Животные</p>
        <h2 className="text-white text-3xl lg:text-5xl font-bold mb-10 text-center">
          Индикаторы внимания
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
          {animals.map((animal) => (
            <div key={animal.name} className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 text-white">
              <div className="text-4xl mb-3">{animal.emoji}</div>
              <div className="font-bold text-lg">{animal.name}</div>
              <div className="text-neutral-400 text-sm mb-3">{animal.type}</div>
              <p className="text-sm text-neutral-200 mb-4 leading-relaxed">{animal.task}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${animal.attention}%`,
                      background: animal.attention > 80 ? "#ef4444" : animal.attention > 60 ? "#f59e0b" : "#22c55e",
                    }}
                  />
                </div>
                <span className="text-xs text-neutral-400">{animal.attention}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <h3 className="absolute top-12 right-6 text-white uppercase z-10 text-sm opacity-50">
        Ни один питомец не забыт
      </h3>
    </div>
  );
}
