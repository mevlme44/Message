require('dotenv').config({path: __dirname+'/.env'})
const PORT = process.env.PORT || 5000
const WebSocket = require('ws')
const express = require('express')
const clients = {}

const app = express()

app.use(express.json())

const start = () => {
    try {
        const wss = new WebSocket.WebSocketServer({port: PORT})
        wss.on('connection', onConnect)
        console.log('[WebSocket] Initialized')
        app.listen(5051, () => console.log(`[Express] Initialized`))
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
    switch (data.Header) {
        case 'auth':
            if (clients[data.Fingerprint])
                clients[data.Fingerprint].client = client
            else
                clients[data.Fingerprint] = {
                    messages: [],
                    client: client
                }
            break
        case 'message':
            if (!clients[data.Recipient]) {
                console.log('could not find recipient')
                data.Header = 'error'
                data.Message = 'User not found'
                client.send(JSON.stringify(data))
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
/// TODO: USE DATABASE FOR MESSAGE STORAGE
app.get('/getMyMessages/', async (req, res) => {
    if (clients[req.headers.authorization]){
        res.send(JSON.stringify(clients[req.headers.authorization].messages))
    }
    else {
        res.send('No messages')
    }
})
start()

