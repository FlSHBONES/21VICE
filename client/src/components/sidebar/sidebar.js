import React from "react";

const SideBar = props => {
    return (
        <div id="sidebar-wrapper">
            <nav id="mySidebar" className="w3-bar-block">

                <button className="w3-button player-box player1">
                    <div className="character-box">
                        <img className="character-icon w3-circle" src="./assets/img/v9KxaP9rQHSl.jpg" />
                    </div>
                    <div className="player-name">
                        <p>Player 1</p>
                        <div className="player-score">Score: 100</div>
                    </div>
                </button>

                <button className="w3-button player-box player2">
                    <div className="character-box">
                        <img className="character-icon w3-circle" src="./assets/img/mr-t-animated.jpg" />
                    </div>
                    <div className="player-name">
                        <p>Player 2</p>
                        <div className="player-score">Score: 100</div>
                    </div>
                </button>
                <button className="w3-button player-box player3">
                    <div className="character-box">
                        <img className="character-icon w3-circle" src="./assets/img/slimercartoon-01_2x.png" />
                    </div>
                    <div className="player-name">
                        <p>Player 3</p>
                        <div className="player-score">Score: 100</div>
                    </div>
                </button>
                <button className="w3-button player-box player4">
                    <div className="character-box">
                        <img className="character-icon w3-circle" src="./assets/img/176d8e7d53ed1ad1e87d0f3adf3c7f4b.jpg" />
                    </div>
                    <div className="player-name">
                        <p>Player 4</p>
                        <div className="player-score">Score: 100</div>
                    </div>
                </button>
            </nav>
        </div>
    );
};

export default SideBar;