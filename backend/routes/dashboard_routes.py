from flask import Blueprint, jsonify, request
from db import tasks_collection, projects_collection, messages_collection, users_collection
from utils.auth import token_required
import os
from groq import Groq

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('', methods=['GET'], strict_slashes=False)
@token_required
def get_dashboard_stats(current_user_id):
    project_id = request.args.get('project_id')
    
    # Get all projects the user is a member of
    user_projects = list(projects_collection.find({"members": current_user_id}))
    user_project_ids = [str(p['_id']) for p in user_projects]
    
    if project_id and project_id != 'all':
        if project_id in user_project_ids:
            project_ids = [project_id]
        else:
            return jsonify({"error": "Unauthorized"}), 403
    else:
        project_ids = user_project_ids

    if not project_ids:
        return jsonify({
            "total_tasks": 0,
            "tasks_by_status": {"To Do": 0, "In Progress": 0, "Done": 0},
            "tasks_per_user": {},
            "overdue_tasks": 0,
            "chart_data": [],
            "recent_activity": []
        }), 200

    # Get all tasks for these projects
    tasks = list(tasks_collection.find({"project_id": {"$in": project_ids}}))

    total_tasks = len(tasks)
    tasks_by_status = {"To Do": 0, "In Progress": 0, "Done": 0}
    tasks_per_user = {}
    overdue_tasks = 0

    from datetime import datetime, timedelta

    for task in tasks:
        status = task.get('status', 'To Do')
        if status in tasks_by_status:
            tasks_by_status[status] += 1
        else:
            tasks_by_status[status] = 1

        assignee = task.get('assigned_to')
        if assignee:
            if assignee in tasks_per_user:
                tasks_per_user[assignee] += 1
            else:
                tasks_per_user[assignee] = 1

        due_date_str = task.get('due_date')
        if due_date_str and status != 'Done':
            try:
                due_date = datetime.strptime(due_date_str, "%Y-%m-%d")
                if due_date < datetime.now():
                    overdue_tasks += 1
            except:
                pass

    # Mock Chart Data
    chart_data = []
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    today = datetime.today()
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        day_name = days[d.weekday()]
        chart_data.append({
            "name": day_name,
            "completed": (i * 3) % 6 + 2,
            "added": (i * 2) % 4 + 3
        })

    # Generate Realistic Recent Activity from Tasks
    recent_activity = []
    try:
        tasks_sorted = sorted(tasks, key=lambda x: str(x['_id']), reverse=True)
        
        from db import users_collection
        from bson.objectid import ObjectId
        
        # Gather all unique user IDs involved in these recent tasks
        user_ids = set()
        for t in tasks_sorted[:5]:
            if t.get('created_by'):
                user_ids.add(t['created_by'])
            if t.get('assigned_to'):
                user_ids.add(t['assigned_to'])
                
        valid_user_ids = [ObjectId(uid) for uid in user_ids if isinstance(uid, str) and len(uid) == 24]
        user_docs = list(users_collection.find({"_id": {"$in": valid_user_ids}}))
        user_map = {str(u['_id']): u.get('name', 'User') for u in user_docs}
        
        for t in tasks_sorted[:5]:
            creator_id = t.get('created_by')
            creator_name = user_map.get(creator_id, "Someone")
            
            status = t.get('status', 'To Do')
            task_title = t.get('title', 'a task')
            
            # Extract creation time from MongoDB ObjectId
            creation_time = t['_id'].generation_time
            now = datetime.utcnow().replace(tzinfo=creation_time.tzinfo)
            diff = now - creation_time
            
            if diff.days > 0:
                time_str = f"{diff.days}d ago"
            elif diff.seconds >= 3600:
                time_str = f"{diff.seconds // 3600}h ago"
            elif diff.seconds >= 60:
                time_str = f"{diff.seconds // 60}m ago"
            else:
                time_str = "just now"

            if status == 'Done':
                action = f"Completed '{task_title}'"
                type_str = "complete"
            elif status == 'In Progress':
                action = f"Working on '{task_title}'"
                type_str = "progress"
            else:
                action = f"Created '{task_title}'"
                type_str = "system"
                
            recent_activity.append({
                "id": str(t['_id']),
                "user": creator_name,
                "action": action,
                "time": time_str,
                "type": type_str
            })
    except Exception as e:
        print("Error generating activity feed:", e)

    return jsonify({
        "total_tasks": total_tasks,
        "tasks_by_status": tasks_by_status,
        "tasks_per_user": tasks_per_user,
        "overdue_tasks": overdue_tasks,
        "chart_data": chart_data,
        "recent_activity": recent_activity
    }), 200

@dashboard_bp.route('/catch-me-up', methods=['GET'])
@token_required
def catch_me_up(current_user_id):
    try:
        user_projects = list(projects_collection.find({"members": current_user_id}))
        project_ids = [str(p['_id']) for p in user_projects]
        
        if not project_ids:
            return jsonify({"summary": "You haven't joined any workspaces yet! Join one to start collaborating."}), 200
            
        # Get recent messages
        recent_messages = list(messages_collection.find({"project_id": {"$in": project_ids}}).sort("_id", -1).limit(30))
        
        # Get recent tasks
        recent_tasks = list(tasks_collection.find({"project_id": {"$in": project_ids}}).sort("_id", -1).limit(20))
        
        if not recent_messages and not recent_tasks:
            return jsonify({"summary": "No recent activity to catch up on. Your workspaces are all quiet!"}), 200
            
        # Build context
        context_str = "RECENT CHAT MESSAGES:\n"
        for msg in reversed(recent_messages):
            context_str += f"- {msg.get('sender_name', 'Someone')}: {msg.get('content', '')}\n"
            
        context_str += "\nRECENT TASKS:\n"
        for task in recent_tasks:
            context_str += f"- Task '{task.get('title')}' is currently '{task.get('status')}'\n"
            
        groq_api_key = os.getenv('GROQ_API_KEY')
        if not groq_api_key:
            return jsonify({"error": "Groq API key not configured"}), 500
            
        client = Groq(api_key=groq_api_key)
        
        prompt = f"""You are an AI assistant for WorkHive. Summarize the following recent activity across the user's workspaces.
Rules:
1. Keep it extremely concise, maximum 3 bullet points.
2. Be friendly and conversational.
3. Highlight key decisions, new tasks, or active discussions.
4. Use standard markdown for bolding. DO NOT use markdown headers or raw underlines.

ACTIVITY CONTEXT:
{context_str}
"""
        
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "system", "content": prompt}],
            temperature=0.3,
            max_tokens=250
        )
        
        summary = response.choices[0].message.content
        return jsonify({"summary": summary}), 200
        
    except Exception as e:
        print(f"Catch Me Up Error: {e}")
        return jsonify({"error": "Failed to generate summary"}), 500
