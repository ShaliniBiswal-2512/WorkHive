from flask import Flask, send_from_directory
from flask_cors import CORS
import os
from dotenv import load_dotenv

from routes.auth_routes import auth_bp
from routes.project_routes import project_bp
from routes.task_routes import task_bp
from routes.dashboard_routes import dashboard_bp
from routes.notification_routes import notification_bp
from routes.bot_routes import bot_bp
from routes.message_routes import message_bp

load_dotenv()

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Create uploads directory if it doesn't exist
os.makedirs('uploads', exist_ok=True)

from socket_instance import socketio
from flask_socketio import join_room, leave_room
import jwt

socketio.init_app(app)

@socketio.on('join_workspace')
def on_join(data):
    token = data.get('token')
    project_id = data.get('project_id')
    if not token or not project_id:
        return
    
    try:
        data_decoded = jwt.decode(token, os.getenv('JWT_SECRET'), algorithms=["HS256"])
        # If token is valid, join the room
        join_room(project_id)
    except Exception as e:
        print("Invalid token for socket connection:", e)
        return

@socketio.on('leave_workspace')
def on_leave(data):
    project_id = data.get('project_id')
    if project_id:
        leave_room(project_id)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(project_bp, url_prefix='/api/projects')
app.register_blueprint(task_bp, url_prefix='/api/tasks')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
app.register_blueprint(notification_bp, url_prefix='/api/notifications')
app.register_blueprint(message_bp, url_prefix='/api/messages')
app.register_blueprint(bot_bp, url_prefix='/api/bot')

@app.route('/api/uploads/<path:filename>')
def serve_uploads(filename):
    return send_from_directory('uploads', filename)

@app.route('/')
def index():
    return "WorkHive API is running."

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    socketio.run(app, debug=True, port=port)
