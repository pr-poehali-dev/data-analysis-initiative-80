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
    return { reply: "Привет! Чем могу помочь? Напиши «что умеешь» — покажу список команд." };
  }

  return {
    reply: `Не понял команду. Попробуй:\n• «Покорми Кузю»\n• «Купи корм для Умки»\n• «Добавь в Цех: задача»\n\nИли напиши «помощь» для полного списка команд.`
  };
}
