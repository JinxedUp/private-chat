const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const adjectives = [
  "Silent", "Crazy", "Blue", "Red", "Wild", "Dark", "Swift",
  "Ghostly", "Fierce", "Lucky", "Jolly", "Clever", "Brave", "Noble"
];
const nouns = [
  "Tiger", "Shadow", "Ninja", "Wolf", "Eagle", "Panther",
  "Samurai", "Raven", "Dragon", "Fox", "Lion", "Bear"
];

const users = new Map();

function generateNickname() {
  let nickname;
  let attempts = 0;
  do {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    nickname = `${adj}${noun}`;
    attempts++;
  } while ([...users.values()].includes(nickname) && attempts < 10);
  if ([...users.values()].includes(nickname)) {
    nickname += Math.floor(Math.random() * 1000);
  }
  return nickname;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  const nickname = generateNickname();
  users.set(socket.id, nickname);

  socket.emit('welcome', { nickname, userCount: users.size });

  socket.broadcast.emit('message', {
    user: 'System',
    text: `${nickname} has joined the chat.`,
    timestamp: new Date().toISOString()
  });

  io.emit('userCount', users.size); 

  socket.on('chatMessage', (msg) => {
    if (!msg || !msg.trim()) return;

    io.emit('message', {
      user: users.get(socket.id),
      text: msg.trim(),
      timestamp: new Date().toISOString()
    });
  });

  socket.on('typing', (isTyping) => {
    socket.broadcast.emit('typing', {
      user: users.get(socket.id),
      typing: isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const name = users.get(socket.id) || 'Anon';
    users.delete(socket.id);

    io.emit('message', {
      user: 'System',
      text: `${name} has left the chat.`,
      timestamp: new Date().toISOString()
    });
    io.emit('userCount', users.size);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
