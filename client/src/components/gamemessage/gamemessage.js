import React from "react";
import './gamemessage.css';

const GameMessage = props => {
  return (
    <div className="backdrop">
      <p>{props.msg}</p>
    </div>
  );
};

export default GameMessage;
