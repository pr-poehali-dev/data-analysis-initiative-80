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

async function getAnalysis(): Promise<CommandResult> {
  const res = await fetch(ASSISTANT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "get_pets" }),
  });
  const data = await res.json();
  const pets: { name: string; fed: boolean; fed_time?: string }[] = data.pets || [];

  const unfed = pets.filter((p) => !p.fed);
  const fed = pets.filter((p) => p.fed);
  const lines: string[] = ["📊 Анализ твоей платформы на сейчас:\n"];

  // Питомцы
  if (unfed.length > 0) {
    lines.push(`🔴 Не накормлены: ${unfed.map((p) => p.name).join(", ")} — требует внимания!`);
  } else if (fed.length > 0) {
    lines.push(`✅ Все питомцы накормлены — отлично!`);
  }

  // Время суток советы
  const hour = new Date().getHours();
  lines.push("");
  if (hour < 10) {
    lines.push("🌅 Утро — хорошее время чтобы:\n• Проверить задачи в Цехе\n• Покормить питомцев\n• Записать планы на день голосом");
  } else if (hour < 14) {
    lines.push("☀️ Середина дня — сосредоточься на:\n• Оптовых продажах и переговорах\n• Решении текущих проблем бизнеса\n• Важных звонках и встречах");
  } else if (hour < 18) {
    lines.push("🌤 Послеобеденное время — займись:\n• Проверкой сотрудников\n• Обновлением баланса\n• Задачами которые требуют концентрации");
  } else {
    lines.push("🌙 Вечер — время подведения итогов:\n• Отметь выполненные задачи\n• Запланируй завтра\n• Проверь питомцев перед сном");
  }

  lines.push("\nХочешь подробный анализ по конкретному разделу? Спроси: «анализ бизнеса» или «анализ семьи»");
  return { reply: lines.join("\n") };
}

export async function parseAndExecute(input: string): Promise<CommandResult> {
  const text = input.toLowerCase().trim();

  // --- АНАЛИЗ ---
  if (text.includes("анализ") || text.includes("как дела в") || text.includes("что происходит") || text.includes("покажи статус")) {

    if (text.includes("бизнес") || text.includes("производств") || text.includes("работ")) {
      return { reply: "📊 Анализ бизнеса:\n\nЧтобы твой бизнес работал эффективно, рекомендую:\n\n🏭 Цех:\n• Проводи еженедельный осмотр оборудования\n• Фиксируй простои и причины\n\n📦 Оптовые продажи:\n• Отслеживай топ-клиентов\n• Ставь план продаж на месяц\n\n👥 Сотрудники:\n• Проводи короткие планёрки утром\n• Отмечай лучших — мотивация важна\n\n💰 Баланс:\n• Сверяй доходы/расходы раз в неделю\n• Веди резервный фонд\n\nЧто записать в задачи?" };
    }

    if (text.includes("семь") || text.includes("питомц") || text.includes("животн")) {
      return await getAnalysis();
    }

    if (text.includes("друз") || text.includes("общени")) {
      return { reply: "📊 Анализ раздела «Друзья»:\n\n• Когда последний раз виделся с близкими друзьями?\n• Есть ли незакрытые обещания или договорённости?\n• Кому давно не писал/звонил?\n\n💡 Совет: выдели 1 день в неделю для живого общения — это заряжает энергией и укрепляет отношения.\n\nХочешь записать задачу — связаться с кем-то конкретным?" };
    }

    if (text.includes("хобби") || text.includes("увлечен") || text.includes("отдых")) {
      return { reply: "📊 Анализ раздела «Хобби»:\n\n• Сколько времени в неделю ты тратишь на себя?\n• Есть ли хобби которое ты давно откладываешь?\n\n💡 Исследования показывают: 2-3 часа в неделю на любимое занятие повышают продуктивность на 20%.\n\nРекомендации:\n• Спорт утром — даёт энергию на весь день\n• Творчество вечером — снимает стресс\n• Путешествия — планируй хотя бы раз в квартал\n\nЗаписать что-то в хобби?" };
    }

    return await getAnalysis();
  }

  // --- КОРМЛЕНИЕ ---
  const feedWords = ["покорми", "покормил", "накорми", "накормил", "отметь кормление", "дал есть", "дала есть", "поел", "поела"];
  const isFeed = feedWords.some((w) => text.includes(w));

  if (isFeed) {
    const pet = findPet(text);
    if (pet) {
      const result = await callApi({ action: "feed_pet", pet_name: pet });
      return { reply: `✅ ${result}`, action: "refresh" };
    }
    if (text.includes("всех") || text.includes("все")) {
      const results = await Promise.all(PET_NAMES.map((p) =>
        callApi({ action: "feed_pet", pet_name: p.charAt(0).toUpperCase() + p.slice(1) })
      ));
      return { reply: `✅ ${results.join("\n")}`, action: "refresh" };
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

  if (isBiz && findBizCat(text)) {
    const cat = findBizCat(text)!;
    const taskText = extractTaskText(text, [...bizWords, cat.toLowerCase(), ":"]);
    const result = await callApi({ action: "add_business_task", category: cat, task_text: taskText || input });
    return { reply: `✅ ${result}`, action: "refresh" };
  }

  // --- СТАТУС ПИТОМЦЕВ ---
  if (text.includes("статус") || text.includes("как питомц") || text.includes("кто накормлен") || text.includes("кого покормили")) {
    const res = await fetch(ASSISTANT_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "get_pets" }) });
    const data = await res.json();
    if (data.pets) {
      const lines = data.pets.map((p: { name: string; fed: boolean; fed_time?: string }) =>
        `${p.fed ? "✅" : "❌"} ${p.name} — ${p.fed ? `накормлен в ${p.fed_time}` : "не кормили"}`
      );
      return { reply: "Статус питомцев:\n" + lines.join("\n") };
    }
  }

  // --- ПОМОЩЬ ---
  if (text.includes("помог") || text.includes("что умеешь") || text.includes("команд") || text.includes("помощь")) {
    return {
      reply: `Вот что я умею:\n\n🐾 Питомцы:\n• «Покорми Кузю» — отметить кормление\n• «Купи корм для Умки» — добавить покупку\n• «Кто накормлен?» — статус\n\n💼 Бизнес:\n• «Добавь в Цех: проверить станки»\n• «Запиши в Баланс: оплатить аренду»\n\n📊 Анализ:\n• «Анализ» — общий обзор\n• «Анализ бизнеса» — советы по работе\n• «Анализ семьи» — питомцы и задачи\n• «Анализ хобби» — баланс жизни\n\n💬 Общение:\n• «Планирование дня»\n• «Дай совет»\n• «Который час?»`
    };
  }

  // --- ПРИВЕТСТВИЕ ---
  if (text.includes("привет") || text.includes("здравствуй") || text.includes("добрый")) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";
    return { reply: `${greeting}! Я твой личный ассистент Life·OS.\n\nМогу:\n• Выполнять команды («Покорми Кузю»)\n• Делать анализ («Анализ бизнеса»)\n• Советовать («Планирование дня»)\n• Просто поговорить\n\nЧем помочь?` };
  }

  // --- КАК ДЕЛА ---
  if (text.includes("как дела") || text.includes("как ты")) {
    return await getAnalysis();
  }

  // --- СОВЕТЫ ---
  if (text.includes("совет") || text.includes("как планировать") || text.includes("как организовать")) {
    return { reply: "Советы по продуктивности:\n\n🌅 Утро: покорми питомцев, проверь задачи дня\n☀️ День: занимайся бизнесом и важными делами\n🌙 Вечер: подведи итоги, запланируй завтра\n\nГлавное правило: фиксируй всё голосом сразу — идеи, задачи, мысли. Потом не забудешь!\n\nХочешь анализ конкретного раздела?" };
  }

  // --- ПЛАНИРОВАНИЕ ДНЯ ---
  if (text.includes("план на день") || text.includes("что делать сегодня") || text.includes("с чего начать") || text.includes("планирование")) {
    const hour = new Date().getHours();
    const timeAdvice = hour < 10
      ? "Утро — начни с питомцев и приоритетных задач Цеха."
      : hour < 14
      ? "Середина дня — сосредоточься на продажах и работе с командой."
      : hour < 18
      ? "Послеобед — обнови баланс, проверь выполненные задачи."
      : "Вечер — время подвести итоги и записать планы на завтра.";
    return { reply: `${timeAdvice}\n\nСкажи «анализ» — покажу полную картину твоего дня.` };
  }

  // --- МОТИВАЦИЯ ---
  if (text.includes("устал") || text.includes("сложно") || text.includes("не могу") || text.includes("мотивац")) {
    const phrases = [
      "Каждый большой результат — это сумма маленьких шагов. Ты уже делаешь правильные вещи, раз ведёшь учёт своей жизни!",
      "Даже самый длинный путь начинается с одного шага. Запиши одну маленькую задачу — и начни с неё.",
      "Усталость — это сигнал что ты работаешь. Сделай паузу 15 минут, а потом вернись с новыми силами.",
    ];
    return { reply: phrases[Math.floor(Math.random() * phrases.length)] };
  }

  // --- СЕМЬЯ ---
  if (text.includes("семья") || text.includes("родител") || text.includes("дети") || text.includes("родственник")) {
    return { reply: "💡 Советы по разделу «Семья»:\n\n• Звони родителям минимум раз в неделю\n• Планируй совместные ужины заранее\n• Фиксируй важные даты — дни рождения, годовщины\n• Для питомцев — проверяй индикатор внимания\n\nЕсть что записать в раздел «Семья»?" };
  }

  // --- ДРУЗЬЯ ---
  if (text.includes("друз") || text.includes("приятел") || text.includes("общени")) {
    return { reply: "💡 Советы по разделу «Друзья»:\n\n• Выдели время на живое общение — хотя бы раз в неделю\n• Не забывай про важные события у друзей\n• Нетворкинг — это инвестиция в будущее\n\nХочешь записать встречу или задачу?" };
  }

  // --- ХОББИ ---
  if (text.includes("хобби") || text.includes("отдых") || text.includes("спорт") || text.includes("увлечен")) {
    return { reply: "💡 Советы по разделу «Хобби»:\n\n• 2-3 часа в неделю на себя — это не роскошь, это необходимость\n• Спорт утром повышает продуктивность на весь день\n• Планируй отпуск заранее — хотя бы раз в квартал\n\nЧто записать в хобби?" };
  }

  // --- ВРЕМЯ / ДАТА ---
  if (text.includes("который час") || text.includes("сколько времени") || text.includes("какое число") || text.includes("какой день")) {
    const now = new Date();
    const time = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const date = now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
    return { reply: `Сейчас ${time}, ${date}.` };
  }

  // --- ОБЩИЙ РАЗГОВОР ---
  const generalReplies = [
    "Интересная мысль! Хочешь записать это как задачу?\nИли скажи «анализ» — покажу общую картину твоего дня.",
    "Понял тебя. Если нужно зафиксировать — просто скажи «запиши в [раздел]».\nИли напиши «помощь» для полного списка команд.",
    "Слушаю! Скажи «анализ» — я посмотрю на все твои данные и дам конкретные советы.",
  ];

  return {
    reply: generalReplies[Math.floor(Math.random() * generalReplies.length)]
  };
}
