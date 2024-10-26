import openai
import boto3
import os

from dotenv import load_dotenv
import os

# Inicializar la clave de OpenAI desde las variables de entorno
openai.api_key = os.getenv('OPENAI_API_KEY')

# Inicializar el cliente de S3
s3 = boto3.client('s3')

def lambda_handler(event, context):
    """
    Lambda para descargar un archivo de S3 y transcribirlo usando Whisper de OpenAI
    """
    try:
        # Obtener el bucket y el nombre del archivo de S3 desde el evento
        #bucket_name = event.get('bucket_name')
        bucket_name = "audio-files-mit"
        file_key = "AudioTestA.mp3"
        
        if not bucket_name or not file_key:
            return {
                'statusCode': 400,
                'body': 'Se deben proporcionar el nombre del bucket y el nombre del archivo.'
            }
        
        # Descargar el archivo de S3
        archivo_local = '/tmp/audio_file.mp3'  # Ruta temporal en Lambda
        s3.download_file(bucket_name, file_key, archivo_local)

        # Leer el archivo descargado
        with open(archivo_local, 'rb') as audio_file:
            audio_bytes = audio_file.read()

        # Transcribir el audio con la API de Whisper
        texto_transcrito = transcribir_audio(audio_bytes)
        
        # Devolver el texto transcrito como resultado
        return {
            'statusCode': 200,
            'body': {
                'texto_transcrito': texto_transcrito
            }
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': str(e)
        }

def transcribir_audio(audio_bytes):
    """
    Transcribe un archivo de audio con la API de Whisper de OpenAI
    """
    response = openai.Audio.transcribe(
        model="whisper-1",
        file=audio_bytes
    )
    return response['text']




# Cargar variables de entorno desde .env
load_dotenv()

# Acceder a las variables
aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID')
openai_api_key = os.getenv('OPENAI_API_KEY')

lambda_handler("","")