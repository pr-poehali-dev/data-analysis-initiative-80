import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/f79a9577-30e9-4943-8705-1f2957a7b20b";

const CATEGORIES = [
  { id: "Цех", icon: "Factory", color: "bg-orange-500" },
  { id: "Опт. продажи", icon: "ShoppingCart", color: "bg-blue-500" },
  { id: "Сотрудники", icon: "Users", color: "bg-purple-500" },
  { id: "Проблемы", icon: "AlertTriangle", color: "bg-red-500" },
  { id: "Цели", icon: "Target", color: "bg-emerald-500" },
  { id: "Что имеем", icon: "Package", color: "bg-amber-500" },
  { id: "Баланс", icon: "BarChart2", color: "bg-cyan-500" },
];

interface BizTask { id: number; category: string; text: string; done: boolean; note: string; }
interface EmpTask { id: number; text: string; done: boolean; }
interface Employee { id: number; name: string; position: string; benefit: string; days_off: string; tasks: EmpTask[]; }

export default function BusinessManager({ refreshKey }: { refreshKey?: number }) {
  const [tasks, setTasks] = useState<BizTask[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null);
  const [newTask, setNewTask] = useState("");
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [empForm, setEmpForm] = useState({ name: "", position: "", benefit: "", days_off: "" });
  const [editingEmployee, setEditingEmployee] = useState(false);
  const [newEmpTask, setNewEmpTask] = useState("");

  const fetchData = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setTasks(data.tasks || []);
    setEmployees(data.employees || []);
    setLoading(false);
    if (activeEmployee) {
      const updated = (data.employees || []).find((e: Employee) => e.id === activeEmployee.id);
      if (updated) setActiveEmployee(updated);
    }
  };

  useEffect(() => { fetchData(); }, [refreshKey]);

  const post = async (body: object) => {
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    await fetchData();
  };
  const put = async (body: object) => {
    await fetch(API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    await fetchData();
  };

  const catTasks = (cat: string) => tasks.filter((t) => t.category === cat);
  const catDone = (cat: string) => catTasks(cat).filter((t) => t.done).length;

  if (loading) return (
    <div className="mt-4 flex items-center gap-2 text-neutral-400 text-sm">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-4 h-4 border-2 border-neutral-200 border-t-neutral-600 rounded-full" />
      Загружаю данные бизнеса...
    </div>
  );

  return (
    <div className="mt-6">
      {/* Сетка категорий */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {CATEGORIES.map((cat) => {
          const total = catTasks(cat.id).length;
          const done = catDone(cat.id);
          const isActive = activeCategory === cat.id;
          return (
            <button key={cat.id} onClick={() => { setActiveCategory(isActive ? null : cat.id); setActiveEmployee(null); }}
              className={`p-4 border-2 text-left transition-all duration-300 ${isActive ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-100 bg-neutral-50 hover:border-neutral-300"}`}>
              <div className={`w-8 h-8 rounded ${cat.color} flex items-center justify-center mb-2`}>
                <Icon name={cat.icon} size={16} className="text-white" />
              </div>
              <div className={`font-semibold text-sm mb-1 ${isActive ? "text-white" : "text-neutral-900"}`}>{cat.id}</div>
              <div className={`text-xs ${isActive ? "text-neutral-400" : "text-neutral-500"}`}>
                {total > 0 ? `${done}/${total} задач` : "Нет задач"}
              </div>
              {total > 0 && (
                <div className="mt-2 h-1 bg-neutral-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${isActive ? "bg-white" : cat.color}`}
                    style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Панель категории */}
      <AnimatePresence>
        {activeCategory && activeCategory !== "Сотрудники" && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="border border-neutral-200 p-6 mb-4 bg-white">
            <div className="flex items-center gap-3 mb-6">
              {(() => { const cat = CATEGORIES.find((c) => c.id === activeCategory)!; return (
                <div className={`w-10 h-10 rounded ${cat.color} flex items-center justify-center`}>
                  <Icon name={cat.icon} size={18} className="text-white" />
                </div>
              ); })()}
              <h3 className="text-xl font-bold text-neutral-900">{activeCategory}</h3>
            </div>

            {/* Список задач */}
            <div className="flex flex-col gap-2 mb-4">
              {catTasks(activeCategory).length === 0 && <p className="text-sm text-neutral-400 italic">Задач нет — добавь первую!</p>}
              {catTasks(activeCategory).map((task) => (
                <div key={task.id} className="border border-neutral-100 bg-neutral-50 p-3">
                  <div className="flex items-start gap-3 group">
                    <button onClick={() => post({ action: "toggle_task", id: task.id, done: !task.done })}
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${task.done ? "bg-neutral-900 border-neutral-900" : "border-neutral-300 hover:border-neutral-600"}`}>
                      {task.done && <Icon name="Check" size={12} className="text-white" />}
                    </button>
                    <span className={`flex-1 text-sm ${task.done ? "line-through text-neutral-400" : "text-neutral-800"}`}>{task.text}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingNote(task.id); setNoteText(task.note || ""); }}
                        className="text-neutral-400 hover:text-blue-500 transition-colors">
                        <Icon name="FileText" size={14} />
                      </button>
                      <button onClick={() => post({ action: "delete_task", id: task.id })}
                        className="text-neutral-400 hover:text-red-500 transition-colors">
                        <Icon name="X" size={14} />
                      </button>
                    </div>
                  </div>
                  {task.note && editingNote !== task.id && (
                    <div className="mt-2 ml-8 text-xs text-neutral-500 bg-white border border-neutral-100 px-3 py-2 rounded">
                      {task.note}
                    </div>
                  )}
                  {editingNote === task.id && (
                    <div className="mt-2 ml-8 flex gap-2">
                      <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Добавь замечание или заметку..."
                        className="flex-1 border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-neutral-600 resize-none"
                        rows={2} />
                      <div className="flex flex-col gap-1">
                        <button onClick={() => { post({ action: "update_note", id: task.id, note: noteText }); setEditingNote(null); }}
                          className="bg-neutral-900 text-white px-3 py-1 text-xs hover:bg-neutral-700">
                          Сохранить
                        </button>
                        <button onClick={() => setEditingNote(null)} className="border border-neutral-300 text-neutral-600 px-3 py-1 text-xs hover:border-neutral-600">
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Добавить задачу */}
            <div className="flex gap-2 pt-4 border-t border-neutral-100">
              <input value={newTask} onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && newTask.trim()) { post({ action: "add_task", category: activeCategory, text: newTask.trim() }); setNewTask(""); } }}
                placeholder="Новая задача..."
                className="flex-1 border border-neutral-300 px-4 py-2 text-sm focus:outline-none focus:border-neutral-600" />
              <button onClick={() => { if (newTask.trim()) { post({ action: "add_task", category: activeCategory, text: newTask.trim() }); setNewTask(""); } }}
                className="bg-neutral-900 text-white px-4 py-2 text-sm hover:bg-neutral-700 transition-colors">
                <Icon name="Plus" size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Панель сотрудников */}
      <AnimatePresence>
        {activeCategory === "Сотрудники" && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="border border-neutral-200 p-6 mb-4 bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                <Icon name="Users" size={20} /> Сотрудники
              </h3>
              <button onClick={() => { setShowAddEmployee(true); setEmpForm({ name: "", position: "", benefit: "", days_off: "" }); }}
                className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 text-sm hover:bg-neutral-700 transition-colors">
                <Icon name="UserPlus" size={16} /> Добавить сотрудника
              </button>
            </div>

            {employees.length === 0 && <p className="text-sm text-neutral-400 italic">Сотрудников нет — добавь первого!</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((emp) => {
                const done = emp.tasks.filter((t) => t.done).length;
                const isActive = activeEmployee?.id === emp.id;
                return (
                  <button key={emp.id} onClick={() => setActiveEmployee(isActive ? null : emp)}
                    className={`p-4 border-2 text-left transition-all duration-300 ${isActive ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-100 bg-neutral-50 hover:border-neutral-300"}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Icon name="User" size={18} className="text-purple-600" />
                      </div>
                      <div>
                        <div className={`font-bold text-sm ${isActive ? "text-white" : "text-neutral-900"}`}>{emp.name}</div>
                        <div className={`text-xs ${isActive ? "text-neutral-400" : "text-neutral-500"}`}>{emp.position || "Должность не указана"}</div>
                      </div>
                    </div>
                    <div className={`text-xs ${isActive ? "text-neutral-400" : "text-neutral-500"}`}>
                      {emp.tasks.length > 0 ? `${done}/${emp.tasks.length} задач выполнено` : "Нет задач"}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Карточка сотрудника */}
            <AnimatePresence>
              {activeEmployee && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="mt-6 border border-neutral-200 p-6 bg-neutral-50">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <Icon name="User" size={22} className="text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-neutral-900">{activeEmployee.name}</h4>
                        <p className="text-sm text-neutral-500">{activeEmployee.position}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingEmployee(true); setEmpForm({ name: activeEmployee.name, position: activeEmployee.position, benefit: activeEmployee.benefit, days_off: activeEmployee.days_off }); }}
                        className="border border-neutral-300 text-neutral-700 px-3 py-1.5 text-sm hover:border-neutral-600 flex items-center gap-1">
                        <Icon name="Pencil" size={14} /> Редактировать
                      </button>
                      <button onClick={() => { post({ action: "delete_employee", id: activeEmployee.id }); setActiveEmployee(null); }}
                        className="border border-red-200 text-red-500 px-3 py-1.5 text-sm hover:border-red-400 flex items-center gap-1">
                        <Icon name="Trash2" size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Инфо */}
                  {!editingEmployee ? (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white border border-neutral-100 p-3">
                        <div className="text-xs uppercase tracking-widest text-neutral-400 mb-1 flex items-center gap-1">
                          <Icon name="Star" size={12} /> Польза
                        </div>
                        <div className="text-sm text-neutral-700">{activeEmployee.benefit || "Не указана"}</div>
                      </div>
                      <div className="bg-white border border-neutral-100 p-3">
                        <div className="text-xs uppercase tracking-widest text-neutral-400 mb-1 flex items-center gap-1">
                          <Icon name="Calendar" size={12} /> Выходные дни
                        </div>
                        <div className="text-sm text-neutral-700">{activeEmployee.days_off || "Не указаны"}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {[
                        { key: "name", label: "Имя", placeholder: "Иван Иванов" },
                        { key: "position", label: "Должность", placeholder: "Менеджер" },
                        { key: "benefit", label: "Польза", placeholder: "Управляет складом" },
                        { key: "days_off", label: "Выходные дни", placeholder: "Сб, Вс" },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label className="text-xs text-neutral-500 mb-1 block">{label}</label>
                          <input value={empForm[key as keyof typeof empForm]}
                            onChange={(e) => setEmpForm((f) => ({ ...f, [key]: e.target.value }))}
                            placeholder={placeholder}
                            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-neutral-600" />
                        </div>
                      ))}
                      <div className="col-span-2 flex gap-2">
                        <button onClick={() => { post({ action: "update_employee", id: activeEmployee.id, ...empForm }); setEditingEmployee(false); }}
                          className="bg-neutral-900 text-white px-6 py-2 text-sm hover:bg-neutral-700">Сохранить</button>
                        <button onClick={() => setEditingEmployee(false)}
                          className="border border-neutral-300 text-neutral-600 px-6 py-2 text-sm hover:border-neutral-600">Отмена</button>
                      </div>
                    </div>
                  )}

                  {/* Задачи сотрудника */}
                  <h5 className="text-xs uppercase tracking-widest text-neutral-400 mb-3">Задачи</h5>
                  <div className="flex flex-col gap-2 mb-4">
                    {activeEmployee.tasks.length === 0 && <p className="text-sm text-neutral-400 italic">Задач нет</p>}
                    {activeEmployee.tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 group bg-white border border-neutral-100 px-4 py-3">
                        <button onClick={() => post({ action: "toggle_employee_task", id: task.id, done: !task.done })}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${task.done ? "bg-neutral-900 border-neutral-900" : "border-neutral-300 hover:border-neutral-600"}`}>
                          {task.done && <Icon name="Check" size={12} className="text-white" />}
                        </button>
                        <span className={`flex-1 text-sm ${task.done ? "line-through text-neutral-400" : "text-neutral-800"}`}>{task.text}</span>
                        <button onClick={() => post({ action: "delete_employee_task", id: task.id })}
                          className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-500 transition-all">
                          <Icon name="X" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-neutral-100">
                    <input value={newEmpTask} onChange={(e) => setNewEmpTask(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && newEmpTask.trim()) { post({ action: "add_employee_task", employee_id: activeEmployee.id, text: newEmpTask.trim() }); setNewEmpTask(""); } }}
                      placeholder="Новая задача сотруднику..."
                      className="flex-1 border border-neutral-300 px-4 py-2 text-sm focus:outline-none focus:border-neutral-600" />
                    <button onClick={() => { if (newEmpTask.trim()) { post({ action: "add_employee_task", employee_id: activeEmployee.id, text: newEmpTask.trim() }); setNewEmpTask(""); } }}
                      className="bg-neutral-900 text-white px-4 py-2 text-sm hover:bg-neutral-700 transition-colors">
                      <Icon name="Plus" size={16} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модальное окно добавления сотрудника */}
      <AnimatePresence>
        {showAddEmployee && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4"
            onClick={(e) => e.target === e.currentTarget && setShowAddEmployee(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white w-full max-w-md p-8">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Icon name="UserPlus" size={20} /> Новый сотрудник
              </h3>
              <div className="flex flex-col gap-3">
                {[
                  { key: "name", label: "Имя *", placeholder: "Иван Иванов" },
                  { key: "position", label: "Должность", placeholder: "Менеджер по продажам" },
                  { key: "benefit", label: "Польза / Зона ответственности", placeholder: "Управляет складом, контролирует отгрузки" },
                  { key: "days_off", label: "Выходные дни", placeholder: "Суббота, Воскресенье" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs text-neutral-500 mb-1 block">{label}</label>
                    <input value={empForm[key as keyof typeof empForm]}
                      onChange={(e) => setEmpForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-600" />
                  </div>
                ))}
                <div className="flex gap-3 mt-2">
                  <button onClick={() => setShowAddEmployee(false)} className="flex-1 border border-neutral-300 py-2.5 text-sm text-neutral-600 hover:border-neutral-600">Отмена</button>
                  <button onClick={() => { if (empForm.name.trim()) { post({ action: "add_employee", ...empForm }); setShowAddEmployee(false); } }}
                    className="flex-1 bg-black text-white py-2.5 text-sm hover:bg-neutral-800">Добавить</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
