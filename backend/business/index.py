import os
import json
import psycopg2

def get_conn():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    return conn

def s():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')

def handler(event: dict, context) -> dict:
    """CRUD API для бизнес-категорий, задач, заметок и сотрудников"""
    h = {'Access-Control-Allow-Origin': '*'}
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**h, 'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}, 'body': ''}

    method = event.get('httpMethod', 'GET')
    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body)
    sc = s()
    conn = get_conn()
    cur = conn.cursor()

    try:
        # GET — все данные бизнеса
        if method == 'GET':
            # Задачи и заметки по категориям
            cur.execute(f"SELECT id, category, text, done, note FROM {sc}.business_tasks WHERE archived = false ORDER BY id")
            tasks = [{'id': r[0], 'category': r[1], 'text': r[2], 'done': r[3], 'note': r[4]} for r in cur.fetchall()]

            # Сотрудники
            cur.execute(f"SELECT id, name, position, benefit, days_off FROM {sc}.employees WHERE archived = false ORDER BY id")
            employees = []
            for row in cur.fetchall():
                eid, name, position, benefit, days_off = row
                cur.execute(f"SELECT id, text, done FROM {sc}.employee_tasks WHERE employee_id = %s AND archived = false ORDER BY id", (eid,))
                etasks = [{'id': r[0], 'text': r[1], 'done': r[2]} for r in cur.fetchall()]
                employees.append({'id': eid, 'name': name, 'position': position, 'benefit': benefit, 'days_off': days_off, 'tasks': etasks})

            return {'statusCode': 200, 'headers': h, 'body': json.dumps({'tasks': tasks, 'employees': employees}, ensure_ascii=False)}

        action = body.get('action')

        # Бизнес-задачи
        if action == 'add_task':
            cur.execute(f"INSERT INTO {sc}.business_tasks (category, text) VALUES (%s, %s) RETURNING id", (body['category'], body['text']))
            new_id = cur.fetchone()[0]
            return {'statusCode': 200, 'headers': h, 'body': json.dumps({'id': new_id})}

        if action == 'toggle_task':
            cur.execute(f"UPDATE {sc}.business_tasks SET done = %s WHERE id = %s", (body['done'], body['id']))
            return {'statusCode': 200, 'headers': h, 'body': json.dumps({'ok': True})}

        if action == 'update_note':
            cur.execute(f"UPDATE {sc}.business_tasks SET note = %s WHERE id = %s", (body['note'], body['id']))
            return {'statusCode': 200, 'headers': h, 'body': json.dumps({'ok': True})}

        if action == 'delete_task':
            cur.execute(f"UPDATE {sc}.business_tasks SET archived = true WHERE id = %s", (body['id'],))
            return {'statusCode': 200, 'headers': h, 'body': json.dumps({'ok': True})}

        # Сотрудники
        if action == 'add_employee':
            cur.execute(f"INSERT INTO {sc}.employees (name, position, benefit, days_off) VALUES (%s, %s, %s, %s) RETURNING id",
                        (body['name'], body.get('position', ''), body.get('benefit', ''), body.get('days_off', '')))
            new_id = cur.fetchone()[0]
            return {'statusCode': 200, 'headers': h, 'body': json.dumps({'id': new_id})}

        if action == 'update_employee':
            cur.execute(f"UPDATE {sc}.employees SET name=%s, position=%s, benefit=%s, days_off=%s WHERE id=%s",
                        (body['name'], body.get('position', ''), body.get('benefit', ''), body.get('days_off', ''), body['id']))
            return {'statusCode': 200, 'headers': h, 'body': json.dumps({'ok': True})}

        if action == 'delete_employee':
            cur.execute(f"UPDATE {sc}.employees SET archived = true WHERE id = %s", (body['id'],))
            return {'statusCode': 200, 'headers': h, 'body': json.dumps({'ok': True})}

        if action == 'add_employee_task':
            cur.execute(f"INSERT INTO {sc}.employee_tasks (employee_id, text) VALUES (%s, %s) RETURNING id", (body['employee_id'], body['text']))
            new_id = cur.fetchone()[0]
            return {'statusCode': 200, 'headers': h, 'body': json.dumps({'id': new_id})}

        if action == 'toggle_employee_task':
            cur.execute(f"UPDATE {sc}.employee_tasks SET done = %s WHERE id = %s", (body['done'], body['id']))
            return {'statusCode': 200, 'headers': h, 'body': json.dumps({'ok': True})}

        if action == 'delete_employee_task':
            cur.execute(f"UPDATE {sc}.employee_tasks SET archived = true WHERE id = %s", (body['id'],))
            return {'statusCode': 200, 'headers': h, 'body': json.dumps({'ok': True})}

    finally:
        cur.close()
        conn.close()

    return {'statusCode': 400, 'headers': h, 'body': json.dumps({'error': 'Unknown action'})}
