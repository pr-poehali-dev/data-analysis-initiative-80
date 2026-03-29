import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";

export default function Hero() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "50vh"]);

  return (
    <div
      ref={container}
      className="relative flex items-center justify-center h-screen overflow-hidden"
    >
      <motion.div
        style={{ y }}
        className="absolute inset-0 w-full h-full"
      >
        <img
          src="/images/mountain-landscape.jpg"
          alt="Горный пейзаж — метафора пути"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </motion.div>

      <div className="relative z-10 text-center text-white px-6">
        <p className="uppercase tracking-widest text-sm mb-4 opacity-70">Твоя личная платформа</p>
        <h1 className="text-5xl md:text-7xl lg:text-9xl font-bold tracking-tight mb-6 leading-none">
          LIFE·OS
        </h1>
        <p className="text-lg md:text-xl max-w-xl mx-auto opacity-80 leading-relaxed">
          Надиктуй свой день — платформа сама распределит всё по категориям: семья, бизнес, друзья, хобби
        </p>
        <div className="mt-10 flex gap-4 justify-center">
          <button className="bg-white text-black px-8 py-3 uppercase tracking-wide text-sm font-medium hover:bg-neutral-200 transition-colors duration-300">
            Начать вести дневник
          </button>
          <button className="border border-white text-white px-8 py-3 uppercase tracking-wide text-sm hover:bg-white hover:text-black transition-colors duration-300">
            Как это работает
          </button>
        </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-white opacity-50"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}
