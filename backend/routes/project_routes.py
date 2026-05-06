from flask import Blueprint, request, jsonify
from db import projects_collection, users_collection, notifications_collection
from utils.auth import token_required
from bson.objectid import ObjectId
import datetime
import random
import string

project_bp = Blueprint('projects', __name__)

@project_bp.route('', methods=['POST'], strict_slashes=False)
@token_required
def create_project(current_user_id):
    data = request.json
    name = data.get('name')

    if not name:
        return jsonify({"error": "Project name is required"}), 400

    invite_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

    project = {
        "name": name,
        "admin_id": current_user_id,
        "members": [current_user_id], # Admin is also a member
        "invite_code": invite_code
    }

    result = projects_collection.insert_one(project)
    
    # Return the created project
    project['_id'] = str(result.inserted_id)
    return jsonify(project), 201

@project_bp.route('', methods=['GET'], strict_slashes=False)
@token_required
def get_projects(current_user_id):
    # Fetch projects where the user is an admin or a member
    projects = list(projects_collection.find({"members": current_user_id}))
    
    # Format the response
    for project in projects:
        project['_id'] = str(project['_id'])
        # Get member details
        members_data = []
        for member_id in project.get('members', []):
            try:
                user = users_collection.find_one({"_id": ObjectId(member_id)}, {"password": 0})
                if user:
                    user['_id'] = str(user['_id'])
                    members_data.append(user)
            except:
                pass
        project['member_details'] = members_data

    return jsonify(projects), 200

@project_bp.route('/<project_id>/add-member', methods=['POST'])
@token_required
def add_member(current_user_id, project_id):
    data = request.json
    email = data.get('email')

    if not email:
        return jsonify({"error": "Email is required"}), 400

    try:
        project = projects_collection.find_one({"_id": ObjectId(project_id)})
    except:
        return jsonify({"error": "Invalid project ID"}), 400

    if not project:
        return jsonify({"error": "Project not found"}), 404

    # Only admin can add members
    if project.get('admin_id') != current_user_id:
        return jsonify({"error": "Unauthorized"}), 403

    user_to_add = users_collection.find_one({"email": email})
    if not user_to_add:
        return jsonify({"error": "User not found"}), 404

    user_id_str = str(user_to_add['_id'])
    
    if user_id_str in project.get('members', []):
        return jsonify({"error": "User is already a member"}), 400

    projects_collection.update_one(
        {"_id": ObjectId(project_id)},
        {"$push": {"members": user_id_str}}
    )

    # Notify the user
    admin_user = users_collection.find_one({"_id": ObjectId(current_user_id)})
    admin_name = admin_user['name'] if admin_user else 'Someone'
    
    notifications_collection.insert_one({
        "user_id": user_id_str,
        "message": f"{admin_name} added you to the workspace '{project['name']}'.",
        "read": False,
        "created_at": datetime.datetime.utcnow()
    })

    return jsonify({"message": "Member added successfully", "user": {"id": user_id_str, "name": user_to_add['name'], "email": email}}), 200

@project_bp.route('/join', methods=['POST'])
@token_required
def join_project(current_user_id):
    data = request.json
    invite_code = data.get('invite_code')

    if not invite_code:
        return jsonify({"error": "Invite code is required"}), 400

    clean_code = invite_code.strip().upper()
    project = projects_collection.find_one({"invite_code": clean_code})
    
    if not project:
        return jsonify({"error": "Invalid invite code"}), 404

    project_id_str = str(project['_id'])

    if current_user_id in project.get('members', []):
        return jsonify({"error": "You are already a member of this workspace"}), 400

    projects_collection.update_one(
        {"_id": project['_id']},
        {"$push": {"members": current_user_id}}
    )

    # Notify admin
    joining_user = users_collection.find_one({"_id": ObjectId(current_user_id)})
    joining_name = joining_user['name'] if joining_user else 'Someone'
    
    notifications_collection.insert_one({
        "user_id": project['admin_id'],
        "message": f"{joining_name} joined your workspace '{project['name']}' via invite code.",
        "read": False,
        "created_at": datetime.datetime.utcnow()
    })

    return jsonify({"message": "Joined workspace successfully", "project_id": project_id_str}), 200


@project_bp.route('/<project_id>/remove-member', methods=['DELETE'])
@token_required
def remove_member(current_user_id, project_id):
    data = request.json
    member_id = data.get('member_id')

    if not member_id:
        return jsonify({"error": "Member ID is required"}), 400

    try:
        project = projects_collection.find_one({"_id": ObjectId(project_id)})
    except:
        return jsonify({"error": "Invalid project ID"}), 400

    if not project:
        return jsonify({"error": "Project not found"}), 404

    # Only admin can remove members
    if project.get('admin_id') != current_user_id:
        return jsonify({"error": "Unauthorized"}), 403

    if member_id == project.get('admin_id'):
        return jsonify({"error": "Cannot remove the admin"}), 400

    projects_collection.update_one(
        {"_id": ObjectId(project_id)},
        {"$pull": {"members": member_id}}
    )

    return jsonify({"message": "Member removed successfully"}), 200

@project_bp.route('/<project_id>', methods=['DELETE'])
@token_required
def delete_project(current_user_id, project_id):
    try:
        project = projects_collection.find_one({"_id": ObjectId(project_id)})
    except:
        return jsonify({"error": "Invalid project ID"}), 400

    if not project:
        return jsonify({"error": "Project not found"}), 404

    # Only admin can delete the project
    if project.get('admin_id') != current_user_id:
        return jsonify({"error": "Unauthorized. Only project admin can delete the project."}), 403

    # Delete the project
    projects_collection.delete_one({"_id": ObjectId(project_id)})
    
    # Delete all tasks associated with this project
    from db import tasks_collection
    tasks_collection.delete_many({"project_id": project_id})

    return jsonify({"message": "Project deleted successfully"}), 200

@project_bp.route('/<project_id>', methods=['PUT'])
@token_required
def update_project(current_user_id, project_id):
    data = request.json
    new_name = data.get('name')

    if not new_name:
        return jsonify({"error": "Project name is required"}), 400

    try:
        project = projects_collection.find_one({"_id": ObjectId(project_id)})
    except:
        return jsonify({"error": "Invalid project ID"}), 400

    if not project:
        return jsonify({"error": "Project not found"}), 404

    # Only admin can edit the project name
    if project.get('admin_id') != current_user_id:
        return jsonify({"error": "Unauthorized. Only project admin can edit the project."}), 403

    projects_collection.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": {"name": new_name}}
    )

    return jsonify({"message": "Project updated successfully", "name": new_name}), 200
