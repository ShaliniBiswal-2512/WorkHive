from flask import Blueprint, request, jsonify
from db import tasks_collection, projects_collection, users_collection, notifications_collection
from utils.auth import token_required
from bson.objectid import ObjectId
import datetime
import os
import json
from groq import Groq
from socket_instance import socketio

task_bp = Blueprint('tasks', __name__)

@task_bp.route('', methods=['POST'], strict_slashes=False)
@token_required
def create_task(current_user_id):
    data = request.json
    title = data.get('title')
    description = data.get('description', '')
    due_date = data.get('due_date')
    priority = data.get('priority', 'Medium')
    status = data.get('status', 'To Do')
    assigned_to = data.get('assigned_to')
    project_id = data.get('project_id')

    if not title or not project_id:
        return jsonify({"error": "Title and Project ID are required"}), 400

    try:
        project = projects_collection.find_one({"_id": ObjectId(project_id)})
    except:
        return jsonify({"error": "Invalid project ID"}), 400

    if not project:
        return jsonify({"error": "Project not found"}), 404

    # Ensure user is a member of the project
    if current_user_id not in project.get('members', []):
        return jsonify({"error": "Unauthorized"}), 403

    task = {
        "title": title,
        "description": description,
        "due_date": due_date,
        "priority": priority,
        "status": status,
        "assigned_to": assigned_to,
        "project_id": project_id,
        "created_by": current_user_id
    }

    result = tasks_collection.insert_one(task)
    task['_id'] = str(result.inserted_id)

    creator = users_collection.find_one({"_id": ObjectId(current_user_id)})
    creator_name = creator['name'] if creator else 'Someone'

    for member_id in project.get('members', []):
        if member_id == current_user_id:
            continue
            
        if assigned_to and member_id == assigned_to:
            msg = f"{creator_name} assigned you a new task: '{title}'."
        else:
            msg = f"{creator_name} added a new task: '{title}'."
            
        notif = {
            "user_id": member_id,
            "message": msg,
            "read": False,
            "created_at": datetime.datetime.utcnow()
        }
        res = notifications_collection.insert_one(notif)
        notif['_id'] = str(res.inserted_id)
        notif['created_at'] = notif['created_at'].isoformat()
        socketio.emit('new_notification', notif, room=project_id)

    return jsonify(task), 201

@task_bp.route('/ai-sprint', methods=['POST'])
@token_required
def ai_sprint(current_user_id):
    data = request.json
    project_id = data.get('project_id')
    prompt = data.get('prompt')

    if not project_id or not prompt:
        return jsonify({"error": "Project ID and prompt are required"}), 400
        
    try:
        project = projects_collection.find_one({"_id": ObjectId(project_id)})
        if not project or current_user_id not in project.get('members', []):
            return jsonify({"error": "Unauthorized"}), 403
            
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            return jsonify({"error": "GROQ_API_KEY is not configured in backend .env file. Please add it to use the AI Sprint feature."}), 500
            
        client = Groq(api_key=groq_api_key)
        
        system_prompt = '''You are an expert technical product manager. Break the user's high-level goal into 5 to 8 actionable tasks.
You MUST output ONLY a valid JSON object with a single key "tasks" containing an array of task objects.
Each task object must exactly have these string keys:
- "title": a short task title
- "description": detailed description
- "priority": exactly one of "High", "Medium", or "Low"'''

        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1024,
            response_format={"type": "json_object"}
        )
        
        response_text = completion.choices[0].message.content
        tasks_data = json.loads(response_text)
        tasks_list = tasks_data.get("tasks", [])
        
        if not tasks_list:
            return jsonify({"error": "AI failed to generate tasks. Please try again."}), 500
            
        created_tasks = []
        for t in tasks_list:
            new_task = {
                "title": t.get("title", "Generated Task"),
                "description": t.get("description", ""),
                "due_date": "",
                "priority": t.get("priority", "Medium"),
                "status": "To Do",
                "assigned_to": "",
                "project_id": project_id,
                "created_by": current_user_id
            }
            res = tasks_collection.insert_one(new_task)
            new_task["_id"] = str(res.inserted_id)
            created_tasks.append(new_task)
            
        return jsonify(created_tasks), 201

    except Exception as e:
        print(f"AI Sprint Error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@task_bp.route('', methods=['GET'], strict_slashes=False)
@token_required
def get_tasks(current_user_id):
    project_id = request.args.get('project_id')

    if not project_id:
        return jsonify({"error": "Project ID is required"}), 400

    try:
        project = projects_collection.find_one({"_id": ObjectId(project_id)})
    except:
        return jsonify({"error": "Invalid project ID"}), 400

    if not project:
        return jsonify({"error": "Project not found"}), 404

    if current_user_id not in project.get('members', []):
        return jsonify({"error": "Unauthorized"}), 403

    tasks = list(tasks_collection.find({"project_id": project_id}))
    
    # Format and attach assignee details
    for task in tasks:
        task['_id'] = str(task['_id'])
        if task.get('assigned_to'):
            try:
                user = users_collection.find_one({"_id": ObjectId(task['assigned_to'])}, {"name": 1, "email": 1})
                if user:
                    user['_id'] = str(user['_id'])
                    task['assignee_details'] = user
            except:
                pass

    return jsonify(tasks), 200

@task_bp.route('/<task_id>', methods=['PUT'])
@token_required
def update_task(current_user_id, task_id):
    data = request.json

    try:
        task = tasks_collection.find_one({"_id": ObjectId(task_id)})
    except:
        return jsonify({"error": "Invalid task ID"}), 400

    if not task:
        return jsonify({"error": "Task not found"}), 404

    try:
        project = projects_collection.find_one({"_id": ObjectId(task['project_id'])})
    except:
        return jsonify({"error": "Project not found"}), 404

    if current_user_id not in project.get('members', []):
        return jsonify({"error": "Unauthorized"}), 403

    is_admin = (current_user_id == project.get('admin_id'))

    update_fields = {}
    allowed_fields = ['title', 'description', 'due_date', 'priority', 'status', 'assigned_to']
    
    for field in allowed_fields:
        if field in data:
            update_fields[field] = data[field]

    if update_fields:
        tasks_collection.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": update_fields}
        )
        
        updater = users_collection.find_one({"_id": ObjectId(current_user_id)})
        updater_name = updater['name'] if updater else 'Someone'

        assigned_to = update_fields.get('assigned_to')
        newly_assigned = False
        if 'assigned_to' in update_fields and assigned_to and assigned_to != current_user_id:
            if assigned_to != task.get('assigned_to'):
                newly_assigned = True

        task_title = update_fields.get('title', task.get('title', 'Task'))
        
        changed_fields = []
        if 'status' in update_fields and update_fields['status'] != task.get('status'):
            changed_fields.append("status")
        if 'priority' in update_fields and update_fields['priority'] != task.get('priority'):
            changed_fields.append("priority")
        if 'title' in update_fields and update_fields['title'] != task.get('title'):
            changed_fields.append("title")
        if 'description' in update_fields and update_fields['description'] != task.get('description'):
            changed_fields.append("description")
        if 'due_date' in update_fields and update_fields['due_date'] != task.get('due_date'):
            changed_fields.append("due date")
            
        is_only_status = len(changed_fields) == 1 and changed_fields[0] == "status"
        
        if is_only_status:
            new_status = update_fields['status']
            if new_status == 'Done':
                base_msg = f"{updater_name} marked task '{task_title}' as Done."
            elif new_status == 'In Progress':
                base_msg = f"{updater_name} moved task '{task_title}' to In Progress."
            else:
                base_msg = f"{updater_name} moved task '{task_title}' to To Do."
        elif len(changed_fields) > 0:
            fields_str = ", ".join(changed_fields)
            base_msg = f"{updater_name} updated {fields_str} for task '{task_title}'."
        elif newly_assigned:
            base_msg = f"{updater_name} reassigned task '{task_title}'."
        else:
            base_msg = f"{updater_name} updated task '{task_title}'."

        for member_id in project.get('members', []):
            if member_id == current_user_id:
                continue
                
            if newly_assigned and member_id == assigned_to:
                msg = f"{updater_name} assigned you the task '{task_title}'."
            else:
                msg = base_msg
                
            notif = {
                "user_id": member_id,
                "message": msg,
                "read": False,
                "created_at": datetime.datetime.utcnow()
            }
            res = notifications_collection.insert_one(notif)
            notif['_id'] = str(res.inserted_id)
            notif['created_at'] = notif['created_at'].isoformat()
            socketio.emit('new_notification', notif, room=task['project_id'])

    # Return updated task
    updated_task = tasks_collection.find_one({"_id": ObjectId(task_id)})
    updated_task['_id'] = str(updated_task['_id'])
    
    if updated_task.get('assigned_to'):
        try:
            user = users_collection.find_one({"_id": ObjectId(updated_task['assigned_to'])}, {"name": 1, "email": 1})
            if user:
                user['_id'] = str(user['_id'])
                updated_task['assignee_details'] = user
        except:
            pass

    return jsonify(updated_task), 200

@task_bp.route('/<task_id>', methods=['DELETE'])
@token_required
def delete_task(current_user_id, task_id):
    try:
        task = tasks_collection.find_one({"_id": ObjectId(task_id)})
    except:
        return jsonify({"error": "Invalid task ID"}), 400

    if not task:
        return jsonify({"error": "Task not found"}), 404

    try:
        project = projects_collection.find_one({"_id": ObjectId(task['project_id'])})
    except:
        return jsonify({"error": "Project not found"}), 404

    # Anyone in project can delete tasks
    # if project.get('admin_id') != current_user_id:
    #     return jsonify({"error": "Unauthorized. Only project admin can delete tasks."}), 403

    tasks_collection.delete_one({"_id": ObjectId(task_id)})

    updater = users_collection.find_one({"_id": ObjectId(current_user_id)})
    updater_name = updater['name'] if updater else 'Someone'

    for member_id in project.get('members', []):
        if member_id == current_user_id:
            continue
        notif = {
            "user_id": member_id,
            "message": f"{updater_name} deleted task: '{task.get('title', 'Task')}'.",
            "read": False,
            "created_at": datetime.datetime.utcnow()
        }
        res = notifications_collection.insert_one(notif)
        notif['_id'] = str(res.inserted_id)
        notif['created_at'] = notif['created_at'].isoformat()
        socketio.emit('new_notification', notif, room=task['project_id'])

    return jsonify({"message": "Task deleted successfully"}), 200
