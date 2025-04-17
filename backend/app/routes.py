from fastapi import APIRouter, Depends, HTTPException
from app.auth import hash_password, verify_password, create_access_token
from app.database import users_collection
from app.models import User
from fastapi import File, UploadFile
from app.services import process_image

router = APIRouter()

@router.post("/register")
async def register(user: User):
    existing_user = await users_collection.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_password = hash_password(user.password)
    user_dict = user.dict()
    user_dict["password"] = hashed_password
    await users_collection.insert_one(user_dict)

    return {"message": "User registered successfully!"}

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