import os
import json
import psycopg2
from groq import Groq

def get_conn():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    return conn

def get_schema():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')

SYSTEM_PROMPT = """Ты — личный ИИ-ассистент платформы Life·OS. Помогаешь управлять жизнью пользователя.

У тебя есть доступ к функциям:
- feed_pet(pet_name) — отметить кормление питомца
- add_pet_task(pet_name, task_text, task_type) — добавить задачу питомцу (task_type: "todo" или "buy")
- complete_pet_task(pet_name, task_text) — отметить задачу питомца выполненной
- add_business_task(category, task_text) — добавить задачу в бизнес (category: "Цех", "Опт. продажи", "Сотрудники", "Проблемы", "Цели", "Что имеем", "Баланс")
- complete_business_task(category, task_text) — выполнить задачу бизнеса

Когда пользователь говорит "отметь что Кузю покормили" — вызывай feed_pet.
Когда говорит "купи корм для Умки" — вызывай add_pet_task с type=buy.
Когда говорит "добавь задачу в цех" — вызывай add_business_task.

Отвечай коротко по-русски. После выполнения команды подтверди действие."""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "feed_pet",
            "description": "Отметить что питомец покормлен",
            "parameters": {"type": "object", "properties": {"pet_name": {"type": "string", "description": "Имя питомца"}}, "required": ["pet_name"]}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add_pet_task",
            "description": "Добавить задачу питомцу",
            "parameters": {
                "type": "object",
                "properties": {
                    "pet_name": {"type": "string"},
                    "task_text": {"type": "string"},
                    "task_type": {"type": "string", "enum": ["todo", "buy"]}
                },
                "required": ["pet_name", "task_text", "task_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "complete_pet_task",
            "description": "Отметить задачу питомца как выполненную",
            "parameters": {
                "type": "object",
                "properties": {"pet_name": {"type": "string"}, "task_text": {"type": "string"}},
                "required": ["pet_name", "task_text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add_business_task",
            "description": "Добавить задачу в раздел бизнеса",
            "parameters": {
                "type": "object",
                "properties": {"category": {"type": "string"}, "task_text": {"type": "string"}},
                "required": ["category", "task_text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "complete_business_task",
            "description": "Отметить задачу бизнеса как выполненную",
            "parameters": {
                "type": "object",
                "properties": {"category": {"type": "string"}, "task_text": {"type": "string"}},
                "required": ["category", "task_text"]
            }
        }
    }
]

def execute_tool(name: str, args: dict, s: str) -> str:
    conn = get_conn()
    cur = conn.cursor()
    try:
        if name == "feed_pet":
            from datetime import datetime
            fed_time = datetime.now().strftime("%H:%M")
            cur.execute(f"UPDATE {s}.pets SET fed = true, fed_time = %s WHERE LOWER(name) = LOWER(%s)", (fed_time, args["pet_name"]))
            return f"Питомец {args['pet_name']} отмечен накормленным в {fed_time}"

        if name == "add_pet_task":
            cur.execute(f"SELECT id FROM {s}.pets WHERE LOWER(name) = LOWER(%s)", (args["pet_name"],))
            row = cur.fetchone()
            if not row:
                return f"Питомец {args['pet_name']} не найден"
            cur.execute(f"INSERT INTO {s}.pet_tasks (pet_id, text, type) VALUES (%s, %s, %s)", (row[0], args["task_text"], args["task_type"]))
            return f"Задача '{args['task_text']}' добавлена для {args['pet_name']}"

        if name == "complete_pet_task":
            cur.execute(f"""UPDATE {s}.pet_tasks SET done = true
                WHERE pet_id = (SELECT id FROM {s}.pets WHERE LOWER(name) = LOWER(%s))
                AND LOWER(text) LIKE LOWER(%s)""", (args["pet_name"], f"%{args['task_text']}%"))
            return f"Задача для {args['pet_name']} выполнена"

        if name == "add_business_task":
            cur.execute(f"INSERT INTO {s}.business_tasks (category, text) VALUES (%s, %s)", (args["category"], args["task_text"]))
            return f"Задача '{args['task_text']}' добавлена в {args['category']}"

        if name == "complete_business_task":
            cur.execute(f"UPDATE {s}.business_tasks SET done = true WHERE LOWER(category) = LOWER(%s) AND LOWER(text) LIKE LOWER(%s)",
                        (args["category"], f"%{args['task_text']}%"))
            return f"Задача в {args['category']} выполнена"
    finally:
        cur.close()
        conn.close()
    return "Действие выполнено"

def handler(event: dict, context) -> dict:
    """ИИ-ассистент Life·OS на Groq llama3 с function calling"""
    h = {'Access-Control-Allow-Origin': '*'}

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**h, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}, 'body': ''}

    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body)
    user_message = body.get('message', '')
    history = body.get('history', [])

    if not user_message:
        return {'statusCode': 400, 'headers': h, 'body': json.dumps({'error': 'No message'})}

    client = Groq(api_key=os.environ['GROQ_API_KEY'])
    s = get_schema()

    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history + [{"role": "user", "content": user_message}]

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        tools=TOOLS,
        tool_choice="auto"
    )
    msg = response.choices[0].message

    tool_results = []
    if msg.tool_calls:
        messages.append({"role": "assistant", "content": msg.content or "", "tool_calls": [
            {"id": tc.id, "type": "function", "function": {"name": tc.function.name, "arguments": tc.function.arguments}}
            for tc in msg.tool_calls
        ]})
        for tc in msg.tool_calls:
            args = json.loads(tc.function.arguments)
            result = execute_tool(tc.function.name, args, s)
            tool_results.append({"tool": tc.function.name, "result": result})
            messages.append({"role": "tool", "tool_call_id": tc.id, "content": result})

        final = client.chat.completions.create(model="llama-3.3-70b-versatile", messages=messages)
        reply = final.choices[0].message.content
    else:
        reply = msg.content

    return {
        'statusCode': 200,
        'headers': h,
        'body': json.dumps({'reply': reply, 'actions': tool_results}, ensure_ascii=False)
    }
