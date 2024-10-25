import librosa
import soundfile as sf

# Load the audio file
audio_file = 'your_audio.wav'
y, sr = librosa.load(audio_file)

# Apply a high-pass filter to remove low-frequency noise
y_filtered = librosa.effects.preemphasis(y)

# Save the enhanced audio
sf.write('enhanced_audio.wav', y_filtered, sr)

import noisereduce as nr
import librosa
import soundfile as sf

# Load the audio file and noise sample
audio_data, sr = librosa.load("your_audio.wav")
noise_data, _ = librosa.load("noise_sample.wav")

# Perform noise reduction
reduced_noise = nr.reduce_noise(y=audio_data, sr=sr, y_noise=noise_data)

# Save the clean audio
sf.write('clean_audio.wav', reduced_noise, sr)

from spleeter.separator import Separator

# Initialize spleeter for separating 2 stems (vocals, accompaniment)
separator = Separator('spleeter:2stems')

# Separate audio and save the output
separator.separate_to_file('your_audio.wav', 'output_directory')