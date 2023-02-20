const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const PubSubHubbub = require('pubsubhubbub');
require('dotenv').config();

console.log("Hey, we started the program");

const app = express();

// Configure the port that the web server will listen on
const port = process.env.PORT || 3000;

// Parse incoming webhook request bodies
app.use(bodyParser.json());

// Define a route to handle incoming Telegram webhook requests
app.post('/telegram-webhook', (req, res) => {
    console.log('Received webhook request from Telegram:', req.body);
    const message = req.body.message;
    if (!message) {
        console.error('Received invalid webhook request from Telegram:', req.body);
        res.sendStatus(400);
        return;
    }
    const chatId = message.chat.id;
    const text = 'Hello, world!';

    // Send a response to the Telegram server to acknowledge receipt of the message
    res.sendStatus(200);

    // Send a message to the user who sent the message
    axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_API_TOKEN}/sendMessage`, {
        chat_id: chatId,
        text: text
    }).then(() => {
        console.log('Sent message to Telegram');
    }).catch((error) => {
        console.error('Error sending message to Telegram:', error);
    });
});

// Start the web server
app.listen(port, () => {
    console.log(`Web server listening on port ${port}`);
});

// Set up the PubSubHubbub hub server
const pubsub = PubSubHubbub.createServer({
    callbackUrl: `https://${process.env.RAILWAY_APP_NAME}.railway.app/youtube-webhook`
});
pubsub.listen(process.env.HUB_PORT, () => {
    console.log(`PubSubHubbub hub server listening on port ${process.env.HUB_PORT}`);
});

// Subscribe to the YouTube channel's RSS feed
const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UChlgI3UHCOnwUGzWzbJ3H5w';
pubsub.subscribe('superfeedr', feedUrl, (err) => {
    if (err) {
        console.error(`Error subscribing to feed: ${err}`);
        return;
    }
    console.log(`Subscribed to feed: ${feedUrl}`);
});

// Handle feed updates
pubsub.on('feed', (data) => {
    try {
        console.log(`Received feed update: ${data}`);
        const update = data.updates[0];
        if (!update) {
            console.error('Received invalid feed update:', data);
            return;
        }
        const videoUrl = update.link;
        const videoTitle = update.title;

        // Post the video to the Telegram channel
        axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_API_TOKEN}/sendMessage`, {
            chat_id: process.env.TELEGRAM_CHANNEL_ID,
            text: `New video: ${videoTitle}\n${videoUrl}`
        }).then(() => {
            console.log('Sent video update to Telegram');
        }).catch((error) => {
            console.error('Error sending video update to Telegram:', error);
        });
    } catch (error) {
        console.error('Error handling feed update:', error);
    }
});
