const http = require('http');
const express = require('express');
const cors = require('cors');
const colyseus = require('colyseus');
const monitor = require('@colyseus/monitor').monitor;
const WebSocketTransport = require('@colyseus/ws-transport').WebSocketTransport;
// const socialRoutes = require("@colyseus/social/express").default;

const UnoRoom = require('./rooms/UnoRoom').UnoRoom;

const port = process.env.PORT || 2567;
const app = express();

app.use(cors());
app.use(express.json());

const gameServer = new colyseus.Server({
  transport: new WebSocketTransport({
    server: http.createServer(app),
    pingInterval: 5000,
    pingMaxRetries: 3,
  }),
});

// register your room handlers
gameServer.define('uno', UnoRoom);

/**
 * Register @colyseus/social routes
 *
 * - uncomment if you want to use default authentication (https://docs.colyseus.io/server/authentication/)
 * - also uncomment the require statement
 */
// app.use("/", socialRoutes);

// register colyseus monitor AFTER registering your room handlers
app.use('/colyseus', monitor());

gameServer.listen(port);
console.log(`Listening on ws://host.docker.internal:${port}`);
