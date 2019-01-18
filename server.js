const express = require("express");

const mongoose = require("mongoose");
const routes = require("./routes");
const app = express();
const PORT = process.env.PORT || 4000;
const axios = require('axios');

const socketio = require('socket.io');

// Define middleware here
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Serve up static assets (usually on heroku)
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}
// Add routes, both API and view
// app.use(routes);

// Connect to the Mongo DB
// mongoose.connect(
//   process.env.MONGODB_URI || "mongodb://localhost/gamedb"
// );

// Adding Classes
const Player = require('./classes/Player')

// Global Variables
let player = {};
let players = [];

// Start the API server
const expressServer = app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
const io = socketio(expressServer);

// Connection with socket server
io.on('connection', socket => {

  socket.emit('MSG From Server', {
    message: `Welcome to the socketio server! Your SocketID: ${socket.id}`,
    socketid: socket.id
  });

  socket.on('MSG To Server', dataFromClient => {
    console.log(dataFromClient.message);
  });

  // Logining In
  socket.on('LOGIN', playerName => {
    if (playerName.length === 0) {
      return socket.emit('LOGIN_ERROR', 'Name is required.')
    }

    socket.join('Room 1', () => {
      let rooms = Object.keys(socket.rooms);
      console.log(rooms); // [ <socket.id>, 'room 237' ]    
      io.to('Room 1').emit('ROOM_JOIN_SUCCESS', `${playerName} has joined the room`); // broadcast to everyone in the room
    });

    if (playerName === '/table') {
      console.log(playerName);
      socket.emit('LOGIN_SUCCESS', {
        table: true,
        playerName: playerName
      });
    }
    else {

      player = new Player(socket.id, playerName, [], 0);

      players.push(player);

      socket.emit('LOGIN_SUCCESS', player);

      console.log(players);

      io.to('Room 1').emit('Number of Players', {
        numberOfPlayers: players.length - 1,
        players: players
      }) // -1 to account for the table 
    }
  })

  // Game Logic
  // Deal BTN
  socket.on('Initial Hand', data => {
    console.log('Inital Hand: ' + data);
    console.log('Players Array: ' + players)

    players.map(player => {
      if (player.socketId === data.playerID) {
        socket.emit('Initial Hand 2', {
          hand: data.playerCards
        })
        console.log(player);

        player.hand = data.playerCards;

        io.to('Room 1').emit('Dealers Hand', {
          socketId: data.playerID,
          playerName: player.playerName,
          playerInGameHand: player.hand,
          score: player.score,
          dealerCards: data.dealerCards
        })
      }
    })
  })

  // Hit BTN
  socket.on('Hit Clicked', data => {
    console.log(data);

    players.map(player => {
      if (player.socketId === data.playerID) {
        socket.emit('Add Hit Card', {
          hand: data.playerCards,
          playerID: data.playerID
        })
        console.log(player);

        player.hand = data.playerCards;

        io.to('Room 1').emit('New Hit Hand', {
          socketId: data.playerID,
          playerName: player.playerName,
          playerInGameHand: player.hand,
          score: player.score
        })
      }
    })
  })

  // When player busts
  socket.on('Player has busted', data => {
    console.log('Player has busted!!!!!!')
    console.log(data);
    io.to('Room 1').emit('A player has bust', data)
  })

  // After STAY is clicked
  socket.on('Adding to dealer', data => {
    console.log('ADDING TO DEALER')
    console.log(data);
    io.to('Room 1').emit('Dealers New Hand', {
      dealerCards: data.dealerCards,
      status: data.status,
      playerID: data.playerID
    })
  })

  // Game over
  socket.on('GAME IS OVER', data => {
    io.to('Room 1').emit('GAME OVER', data)
  })

  socket.on('disconnect', function () {
    console.log('SocketID: ' + socket.id + ' disconnected');
  });

})





