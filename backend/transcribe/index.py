import os
import json
import base64
import tempfile
import openai

def handler(event: dict, context) -> dict:
    """Транскрибирует аудио через OpenAI Whisper и возвращает текст"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body)
    audio_b64 = body.get('audio')
    mime_type = body.get('mimeType', 'audio/webm')

    if not audio_b64:
        return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'No audio provided'})}

    audio_bytes = base64.b64decode(audio_b64)

    ext = 'webm'
    if 'mp4' in mime_type:
        ext = 'mp4'
    elif 'ogg' in mime_type:
        ext = 'ogg'
    elif 'wav' in mime_type:
        ext = 'wav'

    client = openai.OpenAI(api_key=os.environ['OPENAI_API_KEY'])

    with tempfile.NamedTemporaryFile(suffix=f'.{ext}', delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    with open(tmp_path, 'rb') as f:
        transcript = client.audio.transcriptions.create(
            model='whisper-1',
            file=(f'audio.{ext}', f, mime_type),
            language='ru'
        )

    os.unlink(tmp_path)

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'text': transcript.text})
    }