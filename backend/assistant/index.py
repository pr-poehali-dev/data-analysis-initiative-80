import os
import json
import psycopg2
from datetime import datetime

def get_conn():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    return conn

def get_schema():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')

def handler(event: dict, context) -> dict:
    """Выполняет команды ассистента Life·OS напрямую в БД"""
    h = {'Access-Control-Allow-Origin': '*'}

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**h, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}, 'body': ''}

    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body)
    action = body.get('action')

    if not action:
        return {'statusCode': 400, 'headers': h, 'body': json.dumps({'error': 'No action'})}

    s = get_schema()
    conn = get_conn()
    cur = conn.cursor()

    try:
        if action == 'feed_pet':
            fed_time = datetime.now().strftime("%H:%M")
            cur.execute(f"UPDATE {s}.pets SET fed = true, fed_time = %s WHERE LOWER(name) = LOWER(%s)", (fed_time, body['pet_name']))
            return {'statusCode': 200, 'headers': h, 'body': json.dumps({'ok': True, 'result': f"Питомец {body['pet_name']} накормлен в {fed_time}"})}

        if action == 'unfeed_pet':
            cur.execute(f"UPDATE {s}.pets SET fed = false, fed_time = null WHERE LOWER(name) = LOWER(%s)", (body['pet_name'],))
            return {'statusCode': 200, 'headers': h, 'body': json.dumps({'ok': True, 'result': f"Кормление {body['pet_name']} сброшено"})}

        if action == 'add_pet_task':
            cur.execute(f"SELECT id FROM {s}.pets WHERE LOWER(name) = LOWER(%s)", (body['pet_name'],))
            row = cur.fetchone()
            if not row:
                return {'statusCode': 200, 'headers': h, 'body': json.dumps({'ok': False, 'result': f"Питомец {body['pet_name']} не найден"})}
            cur.execute(f"INSERT INTO {s}.pet_tasks (pet_id, text, type) VALUES (%s, %s, %s)", (row[0], body['task_text'], body.get('task_type', 'todo')))
            return {'statusCode': 200, 'headers': h, 'body': json.dumps({'ok': True, 'result': f"Задача добавлена для {body['pet_name']}"})}

        if action == 'complete_pet_task':
            cur.execute(f"""UPDATE {s}.pet_tasks SET done = true
                WHERE pet_id = (SELECT id FROM {s}.pets WHERE LOWER(name) = LOWER(%s))
                AND LOWER(text) LIKE LOWER(%s) AND archived = false""",
                (body['pet_name'], f"%{body['task_text']}%"))
            return {'statusCode': 200, 'headers': h, 'body': json.dumps({'ok': True, 'result': f"Задача для {body['pet_name']} выполнена"})}

        if action == 'add_business_task':
            cur.execute(f"INSERT INTO {s}.business_tasks (category, text) VALUES (%s, %s)", (body['category'], body['task_text']))
            return {'statusCode': 200, 'headers': h, 'body': json.dumps({'ok': True, 'result': f"Задача добавлена в {body['category']}"})}

        if action == 'get_pets':
            cur.execute(f"SELECT name, fed, fed_time FROM {s}.pets ORDER BY id")
            pets = [{'name': r[0], 'fed': r[1], 'fed_time': r[2]} for r in cur.fetchall()]
            return {'statusCode': 200, 'headers': h, 'body': json.dumps({'ok': True, 'pets': pets})}

    finally:
        cur.close()
        conn.close()

    return {'statusCode': 400, 'headers': h, 'body': json.dumps({'error': 'Unknown action'})}
