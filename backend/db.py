from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/workhive")
client = MongoClient(MONGO_URI)
try:
    db = client.get_database() # Uses the database specified in URI if present
except Exception:
    db = client['workhive'] # Fallback to 'workhive' database if no default is provided in URI

users_collection = db['users']
projects_collection = db.projects
tasks_collection = db.tasks
notifications_collection = db.notifications
messages_collection = db.messages

# Create TTL index to auto-delete notifications after 24 hours (86400 seconds)
notifications_collection.create_index("created_at", expireAfterSeconds=86400)
