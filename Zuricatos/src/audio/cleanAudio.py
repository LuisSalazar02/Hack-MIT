import noisereduce as nr
import librosa
import soundfile as sf
from scipy.signal import butter, lfilter
import json
##libraries to manage the part of audio receiving
import boto3
import os
from urllib.parse import parse_qs
from io import BytesIO
from werkzeug.datastructures import FileStorage
from werkzeug.formparser import parse_form_data

# Initialize S3 client
s3 = boto3.client('s3')
BUCKET_NAME = "audio-files-mit"  

###################################################################################################################
"""
def load_audio(file_path):
    # Load the audio file
    audio, sr = librosa.load(file_path, sr=None)
    return audio, sr

def noise_reduction(audio, sr):
    # Perform noise reduction
    reduced_noise = nr.reduce_noise(y=audio, sr=sr)
    return reduced_noise

def apply_bandpass_filter(audio, sr, lowcut=300, highcut=3000, order=5):
    # Enhance quality by removing very low and very high frequencies
    nyquist = 0.5 * sr
    low = lowcut / nyquist
    high = highcut / nyquist
    b, a = butter(order, [low, high], btype='band')
    filtered_audio = lfilter(b, a, audio)
    return filtered_audio

def save_audio(audio, sr, output_path):
    # Save the processed audio to file
    sf.write(output_path, audio, sr)

def process_audio(input_path, output_path):
    # Load the audio
    audio, sr = load_audio(input_path)
    
    # Step 1: Reduce noise
    audio = noise_reduction(audio, sr)
    
    # Step 2: Enhance quality with bandpass filter
    audio = apply_bandpass_filter(audio, sr)
    
    # Step 3: Save the output
    save_audio(audio, sr, output_path)
    print(f"Processed audio saved as {output_path}")

# Example usage
input_path = 'original_audio.wav'  # Your input audio file
output_path = 'enhanced_audio.wav'
process_audio(input_path, output_path)


"""

#############################################################################################################################
def cleanAudio(event,context):
    # Decode the base64 encoded body and get the file from multipart form
    body = event['body']
    content_type = event['headers']['content-type']

    # Parse the multipart form
    environ = {
        'wsgi.input': BytesIO(body.encode('utf-8')),
        'CONTENT_LENGTH': len(body),
        'CONTENT_TYPE': content_type,
        'REQUEST_METHOD': 'POST'
    }
    
    _, _, form = parse_form_data(environ)
    mp3_file = form['audioFile']  # Assumes 'file' is the name attribute of the file input field
    
    # Ensure the file is an mp3
    if mp3_file.filename.endswith('.mp3'):
        # Upload to S3
        s3.upload_fileobj(mp3_file, BUCKET_NAME, mp3_file.filename)
        return {"statusCode": 200, "body": "File uploaded successfully"}
    else:
        return {"statusCode": 400, "body": "Only MP3 files are supported"}