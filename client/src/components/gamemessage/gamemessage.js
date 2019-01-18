import React from "react";
import './gamemessage.css';

const GameMessage = props => {
  return (
    <div className="backdrop">
      <p onClick={() => props.resetClicked()}>{props.msg}</p>
    </div>
  );
};

export default GameMessage;
