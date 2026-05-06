# WorkHive 🐝

Hello there! Welcome to **WorkHive** — a project I built to help teams organize, collaborate, and get things done efficiently. 

I designed WorkHive to be a premium, AI-powered workspace collaboration platform. It combines traditional task management (like a drag-and-drop Kanban board) with modern features like real-time team chat and AI-powered productivity tools. 

## ✨ Key Features I Built

- **Kanban Task Board**: A fully interactive drag-and-drop board to manage tasks across different columns (To Do, In Progress, Done).
- **Real-Time Team Chat**: I used `Socket.IO` so you can instantly message your team, edit messages, delete them, and share files within specific project workspaces.
- **AI "Catch Me Up" & Task Generation**: I integrated the **Groq API** to analyze your workspace, auto-generate foundational tasks for new projects, and even polish your chat messages using AI.
- **Live Notifications**: Real-time alerts for when you receive a message or when project activity happens.
- **Customizable UI Themes**: I implemented a sleek, glassmorphism UI with dynamic dark-mode themes (Pink, Green, Blue, Yellow) that save to local storage.
- **Secure Authentication**: Built from scratch using JWT (JSON Web Tokens) and bcrypt for password hashing.

## 🧱 Tech Stack Used

I chose a modern, full-stack approach for this project:

* **Frontend**: React.js (Vite), Tailwind CSS for styling, Framer Motion for animations, `@hello-pangea/dnd` for drag-and-drop, and Axios.
* **Backend**: Python Flask, Flask-SocketIO (for WebSockets), and Flask-CORS.
* **Database**: MongoDB (using PyMongo).
* **AI Integration**: Groq API (LLaMA 3).

---

## 🚀 How to Run It Locally

If you want to run my project on your own machine, here is how to set it up!

### Prerequisites
Make sure you have installed:
- Node.js (v18+)
- Python (v3.9+)
- MongoDB (running locally on `mongodb://localhost:27017` or via Atlas)

### 1. Set up the Backend
Open a terminal and go into the `backend` folder:
```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate

# Install the dependencies I used
pip install -r requirements.txt

# Create a .env file with these variables:
# MONGO_URI=mongodb://localhost:27017/workhive
# JWT_SECRET=your_super_secret_key
# GROQ_API_KEY=your_groq_api_key

# Run the Flask Server
python app.py
```
The API and Socket server will start on `http://localhost:5000`.

### 2. Set up the Frontend
Open a new terminal and go into the `frontend` folder:
```bash
cd frontend

# Install all the npm packages
npm install

# Start the Vite development server
npm run dev
```
The React app will be available at `http://localhost:5173`. Open it in your browser, sign up, and start exploring!

---
*Built with ❤️ by ShaliniBiswal-2512*
