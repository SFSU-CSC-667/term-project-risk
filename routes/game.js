var express = require('express');
var world = require("./map.js");
var router = express.Router();
var maxGameID = 1;
var games = {};

//This creates a new game map with our gameid. No players are assigend to this map
var map = new world.Map("1");
//You can give players control of a territory using it's ID
//Giving playerid 1 control of territory 2
map.setPlayer(1, 2);
//Let's add some troops to his territory
//Giving territory 2, 6 troops
map.addTroops(2, 6);
//We can determine if the territory is ajacent to another territory
console.log(map.isAjacent(2, 1));
//And we can also count how many territories someone has
console.log(map.territoriesOwned(1));


function createGame() {
     var game = {};
     game.id = maxGameID;
     game.territories = new world.Map(maxGameID);
     game.players = [];
     game.currentPlayer = 0;
     games[maxGameID] = game;
     maxGameID++
     return game;
}

function addPlayer(gameId, player) {
	var game = games[gameID];
	//TODO: Need some validation on the player object
	game.players.push(player);
	if (game.players.length >= 4) {
		startGame(gameID);
	} 
	return true;
}

function removePlayer(gameId, player) {
  var game = games[gameID];
  var index = game.players.indexOf(player); //may not work because of object reference. But I think it should. not tested
  game.players.splice(index, 1);


  if (game.players.length < 1) {  //or when equal to one could declare winner.
    endGame(gameID);
  }
  return true; 
}

function startTurn(gameId, player) {
  
}

function draft(gameId, player) {
  
}

function endTurn(gameID, player) {
  var game = games[gameId];
  var playerIndex = game.players.indexOf(player);
  
  if(++playerIndex > 3)
    playerIndex = 0;

  game.currentPlayer = game.players[playerIndex].id;

  return true;
  
}

//Assumes player has no remaining territories 
function playerElimination(gameID, player) {
  return removePlayer(gameid,player);
}

function playerVictory(gameID, player) {
  //Do something with player
  return endGame(gameId);
}

function endGame(gameId) {
  delete games[gameId];
  return true;
}

/* This file will contain all of the backend game logic */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Create a game!' });
});

router.get('/:id', function(req, res, next) {
  res.render('game', { title: 'Create a game!' });
});

router.get('/territories', function(req, res, next) {
  res.send(map);
});

router.post('/events', function(req, res, next) {
	switch (req.body.event.type){
    case "CreateGame":
      res.send(createGame());
      break;
    case "PlayerJoined": 
      res.send(addPlayer(res.body.event.gameid, res.body.event.player));
      break;
    case "PlayerLeft":
      res.send(removePlayer(res.body.event.gameid, res.body.event.player));
      break;
    case "TurnStart":
      res.send(startTurn(res.body.event.gameid, res.body.event.player));
      break;
    case "DraftMove":
      res.send(draft(res.body.event.gameid, res.body.event.player, res.body.event.territory, res.body.event.amount));
      break;
    case "Attack":
      //not implemented
      //res.send();
      break;
    case "BattleResult":
      //not implemented
      //res.send();
      break;
    case "BattleVictory":
      //not implemented
      //res.send();
      break;
    case "Fortify":
      //not implemented
      //res.send();
      break;
    case "TurnEnd":
      res.send(endTurn(res.body.event.gameid, res.body.event.player));
      break;
    case "PlayerEliminated":
      res.send(playerElimination(res.body.event.gameid, res.body.event.player));
      break;
    case "PlayerWon":
      res.send(playerVictory(res.body.event.gameid, res.body.event.player));
      break;
	   default: 
	       console.log("this shouldn't happen");
	}
});

module.exports = router;
