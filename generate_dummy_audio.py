import wave
import math
import struct
import os

filepath = r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\public\dummy-recording.wav'

# Create a 2-second beep at 440Hz
sample_rate = 44100.0
duration = 2.0
frequency = 440.0

with wave.open(filepath, 'w') as wav_file:
    wav_file.setnchannels(1) # mono
    wav_file.setsampwidth(2) # 16-bit
    wav_file.setframerate(int(sample_rate))
    
    num_samples = int(duration * sample_rate)
    for i in range(num_samples):
        # generate a simple sine wave
        value = int(32767.0 * 0.5 * math.sin(2.0 * math.pi * frequency * i / sample_rate))
        data = struct.pack('<h', value)
        wav_file.writeframesraw(data)

print("Generated dummy recording at", filepath)
