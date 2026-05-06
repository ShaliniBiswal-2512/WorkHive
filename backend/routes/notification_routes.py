from flask import Blueprint, request, jsonify
from db import notifications_collection
from utils.auth import token_required
from bson.objectid import ObjectId
import datetime

notification_bp = Blueprint('notifications', __name__)

@notification_bp.route('', methods=['GET'], strict_slashes=False)
@token_required
def get_notifications(current_user_id):
    # Fetch notifications for the current user, sorted by newest first
    notifications = list(notifications_collection.find({"user_id": current_user_id}).sort("created_at", -1).limit(50))
    
    for notif in notifications:
        notif['_id'] = str(notif['_id'])
        
    return jsonify(notifications), 200

@notification_bp.route('/<notification_id>/read', methods=['PUT'])
@token_required
def mark_as_read(current_user_id, notification_id):
    try:
        notif = notifications_collection.find_one({"_id": ObjectId(notification_id)})
    except:
        return jsonify({"error": "Invalid notification ID"}), 400

    if not notif:
        return jsonify({"error": "Notification not found"}), 404

    if notif['user_id'] != current_user_id:
        return jsonify({"error": "Unauthorized"}), 403

    notifications_collection.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"read": True}}
    )

    return jsonify({"message": "Marked as read"}), 200

@notification_bp.route('/read-all', methods=['PUT'])
@token_required
def mark_all_as_read(current_user_id):
    notifications_collection.update_many(
        {"user_id": current_user_id, "read": False},
        {"$set": {"read": True}}
    )
    return jsonify({"message": "All marked as read"}), 200
