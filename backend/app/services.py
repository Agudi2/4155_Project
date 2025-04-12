import cv2
import numpy as np
import face_recognition

async def process_image(file):
    image_bytes = await file.read()
    np_image = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(np_image, cv2.IMREAD_COLOR)

    face_locations = face_recognition.face_locations(image)
    return {"faces_detected": len(face_locations), "locations": face_locations}