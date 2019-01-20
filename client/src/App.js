import React, { Component } from 'react';
import io from 'socket.io-client';
import NameForm from './components/NameForm';
// import { set } from 'mongoose';
import "./App.css";
import Table from './components/table';
import PlayerScreen from './components/playerScreen';
import Roulette from './components/roulette';


class App extends Component {

  state = {
    playerID: "",
    playerName: "",
    displayPlayerName: "",
    numberOfPlayers: 0,
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
  }

  componentDidMount() {
    // The initial connection to the other server
    this.socket = io('http://localhost:4000');
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


    // ----------------------- GAME LOGIC -------------------------//
    // Players are ready
    this.socket.on('Players are ready', data => {
      console.log('SHOULD ARRAY OF PLAYER OBJECTS')
      console.log(data);

      if (this.state.bet === 0) return;

      console.log(this.state.playerID);
      console.log(this.state);
      // Displays cards in each socket
      for (var i = 0; i < data.playersInGame.length; i++) {
        if (data.playersInGame[i].socketId === this.socket.id) {
          this.setState({
            playerID: this.socket.id,
            dealerCards: data.dealerCards,
            playerCards: data.playersInGame[i].hand,
            playersInGame: data.playersInGame,
            isPlaying: true
          }, () => {
            this.calcCards()
          })
        }
      }
    })

    // Displays to table
    this.socket.on('Table Cards', data => {
      this.setState({
        dealerCards: data.dealerCards,
        playersInGame: data.playersInGame
      }, () => {
        this.calcCards()
      })
    })

    // Display Calc for each socket
    this.socket.on('Player Calc', data => {
      if (this.state.playerID === data.playerID) {
        this.setState({
          dealerTotal: data.dealerTotal,
          dealerTotalAlt: data.dealerTotalAlt,
          playerTotal: data.playerTotal,
          playerTotalAlt: data.playerTotalAlt,
          playersInGame: data.playersInGame
        })
      }
    })

    // Displays Calc to table
    this.socket.on('Table Calc', data => {
      this.setState({
        dealerTotal: data.dealerTotal,
        dealerTotalAlt: data.dealerTotalAlt,
        playersInGame: data.playersInGame
      })
    })

    // Display player has hit to each socket
    this.socket.on('Player has hit', data => {
      console.log('Player has hit')

      for (var i = 0; i < data.playersInGame.length; i++) {
        if (data.playersInGame[i].socketId === data.playerID) {
          this.setState({
            playerCards: data.playersInGame[i].hand,
            playersInGame: data.playersInGame
          }, () => {
            this.calcCards();
            this.checkForBust();
          })
        }
      }
    });

    // Display player has hit to table
    this.socket.on('Table player hits', data => {
      this.setState({
        playersInGame: data.playersInGame
      }, () => {
        this.calcCards();
        this.checkForBust();
      })
    })

    // Display Bust to each socket
    this.socket.on('Check player for busting', data => {
      for (var i = 0; i < data.playersInGame.length; i++) {
        if (data.playersInGame[i].socketId === data.playerID) {
          this.setState({
            gameMsg: data.status,
            playersInGame: data.playersInGame
          }, () => {
            this.remainStay();
          })
        }
      }
    })

    // Display Bust to table
    this.socket.on('Check table for busting', data => {
      this.setState({
        playersInGame: data.playersInGame
      })
    })

    // Display bust when player stays to each socket
    this.socket.on('Check bust when player stays', data => {
      console.log('data for saty playerssssss')
      console.log(data.playersInGame)
      for (var i = 0; i < data.playersInGame.length; i++) {
        if (data.playersInGame[i].socketId === this.state.playerID) {
          this.setState({
            gameMsg: data.playersInGame[i].gameMsg,
            playersInGame: data.playersInGame
          }, () => {
            this.resetGame();
          })
        }
      }
    })

    // Display bust when player stays to table
    this.socket.on('Check table bust when player stays', data => {
      console.log('data for saty')
      console.log(data.playersInGame)
      this.setState({
        dealerCards: data.dealerCards,
        dealerTotal: data.dealerTotal,
        dealerTotalAlt: data.dealerTotalAlt,
        playersInGame: data.playersInGame
      })
    })

    // Display Reset
    this.socket.on('Next Round', data => {
      console.log(data);

      for (var i = 0; i < data.length; i++) {
        if (data[i].socketId === this.state.playerID) {
          this.setState({
            dealerCards: [],
            dealerTotal: 0,
            dealerTotalAlt: 0,
            gameMsg: '',
            isPlaying: false,
            playerTotal: 0,
            playerTotalAlt: 0,
            playerCards: [],
            bet: 0,
            chips: data[i].chips,
            playersInGame: data
          })
        }
      }
    })

    // Display next round for table
    this.socket.on('Next Round Table', data => {
      console.log(data)

      for (var i = 0; i < data.length; i++) {

        this.setState({
          dealerCards: [],
          dealerTotal: 0,
          dealerTotalAlt: 0,
          gameMsg: '',
          isPlaying: false,
          playerTotal: 0,
          playerTotalAlt: 0,
          playerCards: [],
          bet: 0,
          chips: data[i].chips,
          playersInGame: data
        })
      }
    })

    // GAME OVER
    this.socket.on('GAME OVER', data => {
      console.log('GAME OVER???')
      console.log(data)

      let newPlayersInGame = this.state.playersInGame

      for (var i = 0; i < newPlayersInGame.length; i++) {
        if (newPlayersInGame[i].socketId === data[i].socketId) {
          this.setState({
            gameMsg: data[i].gameMsg,
            bet: data[i].bet,
            chips: data[i].chips,
            playersInGame: data
          })
        }
      }
    })

    // RESTART THE GAME FOR EVERYONE
    this.socket.on('New Game', data => {
      console.log(data)
      this.setState({
        playerID: "",
        playerName: "",
        displayPlayerName: "",
        numberOfPlayers: 0,
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
      })
    })

    // RESTART THE GAME FOR TABLE
    this.socket.on('New Game Table', data => {
      console.log(data)
      this.setState({
        playerID: "",
        playerName: "",
        displayPlayerName: "",
        numberOfPlayers: 0,
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
      })
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
    this.socket.emit('LOGIN', {
      playerID: this.socket.id,
      playerName: this.state.playerName
    });

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
          displayPlayerName: player.playerName
        })
      }
    })

    // Shows message when join is successful
    this.socket.on('ROOM_JOIN_SUCCESS', msg => {
      console.log(msg);
    })

    // Lets everyone in Room 1 see number of players
    this.socket.on('Number of Players', data => {
      this.setState({
        numberOfPlayers: data.numberOfPlayers,
        playersInGame: data.players
      }, () => {
        console.log(this.state.playersInGame);
      })
    })
  }


  // Black Jack Game Functions for sockets
  // Checks for card total
  calcCards = () => {
    this.socket.emit('Calc', {
      playerID: this.state.playerID,
      playerCards: this.state.playerCards
    })
  };

  // Check if player bust
  checkForBust = () => {
    this.socket.emit('Check for bust', this.state.playerID)
  }

  // Makes Bet
  makeBet = betVal => {
    this.setState(prevState => ({
      bet: prevState.bet + betVal,
      chips: prevState.chips - betVal
    }));
  };

  // Clears Bet
  clearBet = () => {
    this.setState(prevState => ({
      bet: 0,
      chips: prevState.chips + prevState.bet
    }));
  };

  //------------FUNCATION TO START THE GAME/ROUND------------//
  //---FOLLOW THE 'ROUTE NAMES' FROM APP.JS TO SERVER.JS-----//
  // Ready Check to start the game 
  readyClicked = () => {
    console.log(`${this.state.playerName} is ready!!!`)
    console.log('Socketid: ' + this.socket.id);
    if (this.state.bet !== 0) {
      this.socket.emit('Player is ready', {
        playerID: this.socket.id,
        ready: 1,
        bet: this.state.bet
      });
    } return;
  }

  // When a player hits
  hitClicked = () => {
    console.log('Player clicked hit');
    this.socket.emit('Player clicked hit', this.state.playerID)
  }

  // When a player stays
  stayClicked = () => {
    console.log('Player clicked Stay');
    this.socket.emit('Player clicked Stay', {
      stay: 1
    })
  }

  // When a player has busted and the others are still playing
  remainStay = () => {
    console.log('Staying until game other players finish')
    this.socket.emit('Player clicked Stay', {
      stay: 0
    })
  }

  // Resets the game
  resetGame = () => {
    this.socket.emit('Reset Game', 'Resetting Game')
  };


  handleOnComplete = (value) => {
    console.log(value);
  };



  render() {

    const options = [
      "+1",
      "+2",
      "+3",
      "+4",
      "+5",
    ];

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
            gameMsg={this.state.gameMsg}
          />
          :
          <PlayerScreen
            // For Game Message
            gameMsg={this.state.gameMsg}

            //For Cardlist
            playerName={this.state.playerName}
            playerTotal={this.state.playerTotal}
            playerTotalAlt={this.state.playerTotalAlt}
            playerCards={this.state.playerCards}

            //For Controls
            bet={this.state.bet}
            chips={this.state.chips}
            isPlaying={this.state.isPlaying}
            makeBet={this.makeBet}
            readyClicked={this.readyClicked}
            hitClicked={this.hitClicked}
            stayClicked={this.stayClicked}
            clearBet={this.clearBet}
            playerID={this.state.playerID}
          />
        }

        <Roulette options={options} baseSize={80} onComplete={this.handleOnComplete} />

      </div>
    );
  }
}

export default App;
