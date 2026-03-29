import os
import json
import psycopg2

def get_conn():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    return conn

def get_schema():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')

def handler(event: dict, context) -> dict:
    """CRUD API для питомцев и их задач в Life·OS"""
    headers = {'Access-Control-Allow-Origin': '*'}

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**headers, 'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}, 'body': ''}

    method = event.get('httpMethod', 'GET')
    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body)
    s = get_schema()
    conn = get_conn()
    cur = conn.cursor()

    if method == 'GET':
        cur.execute(f'SELECT id, name, type, emoji, fed, fed_time FROM {s}.pets ORDER BY id')
        pets = []
        for row in cur.fetchall():
            pid, name, ptype, emoji, fed, fed_time = row
            cur.execute(f'SELECT id, text, done, type FROM {s}.pet_tasks WHERE pet_id = %s AND archived = false ORDER BY id', (pid,))
            tasks = [{'id': r[0], 'text': r[1], 'done': r[2], 'type': r[3]} for r in cur.fetchall()]
            pets.append({'id': pid, 'name': name, 'type': ptype, 'emoji': emoji, 'fed': fed, 'fedTime': fed_time, 'tasks': tasks})
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps(pets, ensure_ascii=False)}

    action = body.get('action')

    if action == 'add_pet':
        cur.execute(f"INSERT INTO {s}.pets (name, type, emoji) VALUES (%s, %s, %s) RETURNING id",
                    (body['name'], body['type'], body.get('emoji', '🐾')))
        new_id = cur.fetchone()[0]
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'id': new_id})}

    if action == 'add_task':
        cur.execute(f"INSERT INTO {s}.pet_tasks (pet_id, text, type) VALUES (%s, %s, %s) RETURNING id",
                    (body['pet_id'], body['text'], body.get('type', 'todo')))
        new_id = cur.fetchone()[0]
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'id': new_id})}

    if action == 'feed':
        cur.execute(f"UPDATE {s}.pets SET fed = %s, fed_time = %s WHERE id = %s",
                    (body['fed'], body.get('fed_time'), body['pet_id']))
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    if action == 'toggle_task':
        cur.execute(f"UPDATE {s}.pet_tasks SET done = %s WHERE id = %s",
                    (body['done'], body['task_id']))
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    if action == 'delete_task':
        cur.execute(f"UPDATE {s}.pet_tasks SET archived = true WHERE id = %s", (body['task_id'],))
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    cur.close(); conn.close()
    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Unknown action'})}
