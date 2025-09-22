const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files
app.use(express.static(path.join(__dirname)));

// Store active users and their rooms
const users = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New client connected');

    // Handle joining a room
    socket.on('join', ({ username, room }) => {
        socket.join(room);
        users.set(socket.id, { username, room });

        // Broadcast to room that a new user has joined
        io.to(room).emit('message', {
            username: 'System',
            message: `${username} has joined the room`
        });

        console.log(`${username} joined room ${room}`);
    });

    // Handle chat messages
    socket.on('chatMessage', ({ room, username, message }) => {
        io.to(room).emit('message', { username, message });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const user = users.get(socket.id);
        if (user) {
            io.to(user.room).emit('message', {
                username: 'System',
                message: `${user.username} has left the room`
            });
            users.delete(socket.id);
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});