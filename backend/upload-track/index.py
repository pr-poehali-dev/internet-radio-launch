import json
import os
import base64
import boto3
import time
import re

def handler(event, context):
    """Загрузка MP3-трека в хранилище с проверкой пароля"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    headers = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Method not allowed'})}

    try:
        body = json.loads(event.get('body', '{}'))
    except:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Invalid JSON'})}

    password = body.get('password', '')
    if password != os.environ.get('UPLOAD_PASSWORD', ''):
        return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Wrong password'})}

    file_data = body.get('file', '')
    filename = body.get('filename', '')
    title = body.get('title', '')

    if not file_data or not filename:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Missing file or filename'})}

    if not filename.lower().endswith('.mp3'):
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Only MP3 files allowed'})}

    try:
        audio_bytes = base64.b64decode(file_data)
    except:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Invalid file data'})}

    max_size = 30 * 1024 * 1024
    if len(audio_bytes) > max_size:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'File too large (max 30MB)'})}

    safe_name = re.sub(r'[^a-zA-Z0-9а-яА-ЯёЁ._-]', '_', filename)
    ts = int(time.time())
    s3_key = f"radio/tracks/{ts}_{safe_name}"

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )

    s3.put_object(
        Bucket='files',
        Key=s3_key,
        Body=audio_bytes,
        ContentType='audio/mpeg'
    )

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{s3_key}"

    track_info = {
        'id': str(ts),
        'title': title or filename.replace('.mp3', ''),
        'filename': safe_name,
        'url': cdn_url,
        'uploaded_at': ts,
        'size': len(audio_bytes)
    }

    existing = []
    try:
        obj = s3.get_object(Bucket='files', Key='radio/tracks.json')
        existing = json.loads(obj['Body'].read().decode('utf-8'))
    except:
        pass

    existing.append(track_info)

    s3.put_object(
        Bucket='files',
        Key='radio/tracks.json',
        Body=json.dumps(existing, ensure_ascii=False).encode('utf-8'),
        ContentType='application/json'
    )

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'ok': True, 'track': track_info}, ensure_ascii=False)
    }
