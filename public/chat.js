const socket = io();

const chat = document.getElementById('chat');
const messageInput = document.getElementById('message');
const sendBtn = document.getElementById('send');
const userCountElem = document.getElementById('userCount');
const nicknameElem = document.getElementById('nickname');
const typingIndicator = document.getElementById('typingIndicator');

let myNickname = '';
let typingTimeout;

function stringToColor(str) {
  let hash = 0;
  for(let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for(let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).slice(-2);
  }
  return color;
}

function addMessage(user, text, isSystem = false) {
  const div = document.createElement('div');
  div.classList.add('message');
  if (isSystem) div.classList.add('system');

  const timestamp = new Date().toLocaleTimeString();

  if (isSystem) {
    div.textContent = `${text} [${timestamp}]`;
  } else {
    const userSpan = document.createElement('span');
    userSpan.textContent = user;
    userSpan.classList.add('user');
    userSpan.style.color = stringToColor(user);

    const timeSpan = document.createElement('span');
    timeSpan.textContent = ` ${timestamp}`;
    timeSpan.classList.add('timestamp');

    div.appendChild(userSpan);
    div.appendChild(document.createTextNode(': ' + text));
    div.appendChild(timeSpan);
  }

  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

socket.on('welcome', (data) => {
  myNickname = data.nickname;
  nicknameElem.textContent = myNickname;
  userCountElem.textContent = `Users online: ${data.userCount}`;
  addMessage('System', `You joined as ${myNickname}`, true);
});

socket.on('message', (data) => {
  addMessage(data.user, data.text, data.user === 'System');
});

socket.on('userCount', (count) => {
  userCountElem.textContent = `Users online: ${count}`;
});

let typingUsers = new Set();

socket.on('typing', ({ user, typing }) => {
  if (typing) {
    typingUsers.add(user);
  } else {
    typingUsers.delete(user);
  }
  updateTypingIndicator();
});

function updateTypingIndicator() {
  if (typingUsers.size === 0) {
    typingIndicator.textContent = '';
  } else if (typingUsers.size === 1) {
    typingIndicator.textContent = `${[...typingUsers][0]} is typing...`;
  } else {
    typingIndicator.textContent = 'Several people are typing...';
  }
}

function sendMessage() {
  const msg = messageInput.value.trim();
  if (msg === '') return;
  socket.emit('chatMessage', msg);
  messageInput.value = '';
  socket.emit('typing', false);
}

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendMessage();
  } else {
    socket.emit('typing', true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => socket.emit('typing', false), 1000);
  }
});
