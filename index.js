const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

console.log("hey we started the program");

const app = express();

// Configure the port that the web server will listen on
const port = process.env.PORT || 3000;

// Parse incoming webhook request bodies
app.use(bodyParser.json());

// Define a route to handle incoming Telegram webhook requests
app.post('/telegram-webhook', (req, res) => {
    const message = req.body.message;
    const chatId = message.chat.id;
    const text = 'Hello, world!';

    // Send a response to the Telegram server to acknowledge receipt of the message
    res.sendStatus(200);

    // Send a message to the user who sent the message
    axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_API_TOKEN}/sendMessage`, {
        chat_id: chatId,
        text: text
    });
});

// Start the web server
app.listen(port, () => {
    console.log(`Web server listening on port ${port}`);
});
