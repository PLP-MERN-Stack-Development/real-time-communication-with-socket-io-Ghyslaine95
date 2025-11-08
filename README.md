🚀 Project Overview
This is a modern real-time chat application that allows users to:

Join chat rooms with unique usernames

Send and receive messages instantly

See online users in real-time

Switch between multiple chat rooms

Experience typing indicators

Private messaging capabilities

Architecture
Frontend: React with Vite build tool

Backend: Node.js with Express and Socket.io

Real-time Communication: WebSockets via Socket.io

State Management: React hooks and context

🛠️ Setup Instructions
Prerequisites
Node.js (v18 or higher)

npm or yarn

Modern web browser

Installation
Clone the repository

bash
git clone <your-repository-url>
cd socketio-chat
Set up the server

bash
cd server
npm install
Set up the client

bash
cd ../client
npm install

Running the Application
Start the server (Terminal 1)

bash
cd server
npm run dev
Server runs on: http://localhost:5000

Start the client (Terminal 2)

bash
cd client
npm run dev
Client runs on: http://localhost:5173

Access the application
Open your browser and navigate to: http://localhost:5173

🎯 Features Implemented
✅ Core Features (Completed)
Real-time messaging with instant delivery

User authentication with username-based system

Multiple chat rooms (General, Random, Tech)

Online/offline status for all users

Message timestamps and sender information

Typing indicators showing when users are composing messages

✅ Advanced Features (Completed)
Private messaging between users

Room management with dynamic joining/leaving

Message history per room

User join/leave notifications

Responsive design for desktop and mobile

Message delivery feedback with temporary messages

✅ Real-time Notifications
Visual indicators for new messages

User presence updates

System notifications for room events

Connection status indicators

✅ User Experience
Clean, modern UI with intuitive navigation

Instant feedback for all actions

Error handling and validation

Auto-scroll to newest messages

Message status (sending, delivered)


🔧 Technical Implementation
Frontend Architecture
React 18 with functional components and hooks

Socket.io-client for real-time communication

Custom CSS for styling (no external UI frameworks)

Vite for fast development and building

Backend Architecture
Node.js with Express.js

Socket.io for WebSocket management

In-memory storage for users and messages

CORS enabled for cross-origin requests

Key Socket Events
javascript
// Client to Server
socket.emit('user_join', username)
socket.emit('send_message', messageData)
socket.emit('join_room', roomName)

// Server to Client
socket.on('receive_message', message)
socket.on('user_list', users)
socket.on('user_joined', userData)

🧪 Testing the Application
Open multiple browser tabs to simulate multiple users

Test different scenarios:

Join with different usernames

Send messages between users

Switch between rooms

Test typing indicators

Verify user presence

Check server logs for real-time activity monitoring


📸 Application Screenshots
Login Screen
![Login Screen](images/login.png)

Main Chat Interface
![Chat Screen](images/chat.png)


📄 License
This project is licensed under the MIT License - see the LICENSE file for details.










