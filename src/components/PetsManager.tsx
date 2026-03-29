import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/ui/icon";

interface Task {
  id: number;
  text: string;
  done: boolean;
  type: "buy" | "todo";
}

interface Pet {
  id: number;
  name: string;
  type: string;
  emoji: string;
  fed: boolean;
  fedTime?: string;
  tasks: Task[];
}

const initialPets: Pet[] = [
  {
    id: 1, name: "Кузя", type: "Кот", emoji: "🐱", fed: false,
    tasks: [{ id: 1, text: "Разобраться почему гадит", done: false, type: "todo" }],
  },
  {
    id: 2, name: "Умка", type: "Кошка", emoji: "🐈", fed: false,
    tasks: [{ id: 2, text: "Записать к ветеринару", done: false, type: "todo" }],
  },
  {
    id: 3, name: "Шурик", type: "Попугай", emoji: "🦜", fed: false,
    tasks: [{ id: 3, text: "Купить подругу", done: false, type: "buy" }],
  },
];

function attentionColor(score: number) {
  if (score >= 80) return "bg-red-500";
  if (score >= 50) return "bg-amber-400";
  return "bg-emerald-500";
}

function calcAttention(pet: Pet) {
  const undone = pet.tasks.filter((t) => !t.done).length;
  const base = pet.fed ? 0 : 40;
  return Math.min(100, base + undone * 20);
}

export default function PetsManager() {
  const [pets, setPets] = useState<Pet[]>(initialPets);
  const [activePet, setActivePet] = useState<Pet | null>(null);
  const [newTask, setNewTask] = useState("");
  const [newTaskType, setNewTaskType] = useState<"buy" | "todo">("todo");
  const [newPetName, setNewPetName] = useState("");
  const [newPetType, setNewPetType] = useState("");
  const [showAddPet, setShowAddPet] = useState(false);

  const updatePet = (updated: Pet) => {
    setPets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setActivePet(updated);
  };

  const toggleFed = (pet: Pet) => {
    const time = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    updatePet({ ...pet, fed: !pet.fed, fedTime: !pet.fed ? time : undefined });
  };

  const toggleTask = (pet: Pet, taskId: number) => {
    updatePet({ ...pet, tasks: pet.tasks.map((t) => t.id === taskId ? { ...t, done: !t.done } : t) });
  };

  const addTask = (pet: Pet) => {
    if (!newTask.trim()) return;
    const task: Task = { id: Date.now(), text: newTask.trim(), done: false, type: newTaskType };
    updatePet({ ...pet, tasks: [...pet.tasks, task] });
    setNewTask("");
  };

  const deleteTask = (pet: Pet, taskId: number) => {
    updatePet({ ...pet, tasks: pet.tasks.filter((t) => t.id !== taskId) });
  };

  const addPet = () => {
    if (!newPetName.trim()) return;
    const emojis: Record<string, string> = { кот: "🐱", кошка: "🐈", собака: "🐶", попугай: "🦜", кролик: "🐰", хомяк: "🐹" };
    const emoji = emojis[newPetType.toLowerCase()] ?? "🐾";
    const pet: Pet = { id: Date.now(), name: newPetName.trim(), type: newPetType || "Питомец", emoji, fed: false, tasks: [] };
    setPets((prev) => [...prev, pet]);
    setNewPetName("");
    setNewPetType("");
    setShowAddPet(false);
  };

  return (
    <div className="mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {pets.map((pet) => {
          const attention = calcAttention(pet);
          return (
            <button
              key={pet.id}
              onClick={() => setActivePet(activePet?.id === pet.id ? null : pet)}
              className={`p-5 border-2 text-left transition-all duration-300 ${activePet?.id === pet.id ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white hover:border-neutral-400"}`}
            >
              <div className="text-3xl mb-2">{pet.emoji}</div>
              <div className="font-bold text-base">{pet.name}</div>
              <div className={`text-xs mb-3 ${activePet?.id === pet.id ? "text-neutral-400" : "text-neutral-500"}`}>{pet.type}</div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${activePet?.id === pet.id ? "bg-white" : attentionColor(attention)}`} style={{ width: `${attention}%` }} />
                </div>
                <span className={`text-xs ${activePet?.id === pet.id ? "text-neutral-400" : "text-neutral-500"}`}>{attention}%</span>
              </div>
              <div className={`text-xs ${pet.fed ? "text-emerald-600" : "text-red-500"} ${activePet?.id === pet.id ? "opacity-80" : ""}`}>
                {pet.fed ? `Накормлен в ${pet.fedTime}` : "Не кормили сегодня"}
              </div>
            </button>
          );
        })}

        <button
          onClick={() => setShowAddPet(true)}
          className="p-5 border-2 border-dashed border-neutral-300 text-neutral-400 hover:border-neutral-500 hover:text-neutral-600 transition-colors flex flex-col items-center justify-center gap-2"
        >
          <Icon name="Plus" size={24} />
          <span className="text-sm">Добавить питомца</span>
        </button>
      </div>

      <AnimatePresence>
        {activePet && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border border-neutral-200 p-6 bg-neutral-50"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{activePet.emoji}</span>
                <div>
                  <h4 className="font-bold text-lg text-neutral-900">{activePet.name}</h4>
                  <p className="text-sm text-neutral-500">{activePet.type}</p>
                </div>
              </div>
              <button
                onClick={() => toggleFed(activePet)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${activePet.fed ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-neutral-900 text-white hover:bg-neutral-700"}`}
              >
                <Icon name={activePet.fed ? "CheckCircle" : "Utensils"} size={16} />
                {activePet.fed ? `Накормлен в ${activePet.fedTime}` : "Отметить кормление"}
              </button>
            </div>

            <div className="mb-4">
              <h5 className="text-xs uppercase tracking-widest text-neutral-400 mb-3">Задачи</h5>
              {activePet.tasks.length === 0 && (
                <p className="text-sm text-neutral-400 italic">Задач нет</p>
              )}
              <div className="flex flex-col gap-2">
                {activePet.tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 group">
                    <button
                      onClick={() => toggleTask(activePet, task.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${task.done ? "bg-neutral-900 border-neutral-900" : "border-neutral-300 hover:border-neutral-600"}`}
                    >
                      {task.done && <Icon name="Check" size={12} className="text-white" />}
                    </button>
                    <div className="flex items-center gap-2 flex-1">
                      {task.type === "buy" && <Icon name="ShoppingCart" size={14} className="text-blue-500 flex-shrink-0" />}
                      {task.type === "todo" && <Icon name="ClipboardList" size={14} className="text-amber-500 flex-shrink-0" />}
                      <span className={`text-sm ${task.done ? "line-through text-neutral-400" : "text-neutral-800"}`}>{task.text}</span>
                    </div>
                    <button
                      onClick={() => deleteTask(activePet, task.id)}
                      className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-500 transition-all"
                    >
                      <Icon name="X" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-200">
              <select
                value={newTaskType}
                onChange={(e) => setNewTaskType(e.target.value as "buy" | "todo")}
                className="border border-neutral-300 text-sm px-3 py-2 bg-white text-neutral-700 focus:outline-none"
              >
                <option value="todo">📋 Задача</option>
                <option value="buy">🛒 Купить</option>
              </select>
              <input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask(activePet)}
                placeholder="Новая задача..."
                className="flex-1 border border-neutral-300 px-4 py-2 text-sm focus:outline-none focus:border-neutral-600"
              />
              <button
                onClick={() => addTask(activePet)}
                className="bg-neutral-900 text-white px-4 py-2 text-sm hover:bg-neutral-700 transition-colors"
              >
                <Icon name="Plus" size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddPet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4"
            onClick={(e) => e.target === e.currentTarget && setShowAddPet(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white w-full max-w-sm p-8"
            >
              <h3 className="font-bold text-lg mb-6">Новый питомец</h3>
              <div className="flex flex-col gap-3">
                <input
                  value={newPetName}
                  onChange={(e) => setNewPetName(e.target.value)}
                  placeholder="Имя (например: Барсик)"
                  className="border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
                />
                <input
                  value={newPetType}
                  onChange={(e) => setNewPetType(e.target.value)}
                  placeholder="Вид (кот, собака, попугай...)"
                  className="border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
                />
                <div className="flex gap-3 mt-2">
                  <button onClick={() => setShowAddPet(false)} className="flex-1 border border-neutral-300 py-2.5 text-sm text-neutral-600 hover:border-neutral-600">Отмена</button>
                  <button onClick={addPet} className="flex-1 bg-black text-white py-2.5 text-sm hover:bg-neutral-800">Добавить</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
