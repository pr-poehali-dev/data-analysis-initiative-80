const ASSISTANT_URL = "https://functions.poehali.dev/d46b436c-9add-4591-bbbc-c4fc89984e09";

export interface CommandResult {
  reply: string;
  action?: string;
}

const PET_NAMES = ["кузя", "умка", "шурик"];
const BUSINESS_CATS: Record<string, string> = {
  "цех": "Цех", "производств": "Цех",
  "опт": "Опт. продажи", "продаж": "Опт. продажи",
  "сотрудник": "Сотрудники", "персонал": "Сотрудники", "команд": "Сотрудники",
  "проблем": "Проблемы",
  "цел": "Цели", "план": "Цели",
  "имеем": "Что имеем", "актив": "Что имеем", "ресурс": "Что имеем",
  "баланс": "Баланс", "финанс": "Баланс", "деньг": "Баланс",
};

function findPet(text: string): string | null {
  for (const name of PET_NAMES) {
    if (text.includes(name)) return name.charAt(0).toUpperCase() + name.slice(1);
  }
  return null;
}

function findBizCat(text: string): string | null {
  for (const [key, val] of Object.entries(BUSINESS_CATS)) {
    if (text.includes(key)) return val;
  }
  return null;
}

function extractTaskText(text: string, after: string[]): string {
  let result = text;
  for (const word of after) {
    const idx = result.indexOf(word);
    if (idx !== -1) result = result.slice(idx + word.length).trim();
  }
  return result.replace(/^[:\-–—,]\s*/, "").trim() || text;
}

async function callApi(body: object): Promise<string> {
  const res = await fetch(ASSISTANT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.result || "Готово!";
}

export async function parseAndExecute(input: string): Promise<CommandResult> {
  const text = input.toLowerCase().trim();

  // --- КОРМЛЕНИЕ ---
  const feedWords = ["покорми", "покормил", "накорми", "накормил", "отметь кормление", "дал есть", "дала есть", "поел", "поела"];
  const isFeed = feedWords.some((w) => text.includes(w));

  if (isFeed) {
    const pet = findPet(text);
    if (pet) {
      const result = await callApi({ action: "feed_pet", pet_name: pet });
      return { reply: `✅ ${result}`, action: "refresh" };
    }
    // Все питомцы
    if (text.includes("всех") || text.includes("все")) {
      const results = await Promise.all(PET_NAMES.map((p) =>
        callApi({ action: "feed_pet", pet_name: p.charAt(0).toUpperCase() + p.slice(1) })
      ));
      return { reply: `✅ ${results.join(", ")}`, action: "refresh" };
    }
    return { reply: "Уточни имя питомца — Кузя, Умка или Шурик?" };
  }

  // --- КУПИТЬ / ЗАДАЧА ДЛЯ ПИТОМЦА ---
  const buyWords = ["купи", "купить", "приобрети", "закупи"];
  const isBuy = buyWords.some((w) => text.includes(w));
  const todoWords = ["запиши", "добавь задачу", "поставь задачу", "напомни", "запланируй"];
  const isTodoPet = todoWords.some((w) => text.includes(w));

  if ((isBuy || isTodoPet) && findPet(text)) {
    const pet = findPet(text)!;
    const taskText = isBuy
      ? extractTaskText(text, [...buyWords, "для", pet.toLowerCase()])
      : extractTaskText(text, [...todoWords, "для", pet.toLowerCase()]);
    const result = await callApi({ action: "add_pet_task", pet_name: pet, task_text: taskText || input, task_type: isBuy ? "buy" : "todo" });
    return { reply: `✅ ${result}`, action: "refresh" };
  }

  // --- ЗАДАЧА В БИЗНЕС ---
  const bizWords = ["добавь в", "запиши в", "добавь задачу в", "создай задачу"];
  const isBiz = bizWords.some((w) => text.includes(w));

  if (isBiz || findBizCat(text)) {
    const cat = findBizCat(text);
    if (cat) {
      const taskText = extractTaskText(text, [...bizWords, cat.toLowerCase(), ":"]);
      const result = await callApi({ action: "add_business_task", category: cat, task_text: taskText || input });
      return { reply: `✅ ${result}`, action: "refresh" };
    }
    return { reply: "Уточни раздел: Цех, Опт. продажи, Сотрудники, Проблемы, Цели, Что имеем или Баланс?" };
  }

  // --- СТАТУС ПИТОМЦЕВ ---
  if (text.includes("статус") || text.includes("как питомц") || text.includes("кто накормлен") || text.includes("кого покормили")) {
    const res = await fetch(ASSISTANT_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "get_pets" }) });
    const data = await res.json();
    if (data.pets) {
      const lines = data.pets.map((p: { name: string; fed: boolean; fed_time?: string }) =>
        `${p.fed ? "✅" : "❌"} ${p.name} — ${p.fed ? `накормлен в ${p.fed_time}` : "не кормили"}`
      );
      return { reply: lines.join("\n") };
    }
  }

  // --- ПОМОЩЬ ---
  if (text.includes("помог") || text.includes("что умеешь") || text.includes("команд") || text.includes("помощь")) {
    return {
      reply: `Вот что я умею:\n\n🐾 **Питомцы:**\n• «Покорми Кузю» — отметить кормление\n• «Купи корм для Умки» — добавить покупку\n• «Запиши Шурика к ветеринару» — добавить задачу\n• «Кто накормлен?» — проверить статус\n\n💼 **Бизнес:**\n• «Добавь в Цех: проверить станки» — задача в раздел\n• «Запиши в Баланс: оплатить аренду»\n\nГовори голосом или пиши текстом!`
    };
  }

  // --- ПРИВЕТСТВИЕ ---
  if (text.includes("привет") || text.includes("здравствуй") || text.includes("добрый")) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";
    return { reply: `${greeting}! Я твой личный ассистент Life·OS. Могу выполнять команды, давать советы по планированию или просто поговорить. Чем помочь?` };
  }

  // --- КАК ДЕЛА ---
  if (text.includes("как дела") || text.includes("как ты") || text.includes("всё хорошо")) {
    return { reply: "Всё отлично, слежу за твоей платформой! Кстати, не забудь проверить питомцев — возможно кто-то ещё не накормлен 🐾" };
  }

  // --- СОВЕТЫ ПО ПЛАНИРОВАНИЮ ---
  if (text.includes("совет") || text.includes("как планировать") || text.includes("как организовать")) {
    return { reply: "Вот несколько советов по продуктивности:\n\n• Начинай утро с проверки питомцев и задач на день\n• Записывай все мысли голосом — не теряй идеи\n• Раз в неделю просматривай раздел «Бизнес» — цели и баланс\n• Индикатор внимания покажет что требует срочного решения\n\nХочешь я помогу спланировать конкретный день?" };
  }

  // --- ПЛАНИРОВАНИЕ ДНЯ ---
  if (text.includes("план на день") || text.includes("что делать") || text.includes("с чего начать") || text.includes("планирование")) {
    const hour = new Date().getHours();
    const timeAdvice = hour < 10
      ? "Утро — хорошее время для важных дел. Начни с проверки животных и бизнес-задач."
      : hour < 14
      ? "Середина дня — самое продуктивное время. Займись задачами из раздела Цех или Сотрудники."
      : "Вечер — время подведения итогов. Отметь выполненные задачи и запланируй завтра.";
    return { reply: `${timeAdvice}\n\nЧтобы добавить задачу скажи мне: «Добавь в [раздел]: [задача»` };
  }

  // --- МОТИВАЦИЯ ---
  if (text.includes("устал") || text.includes("сложно") || text.includes("не могу") || text.includes("мотивац")) {
    const phrases = [
      "Каждый большой результат — это сумма маленьких шагов. Ты уже делаешь правильные вещи, раз ведёшь учёт своей жизни!",
      "Даже самый длинный путь начинается с одного шага. Запиши одну маленькую задачу — и начни с неё.",
      "Усталость — это сигнал что ты работаешь. Сделай перерыв, а потом вернись с новыми силами.",
    ];
    return { reply: phrases[Math.floor(Math.random() * phrases.length)] };
  }

  // --- ВРЕМЯ / ДАТА ---
  if (text.includes("который час") || text.includes("сколько времени") || text.includes("какое число") || text.includes("какой день")) {
    const now = new Date();
    const time = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const date = now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
    return { reply: `Сейчас ${time}, ${date}.` };
  }

  // --- БИЗНЕС-СОВЕТЫ ---
  if (text.includes("бизнес") || text.includes("производство") || text.includes("продаж") || text.includes("сотрудник")) {
    return { reply: "Для эффективного управления бизнесом:\n\n• Регулярно обновляй раздел «Баланс» — деньги любят счёт\n• Фиксируй проблемы сразу — скажи «Добавь в Проблемы: ...»\n• Ставь цели на неделю в разделе «Цели»\n\nЧто конкретно хочешь записать в бизнес?" };
  }

  // --- ОБЩИЙ РАЗГОВОР ---
  const generalReplies = [
    "Интересная мысль! Хочешь записать это как задачу или заметку?",
    "Понял тебя. Если нужно зафиксировать — просто скажи «запиши» и я сохраню.",
    "Слушаю! Если это важно — давай запишем в нужный раздел. Какой?",
  ];

  return {
    reply: generalReplies[Math.floor(Math.random() * generalReplies.length)] + "\n\nНапиши «помощь» чтобы увидеть все команды."
  };
}