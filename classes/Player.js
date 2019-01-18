class Player {
    constructor(socketId, playerName, hand, score) {
        this.socketId = socketId;
        this.playerName = playerName;
        this.hand = hand;
        this.score = score;
        this.playerTotal = 0;
        this.playerTotalAlt = 0;
        this.gameMsg = "";
    }
}

module.exports = Player;