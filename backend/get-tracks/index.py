import json
import os
import boto3

def handler(event, context):
    """Получение списка загруженных треков радиостанции"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    headers = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

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
        pass

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'tracks': tracks}, ensure_ascii=False)
    }
