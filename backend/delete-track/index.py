import json
import os
import boto3

def handler(event, context):
    """Удаление трека из радиостанции с проверкой пароля"""
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

    track_id = body.get('track_id', '')
    if not track_id:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Missing track_id'})}

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )

    tracks = []
    try:
        obj = s3.get_object(Bucket='files', Key='radio/tracks.json')
        tracks = json.loads(obj['Body'].read().decode('utf-8'))
    except:
        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'No tracks found'})}

    track_to_delete = None
    for t in tracks:
        if t.get('id') == track_id:
            track_to_delete = t
            break

    if not track_to_delete:
        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Track not found'})}

    tracks = [t for t in tracks if t.get('id') != track_id]

    s3.put_object(
        Bucket='files',
        Key='radio/tracks.json',
        Body=json.dumps(tracks, ensure_ascii=False).encode('utf-8'),
        ContentType='application/json'
    )

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'ok': True, 'deleted': track_id}, ensure_ascii=False)
    }
