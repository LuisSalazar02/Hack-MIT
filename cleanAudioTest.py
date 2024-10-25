import noisereduce as nr
import librosa
import soundfile as sf
import numpy as np
from scipy.signal import butter, lfilter

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
