# 🚀 WorkHive

WorkHive is a modern AI-powered team collaboration and workspace management platform developed to simplify project coordination, improve team communication, and enhance overall productivity.

The platform combines intelligent task management, real-time collaboration, and AI-assisted workflow automation within a unified and intuitive interface. WorkHive is designed to support teams in organizing projects efficiently while maintaining seamless communication across workspaces.

---

## 🌐 Live Application

🔗 [Access WorkHive](https://workhive.up.railway.app/login)

---

# 📖 Overview

WorkHive provides a collaborative digital workspace where teams can create projects, manage tasks, communicate instantly, and utilize AI-powered productivity features.

The application focuses on delivering a clean user experience with responsive design, real-time synchronization, and scalable architecture suitable for modern collaborative environments.

---

# ✨ Core Features

## 📋 Intelligent Task Management

* Interactive drag-and-drop Kanban board
* Task organization across multiple workflow stages
* Real-time task updates and synchronization
* Workspace-specific task management
* Improved project visibility and collaboration

### Workflow Stages

* To Do
* In Progress
* Completed

---

## 💬 Real-Time Team Communication

* Real-time messaging using WebSockets
* Workspace-based team conversations
* Instant message delivery and updates
* Message editing and deletion support
* File sharing capabilities within workspaces

The communication system enables seamless collaboration between team members without requiring page refreshes or external communication tools.

---

## 🤖 AI-Powered Productivity Tools

WorkHive integrates the Groq API powered by LLaMA 3 to provide intelligent productivity assistance.

### AI Features

* Automatic task generation for new projects
* AI-generated workspace summaries
* Smart text enhancement for professional communication
* Context-aware productivity assistance

These features help reduce manual effort and improve workflow efficiency.

---

## 🔔 Real-Time Notifications

* Instant activity notifications
* Live chat alerts
* Workspace activity tracking
* Improved team awareness and responsiveness

---

## 🎨 Modern User Interface

The application is designed with a modern glassmorphism-inspired interface focused on usability and accessibility.

### UI Highlights

* Fully responsive design
* Smooth animations and transitions
* Multiple customizable themes
* Dark mode support
* Clean and intuitive workspace layout

---

## 🔐 Secure Authentication System

Security and user authentication are implemented using industry-standard practices.

### Authentication Features

* JWT-based authentication
* Secure password hashing using bcrypt
* Protected routes and authenticated sessions
* Secure user management system

---

# 🛠️ Technology Stack

## Frontend Technologies

* React.js (Vite)
* Tailwind CSS
* Framer Motion
* Axios
* @hello-pangea/dnd

---

## Backend Technologies

* Python Flask
* Flask-SocketIO
* Flask-CORS

---

## Database

* MongoDB

---

## AI Integration

* Groq API (LLaMA 3)

---

# ⚙️ Local Development Setup

## 📌 Prerequisites

Ensure the following tools are installed on your system before running the project locally:

* Node.js (v18 or later)
* Python (v3.9 or later)
* MongoDB

---

# 1️⃣ Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment:

### Windows

```bash
venv\Scripts\activate
```

### macOS / Linux

```bash
source venv/bin/activate
```

Install required dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the backend directory and add the following variables:

```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
GROQ_API_KEY=your_groq_api_key
```

Run the backend server:

```bash
python app.py
```

Backend server runs on:

```bash
http://localhost:5000
```

---

# 2️⃣ Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install frontend dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend application runs on:

```bash
http://localhost:5173
```

---

# 📂 Project Structure

```bash
WorkHive/
│
├── frontend/          # React Frontend
├── backend/           # Flask Backend
├── README.md
└── requirements.txt
```

---

# 👩‍💻 Author

Developed and maintained by **Shalini Biswal**
