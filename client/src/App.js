import React, { Component } from 'react';
import io from 'socket.io-client';
import NameForm from './components/NameForm';
// import { set } from 'mongoose';
import shuffle from "./components/shuffle";
import cards from "./cards.json";
import "./App.css";
import Table from './components/table';
import PlayerScreen from './components/playerScreen';

class App extends Component {

  state = {
    playerID: "",
    playerName: "",
    displayPlayerName: "",
    numberOfPlayers: 0,
    score: 0,
    deck: [],
    dealerTotal: 0,
    dealerTotalAlt: 0,
    dealerCards: [],
    playerTotal: 0,
    playerTotalAlt: 0,
    playerCards: [],
    bet: 0,
    chips: 100,
    isPlaying: false,
    gameMsg: null,
    tableStatus: false,
    playersInGame: [],
    rounds: 0
  }

  componentDidMount() {
    // The initial connection to the other server
    this.socket = io('http://localhost:3000');
    this.checkConnection();

    // Show number of players in Room 1
    this.socket.on('Number of Players', data => {
      console.log(data);
      this.setState({
        numberOfPlayers: data.numberOfPlayers,
        playersInGame: data.players
      }, () => {
        console.log(this.state.playersInGame);

      })
    })

    // Initial Start of the game
    this.socket.on('Dealers Hand', data => {
      console.log(data);

      let newPlayerInGameData = {
        socketId: data.socketId,
        playerName: data.playerName,
        hand: data.playerInGameHand,
        score: data.score,
        playerTotal: 0,
        playerTotalAlt: 0,
        gameMsg: ""
      }

      console.log(this.state.playersInGame)
      console.log("newPlayerInGameData")
      console.log(newPlayerInGameData)

      let newPlayersInGame = this.state.playersInGame

      for (var i = 0; i < newPlayersInGame.length; i++) {
        if (newPlayersInGame[i].socketId === newPlayerInGameData.socketId) {
          newPlayersInGame[i] = newPlayerInGameData;
          newPlayersInGame[i].playerTotal = this.calcCardTotal(this.state.playersInGame[i].hand, false)
          newPlayersInGame[i].playerTotalAlt = this.calcCardTotal(this.state.playersInGame[i].hand, true)
        }
      }

      console.log(newPlayersInGame);

      this.setState({
        dealerCards: data.dealerCards,
        playersInGame: newPlayersInGame
      }, () => {
        this.calcCards();
      })
    })

    // For when a player Hits
    this.socket.on('New Hit Hand', data => {
      console.log(data);

      let newPlayerInGameData = {
        socketId: data.socketId,
        playerName: data.playerName,
        hand: data.playerInGameHand,
        score: data.score,
        playerTotal: 0,
        playerTotalAlt: 0,
        gameMsg: ""
      }

      console.log(this.state.playersInGame)
      console.log("newPlayerInGameData")
      console.log(newPlayerInGameData)

      let newPlayersInGame = this.state.playersInGame

      for (var i = 0; i < newPlayersInGame.length; i++) {
        if (newPlayersInGame[i].socketId === newPlayerInGameData.socketId) {
          newPlayersInGame[i] = newPlayerInGameData;
          newPlayersInGame[i].playerTotal = this.calcCardTotal(this.state.playersInGame[i].hand, false)
          newPlayersInGame[i].playerTotalAlt = this.calcCardTotal(this.state.playersInGame[i].hand, true)
        }
      }

      console.log(newPlayersInGame);

      this.setState({
        playersInGame: newPlayersInGame
      }, () => {
        this.calcCards();
      })
    })

    // When an player busts
    this.socket.on('A player has bust', data => {
      console.log(data.playerID)
      console.log(data.status)
      let newPlayersInGame = this.state.playersInGame

      for (var i = 0; i < newPlayersInGame.length; i++) {
        if (newPlayersInGame[i].socketId === data.playerID) {
          newPlayersInGame[i].gameMsg = data.status;
        }
      }

      this.setState({ playersInGame: newPlayersInGame });
    })

    // When stay is clicked and deal trys to win
    this.socket.on('Dealers New Hand', data => {
      let newPlayersInGame = this.state.playersInGame

      for (var i = 0; i < newPlayersInGame.length; i++) {
        if (newPlayersInGame[i].socketId === data.playerID) {
          newPlayersInGame[i].gameMsg = data.status;
        }
      }
      this.setState({
        dealerCards: data.dealerCards,
        playersInGame: newPlayersInGame
      }, () => { this.calcCards() })

    })

    // GAME OVER
    this.socket.on('GAME OVER', data => {
      let newPlayersInGame = this.state.playersInGame

      for (var i = 0; i < newPlayersInGame.length; i++) {
        if (newPlayersInGame[i].socketId === data.playerID) {
          newPlayersInGame[i].gameMsg = data.status;
        }
      }
      this.setState({playersInGame: newPlayersInGame})
    })

  }

  // A function to check server connection
  checkConnection() {
    this.socket.on('MSG From Server', dataFromServer => {
      console.log(dataFromServer.message);

      this.socket.emit('MSG To Server', {
        message: `SocketID: ${dataFromServer.socketid} has connected to server!`,
        socketid: dataFromServer.socketid
      });

      this.setState({ playerID: this.socket.id })

    });
  }

  // Changes state of the search
  handleInputChange = event => {
    const value = event.target.value;
    const name = event.target.name;
    this.setState({
      [name]: value
    });
  };

  // Join BTN
  joinBTN = event => {
    event.preventDefault();
    console.log('join clicked')
    console.log(this.state.playerName);

    // Initializes the login for server
    this.socket.emit('LOGIN', this.state.playerName);

    // An alret message will appear when text area is empty
    this.socket.on('LOGIN_ERROR', error => {
      alert(error);
    })

    // Renders the state when login is successful
    this.socket.on('LOGIN_SUCCESS', player => {

      if (player.playerName === '/table') {
        this.setState({
          tableStatus: true,
        })
      }
      else {
        this.setState({
          displayPlayerName: player.playerName,
          score: player.score
        })
      }
    })

    // Shows message when join is successful
    this.socket.on('ROOM_JOIN_SUCCESS', msg => {
      console.log(msg);
    })

    // Lets everyone in Room 1 see number of players
    this.socket.on('Number of Players', data => {
      console.log(data);
      this.setState({
        numberOfPlayers: data.numberOfPlayers,
        playersInGame: data.players
      }, () => {
        console.log(this.state.playersInGame);

      })
    })

  }






  // Black Jack Game Function
  checkDeck = deck => {
    return this.state.deck.length < 10 ? deck.concat(shuffle(cards)) : deck;
  };

  calcCards = () => {
    this.setState({
      dealerTotal: this.calcCardTotal(this.state.dealerCards, false),
      dealerTotalAlt: this.calcCardTotal(this.state.dealerCards, true),
      playerTotal: this.calcCardTotal(this.state.playerCards, false),
      playerTotalAlt: this.calcCardTotal(this.state.playerCards, true)
    });
  };

  calcCardTotal = (cards, eleven) => {
    let sum = Object.keys(cards).reduce(function (total, card) {
      let cardVal = Number(cards[card].cardValue);
      cardVal = cardVal === 1 && eleven ? 11 : cardVal;
      return Number(total) + cardVal;
    }, 0);
    return sum;
  };

  drawCards = (deck, playerCards, numberOfCards) => {
    var i;
    for (i = 1; i <= numberOfCards; i++) {
      let card = deck.pop();
      playerCards.push(card);
    }
    return playerCards;
  };

  //check if player bust
  checkForBust = (playerID) => {
    let t1,
      t2,
      min,
      status = "";

    t1 = this.state.playerTotal;
    t2 = this.state.playerTotalAlt;

    console.log(t1)
    console.log(t2)

    min = Math.min(t1, t2);

    console.log(min)

    if (min > 21) {
      status = "Over 21 - You Lose!!!!";

      // Message for the table
      this.socket.emit('Player has busted', {
        playerID: playerID,
        value: min,
        status: status
      })

    }

    this.setState({
      gameMsg: status
    }, () => { console.log(this.state.gameMsg) });
  };

  makeBet = betVal => {
    this.setState(prevState => ({
      bet: prevState.bet + betVal,
      chips: prevState.chips - betVal
    }));
  };

  clearBet = () => {
    this.setState(prevState => ({
      bet: 0,
      chips: prevState.chips + prevState.bet
    }));
  };

  // Deal Cards
  dealClicked = () => {
    console.log("Deal was Clicked")
    let deck = this.checkDeck(this.state.deck);
    let dealerCards = this.state.dealerCards;
    let playerCards = this.state.playerCards;

    if (this.state.bet === 0) return;

    this.drawCards(deck, dealerCards, 2);
    this.drawCards(deck, playerCards, 2);

    this.socket.emit('Initial Hand', {
      playerID: this.socket.id,
      playerCards: playerCards,
      dealerCards: dealerCards
    })

    this.socket.on('Initial Hand 2', data => {
      console.log("Initial Hand 2: " + data);

      this.setState({
        deck: deck,
        playerCards: data.hand,
        isPlaying: true
      }, () => {
        this.calcCards()
      })
    })

  };

  hitClicked = () => {
    let deck = this.checkDeck(this.state.deck);
    let playerCards = this.state.playerCards;
    this.drawCards(deck, playerCards, 1);

    this.socket.emit('Hit Clicked', {
      playerID: this.socket.id,
      playerCards: playerCards
    })

    this.socket.on('Add Hit Card', data => {

      this.setState(
        prevState => ({
          playerCards: data.hand,
          deck: deck
        }),
        this.calcCards(),
        this.checkForBust(data.playerID),
        this.roundsCheck(this.socket.id)
      );
    })
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

  stayClicked = (playerID) => {
    //Draw dealer cards until value equals or is higher then user.
    let playerTotal = Math.max(
      this.state.playerTotal,
      this.state.playerTotalAlt
    );
    if (playerTotal > 21)
      playerTotal = Math.min(this.state.playerTotal, this.state.playerTotalAlt);
    let deck = this.checkDeck(this.state.deck);
    let dealerCards = this.state.dealerCards;
    let status = this.checkDealerStatus(dealerCards, playerTotal);

    if (status === "") {
      do {
        this.drawCards(deck, dealerCards, 1);
        status = this.checkDealerStatus(dealerCards, playerTotal);

        this.socket.emit('Adding to dealer', {
          dealerCards: dealerCards,
          status: status,
          playerID: playerID
        })

      } while (status === "");
    }

    this.setState(
      prevState => ({
        deck: deck,
        dealerCards: dealerCards,
        gameMsg: status
      }),
      this.calcCards(),
      this.roundsCheck(playerID)
    );
  };

  resetGame = () => {
    let chips = this.state.chips;
    let bet = this.state.bet;
    // debugger;
    //Calculate chips
    if (this.state.gameMsg === "Tie") {
      chips = chips + bet;
    } else if (this.state.gameMsg === "You Win!!!") {
      chips = chips + bet * 2;
    }

    this.setState({
      deck: [],
      dealerTotal: 0,
      dealerTotalAlt: 0,
      dealerCards: [],
      playerTotal: 0,
      playerTotalAlt: 0,
      playerCards: [],
      isPlaying: false,
      bet: 0,
      chips: chips,
      gameMsg: null,
      rounds: this.state.rounds + 1
    },()=> {
      this.roundsCheck(this.socket.id)
    });
  };

  // Checks if game is over
  roundsCheck(playerID) {
    console.log('Round Check')
    if (this.state.rounds > 5) {

      console.log('GAME OVER!!!!!!!!!')
      this.socket.emit('GAME IS OVER', {
        playerID: playerID,
        status: 'GAME OVER'
      })

      this.setState({ gameMsg: 'GAME OVER' })
    }
  }














  render() {
    return (
      <div className="App">
        {/* This should be in the homepage/landing page as a modal */}
        <div className='login'>
          <NameForm
            value={this.state.playerName}
            handleInputChange={this.handleInputChange}
            joinBTN={this.joinBTN}
          />

          <div>
            Welcome: {this.state.displayPlayerName}
          </div>

          <div>
            Score: {this.state.score}
          </div>

          <div>
            Number of Players: {this.state.numberOfPlayers}
          </div>
        </div>

        {/* Ternary operator to show either hand or table */}
        {this.state.tableStatus ?
          <Table
            playersInGame={this.state.playersInGame}

            dealerTotal={this.state.dealerTotal}
            dealerTotalAlt={this.state.dealerTotalAlt}
            dealerCards={this.state.dealerCards}
            playerTotal={this.state.playerTotal}
            playerTotalAlt={this.state.playerTotalAlt}
            playerCards={this.state.playerCards}
            gameMsg={this.state.gameMsg}
            resetGame={this.resetGame}
          />
          :
          <PlayerScreen
            // For Game Message
            gameMsg={this.state.gameMsg}
            resetGame={this.resetGame}

            //For Cardlist
            playerTotal={this.state.playerTotal}
            playerTotalAlt={this.state.playerTotalAlt}
            playerCards={this.state.playerCards}

            //For Controls
            bet={this.state.bet}
            chips={this.state.chips}
            isPlaying={this.state.isPlaying}
            makeBet={this.makeBet}
            dealClicked={this.dealClicked}
            hitClicked={this.hitClicked}
            stayClicked={this.stayClicked}
            clearBet={this.clearBet}
            playerID={this.state.playerID}
          />
        }


      </div>
    );
  }
}

export default App;
