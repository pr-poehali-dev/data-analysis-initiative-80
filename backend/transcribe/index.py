import os
import json
import base64
# v3
import tempfile
from groq import Groq

def handler(event: dict, context) -> dict:
    """Транскрибирует аудио через Groq Whisper и возвращает текст"""
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

    api_key = os.environ.get('GROQ_API_KEY', 'NOT_SET')
    print(f"[DEBUG] GROQ_API_KEY starts with: {api_key[:10] if api_key != 'NOT_SET' else 'NOT_SET'}")
    client = Groq(api_key=api_key)

    with tempfile.NamedTemporaryFile(suffix=f'.{ext}', delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    with open(tmp_path, 'rb') as f:
        transcript = client.audio.transcriptions.create(
            model='whisper-large-v3',
            file=(f'audio.{ext}', f),
            language='ru'
        )

    os.unlink(tmp_path)

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'text': transcript.text})
    }