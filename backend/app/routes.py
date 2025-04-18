from fastapi import APIRouter, Depends, HTTPException
from backend.auth import hash_password, verify_password, create_access_token
from backend.database import users_collection
from app.models import User
from fastapi import File, UploadFile, Form
import numpy as np
import cv2
import face_recognition
from app.services import process_image

router = APIRouter()

@router.post("/register")
async def register(
    username: str = Form(...),
    password: str = Form(...),
    file: UploadFile = File(...)
):
    existing_user = await users_collection.find_one({"username": username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken")

    # Read and decode the image
    image_bytes = await file.read()
    np_image = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(np_image, cv2.IMREAD_COLOR)

    # Extract face encodings
    encodings = face_recognition.face_encodings(image)
    if not encodings:
        raise HTTPException(status_code=400, detail="No face detected in the image.")
    
    face_encoding = encodings[0]  # use the first face

    # Prepare user document
    hashed = hash_password(password)
    user_doc = {
        "username": username,
        "password": hashed,
        "face_encoding": face_encoding.tolist()  # save as list
    }

    await users_collection.insert_one(user_doc)
    return {"message": "User registered with face encoding."}

@router.post("/login")
async def login(user: User):
    existing_user = await users_collection.find_one({"username": user.username})
    if not existing_user or not verify_password(user.password, existing_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    access_token = create_access_token({"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/detect-faces/")
async def detect_faces(file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG and PNG are allowed.")
    try:
        result = await process_image(file)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")