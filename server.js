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


// VARIABLES!!!!!
const cards = require('./cards.json')
let ready = 0;
let deck = [];
let dealerCards = [];
let dealerTotal = 0;
let dealerTotalAlt = 0;
let tableID = '';
let status = '';
let stay = 0;
let round = 1;

// FUNCTIONS!!!!!!
function shuffle(a) {
  let k,
    t,
    // eslint-disable-next-line
    //j,
    i = a.length,
    rand = Math.random;

  // For each element in the array, swap it with a random
  // element (which might be itself)
  while (i--) {
    k = (rand() * (i + 1)) | 0;
    t = a[k];
    a[k] = a[i];
    a[i] = t;
  }
  return a;
}

// Function to shuffle deck
checkDeck = deck => {
  return deck.length < 10 ? deck.concat(shuffle(cards)) : deck;
};

// Function to draw cards
drawCards = (deck, playerCards, numberOfCards) => {
  var i;
  for (i = 1; i <= numberOfCards; i++) {
    let card = deck.pop();
    console.log('this is added')
    console.log(card.value)
    playerCards.push(card);
  }
  return playerCards;
};

// Calculates the values
calcCardTotal = (cards, eleven) => {
  let sum = Object.keys(cards).reduce(function (total, card) {
    let cardVal = Number(cards[card].cardValue);
    cardVal = cardVal === 1 && eleven ? 11 : cardVal;
    return Number(total) + cardVal;
  }, 0);
  return sum;
};

// Check if player bust
checkForBust = (t1, t2) => {
  console.log(t1)
  console.log(t2)

  let min = Math.min(t1, t2);

  console.log(min)

  if (min > 21) {
    status = "Over 21 - You Lose!!!";
  }

};

checkDealerStatus = (dealerCards, playerTotal) => {
  let t1,
    t2,
    status = "";

  t1 = this.calcCardTotal(dealerCards, false);
  t2 = this.calcCardTotal(dealerCards, true);

  if (Math.min(t1, t2) > 21) {
    status = "You Win!!!";
  } else if (
    (t1 <= 21 && t1 === playerTotal) ||
    (t2 <= 21 && t2 === playerTotal)
  ) {
    status = "Tie";
  } else if (
    (t1 <= 21 && t1 > playerTotal) ||
    (t2 <= 21 && t2 > playerTotal)
  ) {
    status = "Dealer wins!!!";
  }

  return status;
};





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
  socket.on('LOGIN', data => {

    if (data.playerName.length === 0) {
      return socket.emit('LOGIN_ERROR', 'Name is required.')
    }

    socket.join('Room 1', () => {
      let rooms = Object.keys(socket.rooms);
      console.log(rooms); // [ <socket.id>, 'room 237' ]    
      io.to('Room 1').emit('ROOM_JOIN_SUCCESS', `${data.playerName} has joined the room`); // broadcast to everyone in the room
    });

    if (data.playerName === '/table') {
      console.log(data.playerName);
      tableID = data.playerID;
      socket.emit('LOGIN_SUCCESS', {
        table: true,
        playerName: data.playerName
      });
    }
    else {

      player = new Player(socket.id, data.playerName, players.length);

      players.push(player);

      socket.emit('LOGIN_SUCCESS', player);

      console.log(players);

      io.to('Room 1').emit('Number of Players', {
        numberOfPlayers: players.length,
        players: players
      })
    }
  })





  // ----------------------- GAME LOGIC -------------------------//
  // Player is ready
  socket.on('Player is ready', data => {
    console.log('OGready: ' + ready)
    console.log(typeof ready)
    console.log('bet: ' + data.bet)
    ready += data.ready;
    console.log('NEWready: ' + ready)
    console.log('players#: ' + players.length)

    console.log(typeof data.ready)
    console.log(typeof players.length)

    for (var i = 0; i < players.length; i++) {
      if (players[i].socketId === data.playerID) {
        players[i].bet = data.bet
      }
    }

    if (ready === players.length) {
      console.log("SHOOULD BE WORKING")

      deck = checkDeck(deck);

      // Deal Cards to players
      for (var i = 0; i < players.length; i++) {
        drawCards(deck, players[i].hand, 2)
      }

      // Deal Cards to dealer
      drawCards(deck, dealerCards, 2)

      // Tells everyone in room
      io.emit('Players are ready', {
        playersInGame: players,
        dealerCards: dealerCards
      })

      // Tells the table only
      io.to(tableID).emit('Table Cards', {
        playersInGame: players,
        dealerCards: dealerCards
      })

    }

  })

  // Calculating Cards for each socket
  socket.on('Calc', data => { // both Aces doesnt work
    dealerTotal = calcCardTotal(dealerCards, false);
    dealerTotalAlt = calcCardTotal(dealerCards, true);
    let newPlayerTotal = calcCardTotal(data.playerCards, false);
    let newPlayerTotalAlt = calcCardTotal(data.playerCards, true);

    for (var i = 0; i < players.length; i++) {
      if (players[i].socketId === data.playerID) {
        players[i].playerTotal = newPlayerTotal;
        players[i].playerTotalAlt = newPlayerTotalAlt;
      }
    }

    // Tells everyone in room
    socket.emit('Player Calc', {
      playerID: data.playerID,
      dealerTotal: dealerTotal,
      dealerTotalAlt: dealerTotalAlt,
      playerTotal: newPlayerTotal,
      playerTotalAlt: newPlayerTotalAlt,
      playersInGame: players
    })

    // Tells the table only
    io.to(tableID).emit('Table Calc', {
      dealerTotal: dealerTotal,
      dealerTotalAlt: dealerTotalAlt,
      playersInGame: players
    })
  })

  // When a player hits
  socket.on('Player clicked hit', data => {
    console.log('Player has hit')

    for (var i = 0; i < players.length; i++) {
      if (players[i].socketId === data) {
        drawCards(deck, players[i].hand, 1);
      }
    }

    // Tells everyone in room
    socket.emit('Player has hit', {
      playerID: data,
      playersInGame: players
    })

    // Tells the table only
    io.to(tableID).emit('Table player hits', {
      playersInGame: players
    })
  })

  // Check if player bust
  socket.on('Check for bust', data => {
    console.log('LOKKK AY MEEEEE')
    console.log(players)
    for (var i = 0; i < players.length; i++) {
      if (players[i].socketId === data) {
        checkForBust(players[i].playerTotal, players[i].playerTotalAlt);
        players[i].gameMsg = status;
      }
    }

    // Tells everyone in room
    socket.emit('Check player for busting', {
      playerID: data,
      playersInGame: players,
      status: status
    })

    // Tells the table only
    io.to(tableID).emit('Check table for busting', {
      playersInGame: players
    })
  })

  // Check bust after stay
  socket.on('Player clicked Stay', data => {
    console.log('Stay was clicked')

    stay += data.stay

    let playersLeft = 0;

    for (var i = 0; i < players.length; i++) {
      if (players[i].gameMsg === '') {
        playersLeft += 1
      }
    }

    console.log('Stay: ' + stay)
    console.log('Players Left: ' + playersLeft)

    if (stay === playersLeft) {
      let newDealerTotal = Math.max(dealerTotal, dealerTotalAlt);
      while (newDealerTotal < 17) {
        drawCards(deck, dealerCards, 1);
        dealerTotal = calcCardTotal(dealerCards, false);
        dealerTotalAlt = calcCardTotal(dealerCards, true);

        newDealerTotal = Math.max(dealerTotal, dealerTotalAlt);

        if (dealerTotalAlt > 21) {
          newDealerTotal = Math.min(dealerTotal, dealerTotalAlt);
        }
        console.log(newDealerTotal) // both Aces doesnt work
      }

      for (var i = 0; i < players.length; i++) {

        let newPlayerTotal = Math.max(players[i].playerTotal, players[i].playerTotalAlt)

        // if(players[i].playerTotal && players[i].playerTotalAlt < 21){

        // }

        if (players[i].playerTotalAlt > 21) {
          newPlayerTotal = Math.min(players[i].playerTotal, players[i].playerTotalAlt)
        }

        if (Math.min(dealerTotal, dealerTotalAlt) > 21 && newPlayerTotal <= 21) {
          players[i].gameMsg = 'You Win!!!';
        } else if (
          (dealerTotal <= 21 && dealerTotal === newPlayerTotal) ||
          (dealerTotalAlt <= 21 && dealerTotalAlt === newPlayerTotal)
        ) {
          players[i].gameMsg = 'Tie';
        } else if (
          (dealerTotal <= 21 && dealerTotal > newPlayerTotal) ||
          (dealerTotalAlt <= 21 && dealerTotalAlt > newPlayerTotal)
        ) {
          players[i].gameMsg = 'Dealer wins!!!';
        } else if (
          (dealerTotal <= 21 && dealerTotal < newPlayerTotal) &&
          (dealerTotalAlt <= 21 && dealerTotalAlt < newPlayerTotal) && (newPlayerTotal < 21)
        ) {
          players[i].gameMsg = 'You Win!!!';
        }

      }

      console.log('PLAYERSSSSSSS UPDATINGGGG')
      console.log(players)

      // Tells everyone in room
      io.emit('Check bust when player stays', {
        playersInGame: players
      })

      console.log('Dealer SHit')
      console.log(dealerCards);
      console.log(dealerTotal);
      console.log(dealerTotalAlt);

      console.log('platersssss')
      console.log(players)

      // Tells the table only
      io.to(tableID).emit('Check table bust when player stays', {
        dealerCards: dealerCards,
        dealerTotal: dealerTotal,
        dealerTotalAlt: dealerTotalAlt,
        playersInGame: players
      })

    }

    // // When all players stay
    // if (stay === players.length) {

    //   let newDealerTotal = Math.max(dealerTotal, dealerTotalAlt);

    //   for (var i = 0; i < players.length; i++) {

    //     let newPlayerTotal = Math.max(players[i].playerTotal, players[i].playerTotalAlt)

    //     while (newDealerTotal < 17) {
    //       drawCards(deck, dealerCards, 1);
    //       dealerTotal = calcCardTotal(dealerCards, false);
    //       dealerTotalAlt = calcCardTotal(dealerCards, true);

    //       if (Math.min(dealerTotal, dealerTotalAlt) > 21) {
    //         players[i].gameMsg = 'You Win!!!';
    //       } else if (
    //         (dealerTotal <= 21 && dealerTotal === newPlayerTotal) ||
    //         (dealerTotalAlt <= 21 && dealerTotalAlt === newPlayerTotal)
    //       ) {
    //         players[i].gameMsg = "Tie";
    //       } else if (
    //         (dealerTotal <= 21 && dealerTotal > newPlayerTotal) ||
    //         (dealerTotalAlt <= 21 && dealerTotalAlt > newPlayerTotal)
    //       ) {
    //         players[i].gameMsg = "Dealer wins!!!";
    //       }

    //       newDealerTotal = Math.max(dealerTotal, dealerTotalAlt);
    //       console.log(newDealerTotal) // both Aces doesnt work


    //     }
    //   }
    //   console.log('PLAYERSSSSSSS UPDATINGGGG')
    //   console.log(players)

    //   // Tells everyone in room
    //   socket.emit('Check bust when player stays', {
    //     playersInGame: players
    //   })

    //   // Tells the table only
    //   io.to(tableID).emit('Check table bust when player stays', {
    //     playersInGame: players
    //   })

    // }

    // let status = '';

    // if (stay === players.length) {

    //   let maxArry = []

    //   for (var i = 0; i < players.length; i++) {

    //     let maxPlayerTotal = Math.max(players[i].playerTotal, players[i].playerTotalAlt);

    //     if( maxPlayerTotal > 21) {
    //       maxPlayerTotal =  Math.min(players[i].playerTotal, players[i].playerTotalAlt);
    //     }

    //     maxArry.push(maxPlayerTotal)
    //   }

    //   console.log(maxArry);

    //   let finalMax = Math.max(maxArry);

    //   status = checkDealerStatus(dealerCards, finalMax);

    //   console.log(status);

    //   if (status === "") {
    //     do {
    //       drawCards(deck, dealerCards, 1);
    //       status = checkDealerStatus(dealerCards, finalMax);

    //     } while (status === "");
    //   }

    //   //add statment that for everyone
    // }


  })


  // Reset Game (Coded for one player and if u win)
  socket.on('Reset Game', data => {

    round += data.round;



    ready = 0;
    deck = [];
    dealerCards = [];
    dealerTotal = 0;
    dealerTotalAlt = 0;
    stay = 0;

    for (var i = 0; i < players.length; i++) {
      players[i].gameMsg = '';
      players[i].bet = 0;
      players[i].chips = data.playersInGame.chips;
      players[i].playerTotal = 0;
      players[i].playerTotalAlt = 0;
      players[i].hand = [];
    }

    console.log('data reset');
    console.log(players);

    if (round < 5) {
      io.emit('Next Round', players)

      io.to(tableID).emit('Next Round Table', players)
    }
    else {

      for (var i = 0; i < players.length; i++) {
        players[i].gameMsg = 'GAME OVER';
        players[i].bet = 0;
        players[i].chips = data.playersInGame.chips
      }

      socket.emit('GAME OVER', players)
    }




  })

  // // Confirm and display hit
  // socket.on('Confirm Hit', data => {
  //   io.to('Room 1').emit('Confirm Hit 2', data)
  // })

  // // Show Calc for player
  // socket.on('Show Calc', data => {
  //   io.to('Room 1').emit('Display Calc', data)
  // })


  // // Deal BTN
  // socket.on('Initial Hand', data => {
  //   console.log('Inital Hand: ' + data);
  //   console.log('Players Array: ' + players)

  //   players.map(player => {
  //     if (player.socketId === data.playerID) {
  //       socket.emit('Initial Hand 2', {
  //         hand: data.playerCards
  //       })
  //       console.log(player);

  //       player.hand = data.playerCards;

  //       io.to('Room 1').emit('Dealers Hand', {
  //         socketId: data.playerID,
  //         playerName: player.playerName,
  //         playerInGameHand: player.hand,
  //         score: player.score,
  //         dealerCards: data.dealerCards
  //       })
  //     }
  //   })
  // })

  // // Hit BTN
  // socket.on('Hit Clicked', data => {
  //   console.log(data);

  //   players.map(player => {
  //     if (player.socketId === data.playerID) {
  //       socket.emit('Add Hit Card', {
  //         hand: data.playerCards,
  //         playerID: data.playerID
  //       })
  //       console.log(player);

  //       player.hand = data.playerCards;

  //       io.to('Room 1').emit('New Hit Hand', {
  //         socketId: data.playerID,
  //         playerName: player.playerName,
  //         playerInGameHand: player.hand,
  //         score: player.score
  //       })
  //     }
  //   })
  // })

  // // When player busts
  // socket.on('Player has busted', data => {
  //   console.log('Player has busted!!!!!!')
  //   console.log(data);
  //   io.to('Room 1').emit('A player has bust', data)
  // })

  // // After STAY is clicked
  // socket.on('Adding to dealer', data => {
  //   console.log('ADDING TO DEALER')
  //   console.log(data);
  //   io.to('Room 1').emit('Dealers New Hand', {
  //     dealerCards: data.dealerCards,
  //     status: data.status,
  //     playerID: data.playerID
  //   })
  // })

  // // Game over
  // socket.on('GAME IS OVER', data => {
  //   io.to('Room 1').emit('GAME OVER', data)
  // })

  socket.on('disconnect', function () {
    console.log('SocketID: ' + socket.id + ' disconnected');
  });

})





