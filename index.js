require('dotenv').config({path: __dirname+'/.env'})
const PORT = process.env.PORT || 5000
const WebSocket = require('ws')
const {json} = require("express");
const clients = {}


const start = () => {
    try {
        const wss = new WebSocket.WebSocketServer({port: PORT})
        wss.on('connection', onConnect)
        console.log('Initialized')
    } catch (e) {
        console.log(e)
    }
}

function onConnect(wsClient) {
    console.log(`${wsClient} connected`)
    wsClient.on('message', (msg) => onMessage(msg, wsClient))
    wsClient.on('close', () => {
        console.log(`${wsClient} disconnected`)
    })
}

function onMessage(message, client) {
    const data = JSON.parse(message)
    console.log(data)
    switch (data.Header) {
        case 'auth':
            if (clients[data.Fingerprint])
                client[data.Fingerprint].client = client
            else
                clients[data.Fingerprint] = {
                    messages: [],
                    client: client
                }
            break
        case 'message':
            if (!clients[data.Recipient]) {
                console.log('could not find recipient')
            }
            else {
                clients[data.Recipient].messages.push({
                    data: data.Message,
                    sender: data.Sender
                })
                clients[data.Recipient].client.send(JSON.stringify(data))
            }
            break
    }
}
start()

