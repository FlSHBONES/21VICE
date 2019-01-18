import React from "react";

const SideBar = props => {

    return (
        <div id="sidebar-wrapper">
            <nav id="mySidebar" className="w3-bar-block">
                <button className="w3-bar-item w3-button w3-padding player-box player1"><i className="fa fa-users fa-fw"></i>  Player 1</button>
                <button className="w3-bar-item w3-button w3-padding player-box player2"><i className="fa fa-eye fa-fw"></i>  Player 2</button>
                <button className="w3-bar-item w3-button w3-padding player-box player3"><i className="fa fa-users fa-fw"></i>  Player 3</button>
                <button className="w3-bar-item w3-button w3-padding player-box player4"><i className="fa fa-diamond fa-fw"></i>  Player 4</button>
            </nav>
        </div>
    );
};

export default SideBar;
