import base64
import numpy as np
import cv2

def decode_base64_image(image_data):
    try:
        header, encoded = image_data.split(',', 1)
        decoded = base64.b64decode(encoded)
        np_arr = np.frombuffer(decoded, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Could not decode image")
        return img
    except Exception as e:
        raise ValueError(f"Error decoding image: {e}")