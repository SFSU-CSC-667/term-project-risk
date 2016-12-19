var express = require('express');
var world = require("./map.js");
var io = require('../app');
var Event = require('./event.js');
var router = express.Router();
var maxGameID = 0;
var games = [];

//This creates a new game map with our gameid. No players are assigend to this map
//var map = new world.Map("1");
//You can give players control of a territory using it's ID
//Giving playerid 1 control of territory 2
//map.setPlayer(1, 2);
//Let's add some troops to his territory
//Giving territory 2, 6 troops
//map.addTroops(2, 6);
//We can determine if the territory is ajacent to another territory
//console.log(map.isAjacent(2, 1));
//And we can also count how many territories someone has
//console.log(map.territoriesOwned(1));

// Socket stuff
io.on('connection', function(socket) {
    io.to(socket.id).emit('welcome', 'Welcome to the game!');
    socket.on('chat message', function(msg) {
        io.emit('chat message', msg);
    });
});


function createGame() {
    var game = {};
    game.id = maxGameID;
    game.map = new world.Map(maxGameID);
    game.players = [];
    game.currentPlayer = 0;
    game.currentPhase = "setup";
    game.currentDraftCount = -1;
    games[maxGameID] = game;
    maxGameID++;
    return game;
}

function startGame(gameID) {
    var game = games[gameID];
    initTerritories(game);
    game.currentPhase = "draft";
    game.currentPlayer = game.players[0].id;

    var gameEvent = new Event(gameID, 'StartGame');
    gameEvent.currentPlayer = game.currentPlayer;
    io.emit("Game Starting", gameEvent);

    //return player to start turn or do that here
}

function getPlayerByID(players, playerID) {
    for (i = 0; i < players.length; i++) {
        if (players[i].id == playerID) {
            return players[i];
        }
    }
    return false;
}

function addPlayer(gameID, player) {
    var game = games[gameID];
    console.log(player);
    if (game == null) {
        var problem = {};
        problem.type = "error";
        problem.message = "That game does not exist.";
        return problem;
    }
    if (!getPlayerByID(game.players, player.id) && game.currentPhase != "setup") {
        var problem = {};
        problem.type = "error";
        problem.message = "That game is currently in progress, and cannot be joined.";
        return problem;
    }

    if (!getPlayerByID(game.players, player.id) && game.currentPhase == "setup") {
        //TODO: Need some validation on the player object
        game.players.push(player);
        //TEST CODE
        if (game.players.length == 1) {
            playerone = {
                id: 1,
                game: 0,
                name: 'Childish Gambino'
            };
            game.players.push(playerone);
            playertwo = {
                id: 2,
                game: 0,
                name: 'Lil Yachty'
            };
            game.players.push(playertwo);
            playerthree = {
                id: 3,
                game: 0,
                name: 'Paper Boi'
            };
            game.players.push(playerthree);
        }

        if (game.players.length >= 4) {
            startGame(gameID);
        }

        var gameEvent = new Event(gameID, 'PlayerJoined');
        gameEvent.player = player;

        io.emit('Player Joined', gameEvent);
    }

    return true;

}


function removePlayer(gameID, player) {
    var game = games[gameID];
    var index = game.players.indexOf(player); //may not work because of object reference. But I think it should. not tested
    game.players.splice(index, 1);


    if (game.players.length < 1) { //or when equal to one could declare winner.
        endGame(gameID);
    }

    var gameEvent = new Event(gameid, 'PlayerLeft');
    gameEvent.player = player;

    return true;
}


function startTurn(gameID) {

}

function draft(gameID, playerid, territory, amount) {
    var game = games[gameID];
    var player;
    for (i = 0; i < game.players.length; i++) {
        if (game.players[i].id == playerid) {
            player = game.players[i];
            break;
        }
    }
    if (player == null) return false;

    if (game.map.territories[territory - 1].player != playerid) return false;
    if (game.currentDraftCount < amount) return false;
    game.currentDraftCount -= amount;

    game.map.addTroops(territory, amount);

    var gameEvent = new Event(gameID, 'DraftMove');
    gameEvent.player = player;
    gameEvent.territory = territory;
    gameEvent.amount = amount;

    io.emit('Draft Move', gameEvent);
    io.emit('chat message', player.name + ' has placed ' + amount + ' troops in ' + game.map.territories[territory - 1].name);

    return true;
}

function endTurn(gameID) {
    var game = games[gameID];

    var gameEvent = new Event(gameID, 'EndTurn');
    gameEvent.player = game.currentPlayer;
    var name = getPlayerByID(game.players, game.currentPlayer).name;
    io.emit('End Turn', gameEvent);
    io.emit('chat message', name + ' has ended their turn.');

    var playerIndex = game.players.indexOf(getPlayerByID(game.players, game.currentPlayer));

    if (++playerIndex > 3)
        playerIndex = 0;

    game.currentPlayer = game.players[playerIndex].id;

    var gameEvent = new Event(gameID, 'StartTurn');
    gameEvent.player = game.currentPlayer;
    name = getPlayerByID(game.players, game.currentPlayer).name;
    io.emit('Start Turn', gameEvent);
    io.emit('chat message', name + ' has started their turn.');

    game.currentPhase = "draft";
    return true;
}

//Assumes player has no remaining territories
function playerElimination(gameID, player) {

    return removePlayer(gameID, player);
}

function playerVictory(gameID, player) {
    //Do something with player
    return endGame(gameID);
}

function endPhase(gameID) {
    var game = games[gameID];
    switch (game.currentPhase) {
        case "draft":
            game.currentPhase = "attack";

            var gameEvent = new Event(gameID, 'End Phase');
            gameEvent.player = game.currentPlayer;
            var name = getPlayerByID(game.players, game.currentPlayer).name;
            io.emit('chat message', name + ' Draft Phase Ended. Starting Attack Phase');
            io.emit('Attack Phase Start', gameEvent);
            game.currentDraftCount = -1;

            break;

        case "attack":
            game.currentPhase = "fortify";

            var gameEvent = new Event(gameID, 'End Phase');
            gameEvent.player = game.currentPlayer;
            var name = getPlayerByID(game.players, game.currentPlayer).name;
            io.emit('chat message', name + ' Attack Phase Ended. Starting Fortify Phase');
            io.emit('Fortify Phase Start', gameEvent);

            break;

        case "fortify":
            endTurn(gameID);
            break;
        default:
            console.log("Something went wrong.");
    }
}

function endGame(gameID) {
    delete games[gameID];
    return true;
}

function calculateDraft(gameID, player) {
    var game = games[gameID];
    if (game.currentDraftCount != -1) return game.currentDraftCount;
    var totalTerritories = game.map.territoriesOwned(player);
    var result = Math.floor(totalTerritories / 3);

    if (result < 3) {
        result = 3;
    }

    game.currentDraftCount = result;

    return result;
}

function initTerritories(game) {
    //var game = games[gameId];
    var playerIndex = 0;
    var territoryIndex = 1;
    var totalTerritories = game.map.territories.length;
    var totalTroops = 120;

    for (i = 0; i < totalTroops; i++) {
        game.map.setPlayer(game.players[playerIndex].id, territoryIndex);
        game.map.addTroops(territoryIndex, 1);

        playerIndex++;
        territoryIndex++;

        if (playerIndex > 3) playerIndex = 0;
        if (territoryIndex > totalTerritories)
            territoryIndex = 1;
    }
}


function attack(gameID, attackingTerritory, defendingTerritory, attackingTroops, playerID) {

    var game = games[gameID];

    //attacking verifications:

    //attacking player owns source territory
    if(game.map.territories[attackingTerritory - 1].player != playerID) return false;

    //attack player doesn’t own target territory
    if(game.map.territories[defendingTerritory - 1].player == playerID) return false;

    //source territory is adjacent to target territory
    if(!game.map.isAjacent(attackingTerritory, defendingTerritory)) return false;

    //attack amount is >= source territory troop amount + 1
    if(attackingTroops >= game.map.territories[attackingTerritory - 1].troops + 1) return false;

    var defendingTroops = game.map.territories[defendingTerritory - 1].troops;

    do {
      //results = array containing num of remaining troops in territories
      var result = simulate(attackingTroops, game.map.territories[defendingTerritory - 1].troops);
      attackingTroops = attackingTroops - result[0]; //attackingTroops in result[0]
      defendingTroops = defendingTroops - result[1]; //defendingTroops in result[1]

      game.map.addTroops(attackingTerritory, attackingTroops - game.map.territories[attackingTerritory - 1].troops);
      game.map.addTroops(defendingTerritory, defendingTroops - game.map.territories[defendingTerritory - 1].troops);
    } while(attackingTroops > 1 & defendingTroops > 0);

    var gameEvent = new Event(gameID, 'Battle Result');
    gameEvent.player = game.currentPlayer;
    var AttackerName = getPlayerByID(game.players, game.currentPlayer).name;
    var DefenderName = getPlayerByID(game.players, game.map.territories[defendingTerritory].player).name;

    if(defendingTroops == 0) {
      io.emit('chat message', AttackerName + ' has defeated ' + DefenderName);
      io.emit('Attack', gameEvent);

    } else {
      io.emit('chat message', AttackerName + ' has lost to ' + DefenderName);
      io.emit('Attack Phase Start', gameEvent);
    }

    return true;

}

function simulate(attackingTroops, defendingTroops) {

    //Attacking Troops = 2
    if (attackingTroops == 2) {

        //Defending Troops = 1
        if (defendingTroops < 2)
            return attacking1v1(attackingTroops, defendingTroops);

        //Defending Troops > 1
        else
            return attacking1v2(attackingTroops, defendingTroops);
    }

    //Attacking Troop = 3
    else if (attackingTroops == 3) {

        //Defending Troops = 1
        if (defendingTroops < 2)
            return attacking2v1(attackingTroops, defendingTroops);

        //Defending Troops > 1
        else
            return attacking2v2(attackingTroops, defendingTroops);
    }

    //Attacking Troop > 3
    else {

        //Defending Troops = 1
        if (defendingTroops < 2)
            return attacking3v1(attackingTroops, defendingTroops);

        //Defending Troops > 1
        else
            return attacking3v2(attackingTroops, defendingTroops);
    }
}

function attacking1v1(attackingTroops, defendingTroops) {
    var result = [attackingTroops, defendingTroops];

    var attack = diceRoll();
    var defense = diceRoll();

    //Push Rolls to Socket

    //console.log('Attacking Die: '+attack.toString());
    //console.log('Defending Die: '+defense.toString());

    if (attack > defense) --result[1]; //Attacker wins

    else --result[0]; //Defender wins

    return result;
}

function attacking1v2(attackingTroops, defendingTroops) {
    var result = [attackingTroops, defendingTroops];

    var attack = diceRoll();
    var defense = [diceRoll(), diceRoll()];

    defense.sort(function(a, b) {
        return b - a
    });

    //Push Rolls to Socket

    //console.log('Attacking Die: '+attack.toString());
    //console.log('Defending Dice: '+defense.toString());

    if (attack > defense[0]) --result[1];

    else --result[0];

    return result;
}

function attacking2v1(attackingTroops, defendingTroops) {
    var result = [attackingTroops, defendingTroops];

    var attack = [diceRoll(), diceRoll()];
    var defense = diceRoll();

    attack.sort(function(a, b) {
        return b - a
    });

    //Push Rolls to Socket

    //console.log('Attacking Dice: '+attack.toString());
    //console.log('Defending Die: '+defense.toString());

    if (attack[0] > defense) --result[1];

    else --result[0];

    return result;
}

function attacking2v2(attackingTroops, defendingTroops) {
    var result = [attackingTroops, defendingTroops];

    var attack = [diceRoll(), diceRoll()];
    var defense = [diceRoll(), diceRoll()];

    attack.sort(function(a, b) {
        return b - a
    });
    defense.sort(function(a, b) {
        return b - a
    });

    //Push Rolls to Socket

    //console.log('Attacking Dice: '+attack.toString());
    //console.log('Defending Dice: '+defense.toString());

    //Compares highest die
    if (attack[0] > defense[0]) {

        --result[1]; //Highest attacker wins

        //Compares second highest die
        if (attack[1] > defense[1]) {
            --result[1]; //Second highest attacker wins
        } else {
            --result[0]; //Second highest defender wins
        }

        return result;

    } else {
        --result[0]; //Highest defender wins

        //Compares second highest die
        if (attack[1] > defense[1]) --result[1];

        else --result[0];

        return result;
    }
}

function attacking3v1(attackingTroops, defendingTroops) {
    var result = [attackingTroops, defendingTroops];

    var attack = [diceRoll(), diceRoll(), diceRoll()];
    var defense = diceRoll();

    attack.sort(function(a, b) {
        return b - a
    });

    //Push Rolls to Socket

    //console.log('Attacking Dice: '+attack.toString());
    //console.log('Defending Die: '+defense.toString());

    if (attack[0] > defense) --result[1];

    else --result[0];

    return result;
}

function attacking3v2(attackingTroops, defendingTroops) {
    var result = [attackingTroops, defendingTroops];

    var attack = [diceRoll(), diceRoll(), diceRoll()];
    var defense = [diceRoll(), diceRoll()];

    attack.sort(function(a, b) {
        return b - a
    });
    defense.sort(function(a, b) {
        return b - a
    });

    //Push Rolls to Socket

    //console.log('Attacking Dice: '+attack.toString());
    //console.log('Defending Dice: '+defense.toString());

    //Compares highest die
    if (attack[0] > defense[0]) {
        --result[1];

        //Compares second highest die
        if (attack[1] > defense[1]) {
            --result[1];
        } else {
            --result[0];
        }

        //return result;

    } else {
        --result[0];

        //Compares second highest die
        if (attack[1] > defense[1]) {
            --result[1];
        } else {
            --result[0];
        }
    }

    return result;
}


function diceRoll() {
    return Math.floor(Math.random() * 6) + 1;
}

function fortify(gameID, playerID, sourceterritory, targetterritory, amount){
    var game = games[gameID];
    var player = getPlayerByID(game.players, playerID);
<<<<<<< HEAD
    if ((player == false) 
        || (game.map.territories[sourceterritory - 1].player != player.id || 
            game.map.territories[targetterritory - 1].player != player.id) 
=======
    console.log("Validation!");
    console.log(player);
    console.log(game.map.territories[sourceterritory - 1].player);
    console.log(game.map.territories[targetterritory - 1].player);
    console.log(game.map.territories[sourceterritory - 1].troops);
    if ((player == false)
        || (game.map.territories[sourceterritory - 1].player != player.id ||
            game.map.territories[targetterritory - 1].player != player.id)
>>>>>>> 842bdaefc12c787670809956ac54291fe9cc4a53
        || (game.map.territories[sourceterritory - 1].troops <= amount)){
        console.log("Failed validation");
        return false;
    }
    game.map.addTroops(sourceterritory, amount * -1);
    game.map.addTroops(targetterritory, amount);

    io.emit('chat message', player.name + ' has moved ' + amount + ' troops from '
        + game.map.territories[sourceterritory - 1].name + ' to ' + game.map.territories[targetterritory - 1].name);
    endPhase(gameID);
}


/* This file will contain all of the backend game logic */
router.get('/', function(req, res, next) {
    res.render('index');
});


router.get('/:id/territories', function(req, res, next) {
    var game = games[req.params.id];
    if (game != null) {
        res.send(game.map.territories);
    } else {
        res.send(false);
    }
});

router.get('/:id/state', function(req, res, next) {
    var game = games[req.params.id];
    console.log(req.params);
    console.log(games);
    if (game != null) {
        res.send(game);
    } else {
        res.send(false);
    }
});

router.post('/draft', function(req, res, next) {
    res.json(calculateDraft(req.body.gameid, req.body.playerid));
});

router.get('/:id', function(req, res, next) {
    game = games[req.params.id];
    res.render('game', {
        gameid: req.params.id
    });
    //Eventually the code will work like this
    /*
    game = games[req.params.id];
    if (game != null) {
      res.render('game', { gameState: game });
    } else {
      res.render('index', { title: 'Create a game!' });
    }
    */
});

router.post('/events', function(req, res, next) {
    console.log(req.body);
    switch (req.body.type) {
        case "CreateGame":
            res.send(createGame());
            break;
        case "PlayerJoined":
            res.send(addPlayer(req.body.gameid, req.body.player));
            break;
        case "PlayerLeft":
            res.send(removePlayer(req.body.event.gameid, req.body.event.player));
            break;
        case "TurnStart":
            res.send(startTurn(req.body.event.gameid, req.body.event.player));
            break;
        case "DraftMove":
            res.send(draft(req.body.gameid, req.body.playerid, req.body.territory, req.body.amount));
            break;
        case "Attack":
            res.send(attack(req.body.gameid, req.body.sourceterritory, req.body.targetterritory, req.body.amount, req.body.playerid));
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
            res.send(fortify(req.body.gameid, req.body.playerid, req.body.sourceterritory, req.body.targetterritory, req.body.amount));
            break;
        case "PhaseEnd":
            res.send(endPhase(req.body.gameid));
            break;
        case "TurnEnd":
            res.send(endTurn(req.body.event.gameid, req.body.event.player));
            break;
        case "PlayerEliminated":
            res.send(playerElimination(req.body.event.gameid, req.body.event.player));
            break;
        case "PlayerWon":
            res.send(playerVictory(req.body.event.gameid, req.body.event.player));
            break;
        default:
            console.log("this shouldn't happen");
    }
});

module.exports = router;
