import os
import json
from groq import Groq

client = Groq(api_key=os.getenv('GROQ_API_KEY'))
system_prompt = '''You are an expert technical product manager. The user is creating a new workspace called 'Marketing'. 
Generate exactly 3 to 4 foundational starting tasks for a Kanban board.
You MUST output ONLY a valid JSON object with a single key "tasks" containing an array of task objects.
Each task object must exactly have these string keys:
- "title": a short task title
- "description": detailed description
- "priority": exactly one of "High", "Medium", or "Low"
- "status": "To Do"'''

try:
    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Generate the tasks now."}
        ],
        temperature=0.7,
        max_tokens=1024,
        response_format={"type": "json_object"}
    )
    print("RESPONSE:")
    print(completion.choices[0].message.content)
except Exception as e:
    print(f"ERROR: {str(e)}")
