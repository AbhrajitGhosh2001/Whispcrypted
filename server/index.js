const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const CryptoJS = require('crypto-js');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '',
  },
});

const SECRET_KEY = 'your-secret-key';

io.on('connection', (socket) => {
  console.log('a user connected');

  // Send stored messages to the client on connection
  db.all('SELECT content FROM messages', [], (err, rows) => {
    if (err) {
      console.error(err);
    }
    rows.forEach((row) => {
      const decrypted = CryptoJS.AES.decrypt(row.content, SECRET_KEY);
      socket.emit('chat message', decrypted.toString(CryptoJS.enc.Utf8));
    });
  });

  // Handle new messages
  socket.on('chat message', (msg) => {
    const encrypted = CryptoJS.AES.encrypt(msg, SECRET_KEY);

    // Save the message to the database
    db.run('INSERT INTO messages (content) VALUES (?)', [encrypted.toString()], (err) => {
      if (err) {
        console.error(err);
      }
    });

    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

app.use(cors());

server.listen(3001, () => {
  console.log('listening on:3001');
});