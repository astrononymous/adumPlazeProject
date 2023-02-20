const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const PubSubHubbub = require('pubsubhubbub');
const Parser = require('rss-parser');
const parser = new Parser();
require('dotenv').config();

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

// Set up the channel ID's to subscribe to
const channelIds = ['UCq6VFHwMzcMXbuKyG7SQYIg'];

// Subscribe to the YouTube channel's RSS feed for each channel ID
channelIds.forEach((channelId) => {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    parser.parseURL(feedUrl, (err, feed) => {
        if (err) {
            console.error(`Error parsing feed ${feedUrl}: ${err}`);
            return;
        }
        console.log(`Feed ${feedUrl} is valid and can be subscribed to`);
        pubsub.subscribe('superfeedr', feedUrl, (err) => {
            if (err) {
                console.error(`Error subscribing to feed ${feedUrl}: ${err}`);
                return;
            }
            console.log(`Subscribed to feed: ${feedUrl}`);
        });
    });
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

app.on('error', (err) => {
    console.error('Server error:', err);
});

pubsub.on('error', (err) => {
    console.error('PubSubHubbub error:', err);
});
