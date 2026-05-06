# WorkHive Frontend 🎨

This is the frontend portion of my **WorkHive** application. 

I built this interface focusing heavily on a clean, modern, "glassmorphism" aesthetic that feels premium and highly responsive.

## Technologies I Used Here:
- **React.js** (Bootstrapped with Vite for extremely fast HMR)
- **Tailwind CSS** (For rapid, highly customizable styling and theme management)
- **Framer Motion** (For smooth page transitions and micro-animations)
- **Socket.io-client** (To connect to the Flask backend for real-time chat)
- **@hello-pangea/dnd** (For the smooth, performant drag-and-drop Kanban board)
- **Lucide React** (For beautiful, consistent SVG icons)

## Structure
- `src/components/`: Reusable UI elements (like the Layout sidebar, ChatbotWidget).
- `src/pages/`: Main views (Dashboard, Projects, TaskBoard, Login, Signup).
- `src/context/`: Contains the `AuthContext` to manage user state and JWT tokens globally.
- `src/assets/`: Images and SVGs.

## Development

To run the frontend locally:
```bash
npm install
npm run dev
```

Remember to make sure the Flask backend is running on port 5000 so the API calls and WebSockets connect successfully!
