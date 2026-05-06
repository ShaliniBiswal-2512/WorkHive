from flask import Blueprint, request, jsonify
from db import users_collection
from utils.auth import hash_password, check_password, generate_token
from bson.objectid import ObjectId

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400

    if users_collection.find_one({"email": email}):
        return jsonify({"error": "User already exists"}), 400

    hashed_password = hash_password(password)
    user = {
        "name": name,
        "email": email,
        "password": hashed_password
    }
    
    result = users_collection.insert_one(user)
    token = generate_token(str(result.inserted_id))

    return jsonify({
        "message": "User created successfully",
        "token": token,
        "user": {
            "id": str(result.inserted_id),
            "name": name,
            "email": email
        }
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    user = users_collection.find_one({"email": email})
    if not user or not check_password(password, user['password']):
        return jsonify({"error": "Invalid email or password"}), 401

    token = generate_token(str(user['_id']))

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "id": str(user['_id']),
            "name": user['name'],
            "email": user['email']
        }
    }), 200
