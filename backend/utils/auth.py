import jwt
import os
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def check_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(user_id: str) -> str:
    payload = {
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow(),
        'sub': user_id
    }
    return jwt.encode(payload, os.getenv("JWT_SECRET", "super_secret"), algorithm='HS256')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({"error": "Token is missing!"}), 401
        
        try:
            data = jwt.decode(token, os.getenv("JWT_SECRET", "super_secret"), algorithms=['HS256'])
            current_user_id = data['sub']
        except Exception as e:
            return jsonify({"error": "Token is invalid!"}), 401
        
        return f(current_user_id, *args, **kwargs)
    return decorated
