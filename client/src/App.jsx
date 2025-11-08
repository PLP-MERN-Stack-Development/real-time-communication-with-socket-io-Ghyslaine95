import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './index.css';

const App = () => {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState(['general', 'random', 'tech']);
  const [currentRoom, setCurrentRoom] = useState('general');
  const messagesEndRef = useRef(null);

  console.log('=== APP STATE ===', {
    isConnected,
    username,
    isLoggedIn,
    messagesCount: messages.length,
    usersCount: users.length
  });

  useEffect(() => {
    console.log('🔌 Initializing socket connection to localhost:5000');
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ CONNECTED to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ DISCONNECTED from server');
      setIsConnected(false);
    });

    newSocket.on('receive_message', (message) => {
      console.log('📨 RECEIVED MESSAGE FROM SERVER:', message);
      
      // CORRECTION : Supprimer le message temporaire et ajouter le message réel
      setMessages(prev => {
        // Filtrer les messages temporaires avec le même contenu
        const filteredMessages = prev.filter(msg => 
          !(msg.temporary && msg.content === message.content && msg.username === message.username)
        );
        
        // Vérifier si le message existe déjà (éviter les doublons)
        const messageExists = filteredMessages.some(msg => 
          msg.id === message.id || (msg.content === message.content && msg.username === message.username && Math.abs(new Date(msg.timestamp) - new Date(message.timestamp)) < 1000)
        );
        
        if (messageExists) {
          console.log('🔄 Message already exists, skipping duplicate');
          return filteredMessages;
        }
        
        const newMessages = [...filteredMessages, message];
        console.log('📝 Messages array updated (replaced temporary):', newMessages);
        return newMessages;
      });
    });

    newSocket.on('user_list', (usersList) => {
      console.log('👥 USERS LIST:', usersList);
      setUsers(usersList);
    });

    newSocket.on('rooms_list', (roomsList) => {
      console.log('🏠 ROOMS LIST:', roomsList);
      setRooms(roomsList);
    });

    newSocket.on('message_history', (history) => {
      console.log('📚 MESSAGE HISTORY:', history);
      setMessages(history || []);
    });

    newSocket.on('user_joined', (user) => {
      console.log('👋 USER JOINED:', user);
      const systemMessage = {
        id: Date.now().toString(),
        system: true,
        username: 'System',
        content: `${user.username} joined the chat`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, systemMessage]);
    });

    newSocket.on('user_left', (user) => {
      console.log('👋 USER LEFT:', user);
      const systemMessage = {
        id: Date.now().toString(),
        system: true,
        username: 'System',
        content: `${user.username} left the chat`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, systemMessage]);
    });

    newSocket.on('error', (error) => {
      console.error('💥 SOCKET ERROR:', error);
    });

    return () => {
      console.log('🧹 Cleaning up socket');
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    console.log('📤 SEND MESSAGE attempt:', newMessage);
    
    if (newMessage.trim() && socket) {
      console.log('✅ Sending message to server...');
      
      // CORRECTION : Créer un ID unique pour le message temporaire
      const tempId = `temp-${Date.now()}`;
      const messageContent = newMessage.trim();
      
      // Ajouter le message localement immédiatement pour le feedback visuel
      const tempMessage = {
        id: tempId,
        username: username,
        content: messageContent,
        timestamp: new Date().toISOString(),
        room: currentRoom,
        temporary: true // Marquer comme temporaire
      };
      
      setMessages(prev => {
        const newMessages = [...prev, tempMessage];
        console.log('📝 Added temporary message with ID:', tempId);
        return newMessages;
      });
      
      // Envoyer le message au serveur
      socket.emit('send_message', {
        content: messageContent
      });
      
      setNewMessage('');
    } else {
      console.log('❌ Cannot send message - no socket or empty message');
    }
  };

  const joinRoom = (roomName) => {
    console.log('🔄 JOIN ROOM:', roomName);
    if (socket && roomName !== currentRoom) {
      socket.emit('join_room', roomName);
      setCurrentRoom(roomName);
      setMessages([]);
    }
  };

  // Écran de connexion
  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-form">
          <h1>Socket.io Chat</h1>
          <div className={`status-message ${isConnected ? 'status-connected' : 'status-disconnected'}`}>
            Server: {isConnected ? 'CONNECTED ✅' : 'DISCONNECTED ❌'}
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (username.trim().length >= 2) {
              console.log('🚀 Joining chat with username:', username);
              socket.emit('user_join', username.trim());
              setIsLoggedIn(true);
            }
          }}>
            <input
              type="text"
              placeholder="Enter your username (min 2 characters)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={2}
            />
            <button 
              type="submit" 
              disabled={!isConnected || username.trim().length < 2}
            >
              {isConnected ? 'Join Chat' : 'Connecting...'}
            </button>
          </form>
          
          {username.trim().length > 0 && username.trim().length < 2 && (
            <div style={{ 
              color: '#dc3545', 
              fontSize: '14px', 
              marginTop: '10px',
              textAlign: 'center'
            }}>
              Username must be at least 2 characters long
            </div>
          )}
          
          <div className="features-list">
            <h4>Features:</h4>
            <div className="feature-item">Real-time messaging</div>
            <div className="feature-item">Multiple chat rooms</div>
            <div className="feature-item">Online user list</div>
            <div className="feature-item">Typing indicators</div>
          </div>
        </div>
      </div>
    );
  }

  // Interface de chat
  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="online-users">
          <h3>Online Users ({users.length})</h3>
          {users.length > 0 ? (
            users.map(user => (
              <div key={user.id} className="user-item">
                <div className={`user-status ${user.isOnline ? 'online' : 'offline'}`}></div>
                <span>{user.username} {user.username === username && '(You)'}</span>
              </div>
            ))
          ) : (
            <div className="empty-messages">No users online</div>
          )}
        </div>

        <div className="rooms-list">
          <h3>Chat Rooms</h3>
          {rooms.map(room => (
            <div
              key={room}
              className={`room-item ${room === currentRoom ? 'active' : ''}`}
              onClick={() => joinRoom(room)}
            >
              # {room}
            </div>
          ))}
        </div>
        
        <div className="leave-chat">
          <button 
            className="leave-button"
            onClick={() => {
              setUsername('');
              setIsLoggedIn(false);
              setMessages([]);
              setUsers([]);
            }}
          >
            Leave Chat
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        <div className="chat-header">
          <h2># {currentRoom}</h2>
          <span className="connection-status">
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'} | {users.length} users
          </span>
        </div>

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-messages">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={`message ${
                  message.system ? 'system' : 
                  message.username === username ? 'own' : 'other'
                }`}
                style={{
                  border: message.temporary ? '2px dashed orange' : 'none',
                  opacity: message.temporary ? 0.7 : 1
                }}
              >
                {!message.system && (
                  <div className="message-header">
                    <strong>
                      {message.username} 
                      {message.temporary && ' (sending...)'}
                    </strong>
                    <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                  </div>
                )}
                <div className="message-content">{message.content}</div>
              </div>
            ))
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={sendMessage} className="input-area">
          <div className="input-container">
            <input
              type="text"
              className="message-input"
              placeholder={`Type a message in #${currentRoom}...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  sendMessage(e);
                }
              }}
            />
            <button 
              type="submit" 
              className="send-button"
              disabled={!newMessage.trim()}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;