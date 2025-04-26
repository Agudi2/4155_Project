from flask import Flask, request, jsonify
import cv2
import numpy as np
from deepface import DeepFace

@app.route('/api/predict', methods=['POST'])
def predict_emotion():
    print("Content-Type received:", request.content_type)
    if 'image' not in request.files:
        return jsonify({"error": "Missing image file"}), 400

    file = request.files['image']
    file_bytes = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    if img is None:
        return jsonify({"error": "Invalid image"}), 400

    try:
        result = DeepFace.analyze(img, actions=['emotion'], enforce_detection=False)

        if isinstance(result, list) and len(result) > 0:
            analysis = result[0]
        else:
            analysis = result

        dominant_emotion = analysis.get('dominant_emotion', 'N/A')
        confidence = analysis.get('emotion', {}).get(dominant_emotion, 0)

        return jsonify({
            "emotion": dominant_emotion,
            "confidence": confidence,
            "details": analysis.get('emotion', {})
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500