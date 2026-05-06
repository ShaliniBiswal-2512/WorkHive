# WorkHive 🐝

**WorkHive** - "Where Teams Get Things Done"

WorkHive is a collaborative productivity platform—designed like a hive where teams work efficiently together. It's a modern, premium SaaS task management application featuring role-based access control, project organization, and a smooth drag-and-drop Kanban board for tasks.

## 🧱 Tech Stack
* **Frontend**: React (Vite), Tailwind CSS, Framer Motion, @hello-pangea/dnd, Lucide Icons
* **Backend**: Python Flask (REST API)
* **Database**: MongoDB (via PyMongo)
* **Authentication**: JWT & bcrypt

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB (running locally on `mongodb://localhost:27017` or a cloud Atlas instance)

### 1. Backend Setup
Navigate to the `backend` folder and set up the virtual environment:
```bash
cd backend
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
# (or if requirements.txt isn't present: pip install flask flask-cors pymongo bcrypt pyjwt python-dotenv)

# Ensure MongoDB is running, then start the server
python app.py
```
The Flask API will run on `http://localhost:5000`.

### 2. Frontend Setup
Open a new terminal and navigate to the `frontend` folder:
```bash
cd frontend
npm install

# Start the Vite development server
npm run dev
```
The React app will be available at `http://localhost:5173`.

## ⚙️ Environment Variables
In the `backend/.env` file:
```env
MONGO_URI=mongodb://localhost:27017/workhive
JWT_SECRET=super_secret_workhive_key_123!
PORT=5000
```

## 🎥 Demo Flow
1. **Signup**: Register a new account.
2. **Login**: Log in to access the application.
3. **Dashboard**: View your overall statistics (initially zero).
4. **Projects**: Navigate to the Projects page and click "New Project" to create a workspace.
5. **Task Board**: Open your project to view the Kanban board.
6. **Create Task**: Add new tasks with titles, descriptions, priorities, and due dates.
7. **Drag & Drop**: Move tasks between 'To Do', 'In Progress', and 'Done' columns.
8. **Dashboard Updates**: Return to the Dashboard to see your updated statistics!
