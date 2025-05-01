from pymongo import MongoClient
import os

client = None
db = None
predictions_collection = None

def init_db(app):
    global client, db, predictions_collection
    MONGO_URI = os.environ["MONGO_URI"]
    #MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://user1:1234@cluster0.3c1j4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    try:
        client = MongoClient(MONGO_URI)
        db = client['emotion_db']
        predictions_collection = db['predictions']
        print("MongoDB connected successfully.")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
def get_users_collection():
    global client
    if not client:
        raise Exception("Mongo client not initialized.")
    db = client['emotion_db']
    return db['users']