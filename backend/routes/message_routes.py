from flask import Blueprint, request, jsonify
from db import messages_collection, users_collection
from utils.auth import token_required
from bson.objectid import ObjectId
from socket_instance import socketio
import datetime

message_bp = Blueprint('messages', __name__)

@message_bp.route('', methods=['GET'], strict_slashes=False)
@token_required
def get_messages(current_user_id):
    project_id = request.args.get('project_id')
    if not project_id:
        return jsonify({"error": "project_id is required"}), 400

    # Fetch recent messages for the project (e.g. last 100)
    messages = list(messages_collection.find({"project_id": project_id}).sort("created_at", 1).limit(100))
    
    for msg in messages:
        msg['_id'] = str(msg['_id'])
        
    return jsonify(messages), 200

@message_bp.route('', methods=['POST'], strict_slashes=False)
@token_required
def post_message(current_user_id):
    import os
    import uuid

    if request.is_json:
        data = request.json
        content = data.get('content')
        project_id = data.get('project_id')
        has_attachment = data.get('has_attachment', False)
        filename = data.get('filename')
        file_url = None
    else:
        content = request.form.get('content')
        project_id = request.form.get('project_id')
        has_attachment = False
        filename = None
        file_url = None

        if 'file' in request.files:
            file = request.files['file']
            if file.filename:
                has_attachment = True
                filename = file.filename
                ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
                unique_filename = f"{uuid.uuid4().hex}.{ext}" if ext else uuid.uuid4().hex
                os.makedirs('uploads', exist_ok=True)
                file.save(os.path.join('uploads', unique_filename))
                file_url = f"http://localhost:5000/api/uploads/{unique_filename}"
                
    if not content or not content.strip():
        # If there is an attachment but no content, that's fine
        if not has_attachment:
            return jsonify({"error": "Message content is required"}), 400
        else:
            content = ""
            
    if not project_id:
        return jsonify({"error": "project_id is required"}), 400

    # Get user details for name
    sender = users_collection.find_one({"_id": ObjectId(current_user_id)})
    sender_name = sender['name'] if sender else "Unknown User"

    new_msg = {
        "project_id": project_id,
        "sender_id": current_user_id,
        "sender_name": sender_name,
        "content": content.strip() if content else "",
        "created_at": datetime.datetime.utcnow()
    }

    if has_attachment:
        new_msg['has_attachment'] = True
        new_msg['filename'] = filename
        if file_url:
            new_msg['file_url'] = file_url

    # Initialize new fields
    new_msg['read_by'] = []
    new_msg['is_edited'] = False
    new_msg['is_deleted'] = False

    result = messages_collection.insert_one(new_msg)
    new_msg['_id'] = str(result.inserted_id)

    # Convert datetime to string for socketio JSON serialization (append Z for UTC)
    new_msg['created_at'] = new_msg['created_at'].isoformat() + "Z"

    # Broadcast to all connected clients in the room
    socketio.emit('new_message', new_msg, to=project_id)

    return jsonify(new_msg), 201

@message_bp.route('/<msg_id>', methods=['PUT'], strict_slashes=False)
@token_required
def edit_message(current_user_id, msg_id):
    data = request.json
    new_content = data.get('content')
    
    if not new_content or not new_content.strip():
        return jsonify({"error": "Content required"}), 400

    try:
        msg = messages_collection.find_one({"_id": ObjectId(msg_id)})
    except:
        return jsonify({"error": "Invalid ID"}), 400

    if not msg:
        return jsonify({"error": "Not found"}), 404

    if msg.get('sender_id') != current_user_id:
        return jsonify({"error": "Unauthorized"}), 403

    if msg.get('is_deleted'):
        return jsonify({"error": "Cannot edit deleted message"}), 400

    messages_collection.update_one(
        {"_id": ObjectId(msg_id)},
        {"$set": {"content": new_content.strip(), "is_edited": True}}
    )

    msg['content'] = new_content.strip()
    msg['is_edited'] = True
    msg['_id'] = str(msg['_id'])
    
    # Convert datetime to string for socketio JSON serialization
    if 'created_at' in msg and isinstance(msg['created_at'], datetime.datetime):
        msg['created_at'] = msg['created_at'].isoformat() + "Z"
    elif 'created_at' in msg and isinstance(msg['created_at'], str) and not msg['created_at'].endswith('Z'):
        msg['created_at'] += "Z"

    socketio.emit('message_updated', msg, to=msg.get('project_id'))
    return jsonify(msg), 200

@message_bp.route('/<msg_id>', methods=['DELETE'], strict_slashes=False)
@token_required
def delete_message(current_user_id, msg_id):
    try:
        msg = messages_collection.find_one({"_id": ObjectId(msg_id)})
    except:
        return jsonify({"error": "Invalid ID"}), 400

    if not msg:
        return jsonify({"error": "Not found"}), 404

    if msg.get('sender_id') != current_user_id:
        return jsonify({"error": "Unauthorized"}), 403

    created_at = msg.get('created_at')
    
    # Enforce 10 second limit for deletion
    if (datetime.datetime.utcnow() - created_at).total_seconds() > 10:
        return jsonify({"error": "Messages can only be deleted within 10 seconds of sending"}), 403

    # Soft delete
    messages_collection.update_one(
        {"_id": ObjectId(msg_id)},
        {"$set": {"is_deleted": True, "content": "🚫 This message was deleted", "has_attachment": False, "filename": None}}
    )
    msg['is_deleted'] = True
    msg['content'] = "🚫 This message was deleted"
    msg['has_attachment'] = False
    msg['filename'] = None
    msg['_id'] = str(msg['_id'])
        
    # Convert datetime to string for socketio JSON serialization
    if 'created_at' in msg and isinstance(msg['created_at'], datetime.datetime):
        msg['created_at'] = msg['created_at'].isoformat() + "Z"
    elif 'created_at' in msg and isinstance(msg['created_at'], str) and not msg['created_at'].endswith('Z'):
        msg['created_at'] += "Z"

    socketio.emit('message_updated', msg, to=msg.get('project_id'))
    return jsonify({"message": "Message deleted"}), 200

@message_bp.route('/read', methods=['POST'], strict_slashes=False)
@token_required
def mark_read(current_user_id):
    data = request.json
    project_id = data.get('project_id')

    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    # Find messages in this project not sent by current user, and where current_user_id is not in read_by
    query = {
        "project_id": project_id,
        "sender_id": {"$ne": current_user_id},
        "read_by": {"$ne": current_user_id}
    }

    result = messages_collection.update_many(
        query,
        {"$addToSet": {"read_by": current_user_id}}
    )

    if result.modified_count > 0:
        socketio.emit('messages_read', {"project_id": project_id, "user_id": current_user_id}, to=project_id)

    return jsonify({"modified": result.modified_count}), 200
