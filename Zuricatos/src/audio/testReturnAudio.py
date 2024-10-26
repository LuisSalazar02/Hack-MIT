import json
import boto3
import base64
s3_client = boto3.client('s3')

def testReturnAudio(event, context):
    # Parse bucket name and object key from the request
    #bucket_name = event['queryStringParameters']['bucket']
    #object_key = event['queryStringParameters']['key']

    bucket_name = "audio-files-mit"
    object_key = "pruebaAudio.mp3"
    
    try:
        # Retrieve the MP3 file from S3
        s3_response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
        mp3_content = s3_response['Body'].read()

        # Encode the content in base64 to send as part of the JSON response
        encoded_mp3 = base64.b64encode(mp3_content).decode('utf-8')

        # Return the encoded MP3 content in the response body
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': f'attachment; filename="{object_key}"'
            },
            'isBase64Encoded': True,
            'body': encoded_mp3
        }
    
    except Exception as e:
        # Return an error message if something goes wrong
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error: {str(e)}")
        }