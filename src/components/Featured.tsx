import { useState } from "react";
import Icon from "@/components/ui/icon";
import VoiceRecorder from "@/components/VoiceRecorder";
import PetsManager from "@/components/PetsManager";

type SubcategorySimple = string;
type SubcategoryRich = { label: string; icon: string; desc: string };
type Subcategory = SubcategorySimple | SubcategoryRich;

const categories = [
  {
    id: "family",
    label: "Семья",
    icon: "Heart",
    color: "bg-rose-500",
    subcategories: ["Моя семья", "Родители", "Родственники", "Ушедшие", "Животные"] as Subcategory[],
    attention: 82,
    tasks: 3,
  },
  {
    id: "business",
    label: "Бизнес",
    icon: "Briefcase",
    color: "bg-blue-500",
    subcategories: [
      { label: "Цех", icon: "Factory", desc: "Производство" },
      { label: "Опт. продажи", icon: "ShoppingCart", desc: "Оптовые клиенты" },
      { label: "Сотрудники", icon: "Users", desc: "Команда" },
      { label: "Проблемы", icon: "AlertTriangle", desc: "Текущие проблемы" },
      { label: "Цели", icon: "Target", desc: "Стратегия" },
      { label: "Что имеем", icon: "Package", desc: "Активы и ресурсы" },
      { label: "Баланс", icon: "BarChart2", desc: "Финансы" },
    ] as Subcategory[],
    attention: 65,
    tasks: 7,
  },
  {
    id: "friends",
    label: "Друзья",
    icon: "Users",
    color: "bg-amber-500",
    subcategories: ["Близкие", "Знакомые", "Нетворкинг", "Встречи"] as Subcategory[],
    attention: 40,
    tasks: 2,
  },
  {
    id: "hobby",
    label: "Хобби",
    icon: "Sparkles",
    color: "bg-emerald-500",
    subcategories: ["Спорт", "Творчество", "Путешествия", "Саморазвитие"] as Subcategory[],
    attention: 55,
    tasks: 4,
  },
];

function AttentionBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function SubcategoryCard({ sub, isBusiness }: { sub: Subcategory; isBusiness: boolean }) {
  if (isBusiness && typeof sub === "object") {
    const rich = sub as SubcategoryRich;
    return (
      <div className="bg-neutral-50 border border-neutral-100 px-5 py-5 flex flex-col gap-2 group hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
            <Icon name={rich.icon} size={16} className="text-blue-600" />
          </div>
          <Icon name="ChevronRight" size={14} className="text-neutral-300 group-hover:text-blue-500 transition-colors" />
        </div>
        <div>
          <div className="font-semibold text-neutral-900 text-sm">{rich.label}</div>
          <div className="text-xs text-neutral-400 mt-0.5">{rich.desc}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 border border-neutral-100 px-5 py-4 flex items-center justify-between group hover:border-neutral-300 transition-colors cursor-pointer">
      <span className="text-neutral-800 font-medium">{sub as string}</span>
      <Icon name="ChevronRight" size={16} className="text-neutral-400 group-hover:text-neutral-700 transition-colors" />
    </div>
  );
}

export default function Featured({ refreshKey }: { refreshKey?: number }) {
  const [active, setActive] = useState("family");
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const current = categories.find((c) => c.id === active)!;
  const isBusiness = active === "business";
  const isPets = active === "family" && activeSub === "Животные";

  return (
    <div id="categories" className="min-h-screen px-6 py-20 bg-white flex flex-col justify-center">
      <div className="max-w-6xl mx-auto w-full">
        <p className="uppercase text-xs tracking-widest text-neutral-400 mb-3">Платформа</p>
        <h2 className="text-4xl lg:text-6xl font-bold text-neutral-900 mb-4 leading-tight">
          Четыре сферы жизни
        </h2>
        <p className="text-neutral-500 max-w-xl mb-16 text-lg">
          Каждая область разбита на подкатегории. Индикатор внимания показывает, где нужно уделить больше времени.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActive(cat.id)}
              className={`p-6 border-2 text-left transition-all duration-300 ${
                active === cat.id
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400"
              }`}
            >
              <Icon name={cat.icon} size={28} className="mb-3" />
              <div className="font-bold text-lg mb-1">{cat.label}</div>
              <div className={`text-xs mb-3 ${active === cat.id ? "text-neutral-400" : "text-neutral-500"}`}>
                {cat.tasks} задачи
              </div>
              <AttentionBar
                value={cat.attention}
                color={active === cat.id ? "bg-white" : cat.color}
              />
            </button>
          ))}
        </div>

        <div className="border border-neutral-200 p-8 lg:p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-12 h-12 rounded-full ${current.color} flex items-center justify-center`}>
              <Icon name={current.icon} size={22} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-neutral-900">{current.label}</h3>
              <p className="text-neutral-500 text-sm">Индикатор внимания: {current.attention}%</p>
            </div>
          </div>

          <div className={`grid gap-4 ${isBusiness ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-2 lg:grid-cols-4"}`}>
            {current.subcategories.map((sub, i) => {
              const label = typeof sub === "string" ? sub : sub.label;
              return (
                <div
                  key={i}
                  onClick={() => setActiveSub(activeSub === label ? null : label)}
                  className={`cursor-pointer transition-all ${activeSub === label ? "ring-2 ring-neutral-900" : ""}`}
                >
                  <SubcategoryCard sub={sub} isBusiness={isBusiness} />
                </div>
              );
            })}
          </div>

          {isPets && <PetsManager key={refreshKey} />}

          <div className="mt-8 pt-8 border-t border-neutral-100 flex items-center gap-3">
            <VoiceRecorder />
            <button className="border border-neutral-300 text-neutral-700 px-6 py-2.5 text-sm uppercase tracking-wide hover:border-neutral-600 transition-colors flex items-center gap-2">
              <Icon name="Plus" size={16} />
              Добавить подкатегорию
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}