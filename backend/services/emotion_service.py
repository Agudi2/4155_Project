import numpy as np
from deepface import DeepFace

# Pre-load model (if needed)
def preload_emotion_model():
    try:
        _ = DeepFace.analyze(np.zeros((100, 100, 3)), actions=['emotion'], enforce_detection=False)
        print("Emotion detection model loaded.")
    except Exception as e:
        print(f"Error pre-loading model: {e}")

def analyze_emotion(img):
    try:
        result = DeepFace.analyze(img, actions=['emotion'], enforce_detection=False)
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        return result
    except Exception as e:
        raise e