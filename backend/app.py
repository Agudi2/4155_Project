from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
from deepface import DeepFace
from pymongo import MongoClient
import datetime
import os

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

try:
    
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    client = MongoClient(MONGO_URI)
    db = client['emotion_db'] # Database name
    predictions_collection = db['predictions'] 
    print("MongoDB connected successfully.")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    predictions_collection = None 


print("Loading emotion detection model...")
try:
    _ = DeepFace.analyze(np.zeros((100, 100, 3)), actions=['emotion'], enforce_detection=False)
    print("Emotion detection model loaded.")
except Exception as e:
    print(f"Error pre-loading model: {e}")


@app.route('/api/predict', methods=['POST'])
def predict_emotion():
    if not request.json or 'image' not in request.json:
        return jsonify({"error": "Missing image data"}), 400

    image_data = request.json['image']
    try:
        header, encoded = image_data.split(',', 1)
        decoded_image = base64.b64decode(encoded)
        np_arr = np.frombuffer(decoded_image, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("Could not decode image")

    except Exception as e:
        print(f"Error decoding image: {e}")
        return jsonify({"error": f"Error decoding image: {e}"}), 400

    try:
        
        result = DeepFace.analyze(img, actions=['emotion'], enforce_detection=False)

        if isinstance(result, list) and len(result) > 0:
            analysis = result[0] 
        elif isinstance(result, dict):
             analysis = result
        else: 
            return jsonify({"emotion": "No face detected", "confidence": 0}), 200


        dominant_emotion = analysis.get('dominant_emotion', 'N/A')
        confidence = analysis.get('emotion', {}).get(dominant_emotion, 0) 

        
        if predictions_collection is not None:
            try:
                log_entry = {
                    'timestamp': datetime.datetime.now(datetime.timezone.utc),
                    'dominant_emotion': dominant_emotion,
                    'confidence': confidence,
                    'all_emotions': analysis.get('emotion', {}),
                    'face_region': analysis.get('region', {}) 
                }
                predictions_collection.insert_one(log_entry)
            except Exception as e:
                print(f"Error saving to MongoDB: {e}") 

        return jsonify({
            "emotion": dominant_emotion,
            "confidence": confidence,
            "details": analysis.get('emotion', {}) 
        })

    except Exception as e:
        print(f"Error during emotion analysis: {e}")

        if "Face could not be detected" in str(e):
             return jsonify({"emotion": "No face detected", "confidence": 0}), 200
        return jsonify({"error": f"Analysis error: {e}"}), 500

# Run the App 
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)