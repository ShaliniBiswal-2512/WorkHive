from flask import Blueprint, request, jsonify
from utils.auth import token_required
from groq import Groq
import os

bot_bp = Blueprint('bot', __name__)

# Initialize Groq client
try:
    client = Groq(api_key=os.environ.get('GROQ_API_KEY'))
except Exception as e:
    print("Failed to initialize Groq client:", e)
    client = None

SYSTEM_PROMPT = """You are 'HiveBot', the friendly, helpful, and highly knowledgeable AI support assistant for WorkHive.
WorkHive is a modern, premium workspace collaboration platform.
Key features include:
- Real-time Team Chat (available inside the Hub and Workspaces).
- Task Boards (Kanban style task management).
- High performance, bank-grade security, and a beautiful dark-glassmorphism aesthetic.
- Workspaces: where users create projects, invite team members via an invite code, and manage tasks.

Your goal is to answer user questions about the app, guide them on how to use features, and troubleshoot basic issues. 
Keep your answers concise, professional, yet friendly. 
CRITICAL FORMATTING RULES:
1. Always use proper markdown formatting.
2. Use standard Markdown headers (`### Feature Name`) instead of underlining with `===` or `---`.
3. Use bold text (`**text**`) for emphasis and bullet points for lists.
If you don't know the answer, politely say so and recommend they contact support@workhive.app.
"""

@bot_bp.route('/chat', methods=['POST'])
@token_required
def chat_with_bot(current_user):
    if not client:
        return jsonify({'error': 'AI client not initialized. Check API key.'}), 500

    data = request.get_json()
    message = data.get('message')
    history = data.get('history', [])

    if not message:
        return jsonify({'error': 'Message is required'}), 400

    try:
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # Append history (limited to last 10 messages for context)
        for msg in history[-10:]:
            # Ensure roles are 'user' or 'assistant'
            if msg.get('role') in ['user', 'assistant'] and msg.get('content'):
                messages.append({"role": msg['role'], "content": msg['content']})
        
        # Append current message
        messages.append({"role": "user", "content": message})

        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
        )

        response_content = completion.choices[0].message.content

        return jsonify({'response': response_content}), 200

    except Exception as e:
        print(f"Bot Error: {str(e)}")
        return jsonify({'error': 'Failed to get response from AI assistant.'}), 500

@bot_bp.route('/polish', methods=['POST'])
@token_required
def polish_message(current_user):
    if not client:
        return jsonify({'error': 'AI client not initialized. Check API key.'}), 500

    data = request.get_json()
    draft = data.get('text')

    if not draft:
        return jsonify({'error': 'Text is required'}), 400

    prompt = f"""You are an AI writing assistant. Rewrite the following message to sound highly professional, polite, and clear, suitable for a workplace team chat. 
Return ONLY the rewritten text, with no conversational filler or quotes.

Original message:
{draft}"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "system", "content": prompt}],
            temperature=0.3,
            max_tokens=500,
        )

        polished_text = completion.choices[0].message.content.strip()
        
        # Remove surrounding quotes if the AI accidentally included them
        if polished_text.startswith('"') and polished_text.endswith('"'):
            polished_text = polished_text[1:-1]
        elif polished_text.startswith("'") and polished_text.endswith("'"):
            polished_text = polished_text[1:-1]
            
        return jsonify({'polished_text': polished_text}), 200

    except Exception as e:
        print(f"Polish Error: {str(e)}")
        return jsonify({'error': 'Failed to polish message.'}), 500
