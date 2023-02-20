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
    if (!message) {
        return res.sendStatus(200);
    }
    const chatId = message.chat.id;
    const text = message.text;
    if (!text) {
        return res.sendStatus(200);
    }

    // Send a response to the Telegram server to acknowledge receipt of the message
    res.sendStatus(200);

    // If the bot sent the message, don't send a response
    if (message.from.username === process.env.TELEGRAM_BOT_USERNAME) {
        return;
    }

    // Send a message to the user who sent the message
    axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_API_TOKEN}/sendMessage`, {
        chat_id: chatId,
        text: 'Hi'
    });
});

// Start the web server
app.listen(port, () => {
    console.log(`Web server listening on port ${port}`);
});
