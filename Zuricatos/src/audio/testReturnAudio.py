import json
import boto3
import base64

s3_client = boto3.client('s3')


def hello(event, context):

    body = {
        "message": "Go Serverless v4.0! Your function executed successfully!",
    }

    response = {"statusCode": 200, "body": json.dumps(body)}

    return response