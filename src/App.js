import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { io } from 'socket.io-client';
import CryptoJS from 'crypto-js';
import Picker from 'emoji-picker-react';

const SECRET_KEY = 'your-secret-key';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const socket = useRef();

  useEffect(() => {
    socket.current = io('http://localhost:3001');
    socket.current.on('chat message', (msg) => {
      const decrypted = CryptoJS.AES.decrypt(msg, SECRET_KEY);
      setMessages((prevMessages) => [...prevMessages, decrypted.toString(CryptoJS.enc.Utf8)]);
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input) {
      const encrypted = CryptoJS.AES.encrypt(input, SECRET_KEY);
      socket.current.emit('chat message', encrypted.toString());
      setInput('');
    }
  };

  const onEmojiClick = (event, emojiObject) => {
    setInput((prevInput) => prevInput + emojiObject.emoji);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prevShow) => !prevShow);
  };

  const likeMessage = (index) => {
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages];
      updatedMessages[index] += ' ❤️';
      return updatedMessages;
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Encrypted Messaging</h1>
      </header>
      <div className="messages">
        {messages.map((msg, index) => (
          <p key={index} onDoubleClick={() => likeMessage(index)}>
            {msg}
          </p>
        ))}
      </div>
      {showEmojiPicker && (
        <Picker onEmojiClick={onEmojiClick} />
      )}
      <form onSubmit={sendMessage} className="message-form">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={toggleEmojiPicker} type="button">
          Emoji
        </button>
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default App;
