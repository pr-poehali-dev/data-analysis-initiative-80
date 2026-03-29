interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  return (
    <header className={`absolute top-0 left-0 right-0 z-10 p-6 ${className ?? ""}`}>
      <div className="flex justify-between items-center">
        <div className="text-white text-sm uppercase tracking-widest font-bold">Life·OS</div>
        <nav className="flex gap-8">
          <a
            href="#categories"
            className="text-white hover:text-neutral-400 transition-colors duration-300 uppercase text-sm"
          >
            Категории
          </a>
          <a
            href="#start"
            className="text-white hover:text-neutral-400 transition-colors duration-300 uppercase text-sm border border-white px-4 py-1 hover:bg-white hover:text-black"
          >
            Начать
          </a>
        </nav>
      </div>
    </header>
  );
}
