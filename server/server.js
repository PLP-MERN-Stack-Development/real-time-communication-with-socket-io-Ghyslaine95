import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES modules equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // ASSUREZ-VOUS QUE C'EST LE BON PORT!
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Store connected users and messages
const users = new Map(); // socket.id -> user data
const rooms = ['general', 'random', 'tech'];
const messages = {
  general: [],
  random: [],
  tech: []
};

console.log('🔄 Initializing Socket.io server...');

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);
  
  let currentUser = null;

  // Handle user joining - CORRIGÉ
  socket.on('user_join', (username) => {
    console.log(`👋 User join request: "${username}" (socket: ${socket.id})`);
    
    if (!username || username.trim() === '') {
      console.log('❌ Invalid username');
      socket.emit('error', { message: 'Invalid username' });
      return;
    }

    // Create user object
    currentUser = {
      id: socket.id,
      username: username.trim(),
      room: 'general',
      isOnline: true,
      lastSeen: new Date()
    };
    
    // Store user
    users.set(socket.id, currentUser);
    socket.join('general');
    
    console.log(`✅ User registered: ${currentUser.username}`);
    console.log(`📊 Total users: ${users.size}`);
    
    // Notify all clients
    io.emit('user_list', Array.from(users.values()));
    io.emit('user_joined', { 
      username: currentUser.username, 
      id: socket.id 
    });
    
    // Send current state to the new user
    socket.emit('rooms_list', rooms);
    socket.emit('message_history', messages.general || []);
    
    console.log(`🎉 ${currentUser.username} successfully joined the chat`);
  });

  // Handle chat messages - CORRIGÉ
  socket.on('send_message', (messageData) => {
    console.log(`📨 Received send_message event from ${socket.id}:`, messageData);
    
    const user = users.get(socket.id);
    
    if (!user) {
      console.log(`❌ Message from unknown user (socket: ${socket.id})`);
      console.log(`📊 Current users:`, Array.from(users.keys()));
      socket.emit('error', { message: 'User not registered' });
      return;
    }

    console.log(`📝 Message from ${user.username}: "${messageData.content}"`);

    const message = {
      id: Date.now().toString(),
      username: user.username,
      userId: socket.id,
      content: messageData.content,
      timestamp: new Date().toISOString(),
      room: user.room,
      type: 'text'
    };
    
    // Store message in room history
    if (messages[user.room]) {
      messages[user.room].push(message);
      
      // Limit stored messages
      if (messages[user.room].length > 100) {
        messages[user.room].shift();
      }
    }
    
    console.log(`📢 Broadcasting to room: ${user.room}`);
    console.log(`👥 Users in room ${user.room}:`, 
      Array.from(users.values())
        .filter(u => u.room === user.room)
        .map(u => u.username)
    );
    
    // Broadcast to room - CORRECTION IMPORTANTE
    io.to(user.room).emit('receive_message', message);
    console.log(`✅ Message "${messageData.content}" broadcasted by ${user.username}`);
  });

  // Handle room joining
  socket.on('join_room', (roomName) => {
    const user = users.get(socket.id);
    if (!user) {
      console.log(`❌ Room join attempt by unknown user: ${socket.id}`);
      return;
    }

    if (!rooms.includes(roomName)) {
      console.log(`❌ Invalid room: ${roomName}`);
      socket.emit('error', { message: 'Invalid room' });
      return;
    }

    console.log(`🔄 ${user.username} joining room: ${roomName}`);

    // Leave previous room
    if (user.room) {
      socket.leave(user.room);
      console.log(`← ${user.username} left room: ${user.room}`);
    }

    // Join new room
    user.room = roomName;
    socket.join(roomName);

    console.log(`→ ${user.username} joined room: ${roomName}`);

    // Send room message history
    socket.emit('message_history', messages[roomName] || []);
    
    // Notify room
    socket.to(roomName).emit('user_joined_room', {
      username: user.username,
      room: roomName,
      timestamp: new Date()
    });

    console.log(`✅ ${user.username} successfully switched to room: ${roomName}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
    
    const user = users.get(socket.id);
    if (user) {
      console.log(`👋 User left: ${user.username}`);
      
      user.isOnline = false;
      user.lastSeen = new Date();

      io.emit('user_left', { username: user.username, id: socket.id });
      
      // Remove user after delay
      setTimeout(() => {
        if (users.has(socket.id)) {
          users.delete(socket.id);
          io.emit('user_list', Array.from(users.values()));
          console.log(`🗑️ Removed user: ${user.username}. Total users: ${users.size}`);
        }
      }, 5000);
    }
  });

  // Error handling
  socket.on('error', (error) => {
    console.error(`💥 Socket error for ${socket.id}:`, error);
  });
});

// API routes for testing
app.get('/api/messages/:room?', (req, res) => {
  const room = req.params.room || 'general';
  res.json({
    room,
    messages: messages[room] || [],
    total: messages[room]?.length || 0
  });
});

app.get('/api/users', (req, res) => {
  res.json({
    users: Array.from(users.values()),
    total: users.size
  });
});

app.get('/api/rooms', (req, res) => {
  res.json(rooms);
});

app.get('/api/debug', (req, res) => {
  res.json({
    server: 'running',
    users: Array.from(users.values()).map(u => ({
      username: u.username,
      room: u.room,
      isOnline: u.isOnline,
      socketId: u.id
    })),
    messages: Object.keys(messages).reduce((acc, room) => {
      acc[room] = messages[room].length;
      return acc;
    }, {}),
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    users: users.size,
    userList: Array.from(users.values()).map(u => u.username)
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server initialized - FIXED VERSION`);
  console.log(`🌐 Client URL: http://localhost:5173`);
  console.log(`🔧 Debug endpoint: http://localhost:${PORT}/api/debug`);
  console.log(`❤️ Health check: http://localhost:${PORT}/health`);
});