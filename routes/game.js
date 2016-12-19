var express = require('express');
var world = require("./map.js");
var io = require('../app');
var Event = require('./event.js');
var pgp = require('pg-promise')();
//process.env.DATABASE_URL on heroku
//'postgres://localhost:5432/risk' on local
var db = pgp(process.env.DATABASE_URL);
createTables();
var router = express.Router();
var maxGameID = 0;
var games = [];

// Socket stuff
io.on('connection', function(socket) {
    io.to(socket.id).emit('welcome', 'Welcome to the game!');
    socket.on('chat message', function(object) {
        sendChatMessage(object.gameid, object.message);
    });
});


function createTables() {
    db.any("CREATE TABLE game (id integer NOT NULL, players text, currentPlayer bigint, currentPhase varchar(10),"
     + "currentDraftCount int, territories text);");
    db.any("CREATE TABLE chat (gameid integer NOT NULL, message text);");
}

function getChatMessages(gameID) {
    return db.any("select * from chat where gameid = $1", gameID);
}

function sendChatMessage(gameID, message) {
    return db.none("insert into chat(gameid, message) values ($1, $2)", [gameID, message])
        .then(function(data) {
            var object = {};
            object.gameid = gameID;
            object.message = message;
            io.emit('chat message', object);
        });
}


function buildGame(rawGame) {
    var game = {};
    game.id = rawGame.id;
    game.currentPlayer = rawGame.currentplayer;
    game.currentPhase = rawGame.currentphase;
    game.currentDraftCount = rawGame.currentdraftcount;
    game.map = new world.Map(game.id);
    game.map.loadTerritories(JSON.parse(rawGame.territories));
    if (rawGame.players == 'null') {
        game.players = [];
    } else {
        game.players = JSON.parse(rawGame.players);
    }
    return game;
}

function getGame(gameID) {
    return db.one("select * from game where id= $1", gameID);
}

function storeGame(game) {
    var players = game.players;
    if (game.players.length == 0) players = null;

    return db.none("insert into game(id, players, currentPlayer, currentPhase, currentDraftCount, territories)" +
        " values($1, $2, $3, $4, $5, $6)", [game.id, JSON.stringify(players), game.currentPlayer, game.currentPhase, game.currentDraftCount, JSON.stringify(game.map.territories)]);
}

function updateGame(game) {
    var players = game.players;
    if (game.players.length == 0) players = null;

    return db.none("update game SET (id, players, currentPlayer, currentPhase, currentDraftCount, territories) = " +
        " ($1, $2, $3, $4, $5, $6) WHERE id = $1", [game.id, JSON.stringify(players), game.currentPlayer, game.currentPhase, game.currentDraftCount, JSON.stringify(game.map.territories)]);
}

function getMaxGameID() {
    return db.one("select max(id) from game");
}

function createGame(res) {
    getMaxGameID().then(function(data) {
        var game = {};
        game.id = data.max == null ? 0 : data.max + 1;
        game.map = new world.Map(game.id);
        game.players = [];
        game.currentPlayer = 0;
        game.currentPhase = "setup";
        game.currentDraftCount = -1;
        storeGame(game).then(function(data) {
            res.send(game);
        });
    });
}

function startGame(game) {
    initTerritories(game);
    game.currentPhase = "draft";
    game.currentPlayer = game.players[0].id;

    updateGame(game).then(function(data) {
        var gameEvent = new Event(game.id, 'StartGame');
        gameEvent.currentPlayer = game.currentPlayer;
        io.emit("Game Starting", gameEvent);
    });
}

function getPlayerByID(players, playerID) {
    for (i = 0; i < players.length; i++) {
        if (players[i].id == playerID) {
            return players[i];
        }
    }
    return false;
}

function addPlayer(res, gameID, player) {
    getGame(gameID).then(function(data) {
        var game = buildGame(data);
        if (!getPlayerByID(game.players, player.id) && game.currentPhase != "setup") {
            var problem = {};
            problem.type = "error";
            problem.message = "That game is currently in progress, and cannot be joined.";
            res.send(problem);
        } else if (!getPlayerByID(game.players, player.id) && game.currentPhase == "setup") {
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

            updateGame(game).then(function(data) {
                res.send(true);
                var gameEvent = new Event(game.id, 'PlayerJoined');
                gameEvent.player = player;
                io.emit('Player Joined', gameEvent);
                if (game.players.length >= 4) {
                    startGame(game);
                }
            });
        } else {

            res.send(true);
        }
    }).catch(function(error) {
        var problem = {};
        problem.type = "error";
        problem.message = "That game does not exist.";
        res.send(problem);
    });;
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

function draft(res, gameID, playerid, territory, amount) {
    getGame(gameID).then(function(data) {
        var game = buildGame(data);
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

        updateGame(game).then(function(data) {
            var gameEvent = new Event(game.id, 'DraftMove');
            gameEvent.player = player;
            gameEvent.territory = territory;
            gameEvent.amount = amount;

            io.emit('Draft Move', gameEvent);
            sendChatMessage(game.id, player.name + ' has placed ' + amount + ' troops in ' + game.map.territories[territory - 1].name);
            res.send(true);
        });
    });
}

function endTurn(res, game) {
    var gameEvent = new Event(game.id, 'EndTurn');
    gameEvent.player = game.currentPlayer;
    var name = getPlayerByID(game.players, game.currentPlayer).name;
    io.emit('End Turn', gameEvent);
    sendChatMessage(game.id, name + ' has ended their turn.');

    var playerIndex = game.players.indexOf(getPlayerByID(game.players, game.currentPlayer));

    if (++playerIndex > 3)
        playerIndex = 0;

    game.currentPlayer = game.players[playerIndex].id;
    game.currentPhase = "draft";

    updateGame(game).then(function(data) {
        var gameEvent = new Event(game.id, 'StartTurn');
        gameEvent.player = game.currentPlayer;
        name = getPlayerByID(game.players, game.currentPlayer).name;
        io.emit('Start Turn', gameEvent);
        sendChatMessage(game.id, name + ' has started their turn.');
        res.send(true);
    });
}

//Assumes player has no remaining territories
function playerElimination(gameID, player) {

    return removePlayer(gameID, player);
}

function playerVictory(gameID, player) {
    //Do something with player
    return endGame(gameID);
}

function endPhase(res, gameID) {
    getGame(gameID).then(function(data) {
        var game = buildGame(data);
        switch (game.currentPhase) {
            case "draft":
                game.currentPhase = "attack";
                game.currentDraftCount = -1;
                updateGame(game).then(function(data) {
                    var gameEvent = new Event(game.id, 'End Phase');
                    gameEvent.player = game.currentPlayer;
                    var name = getPlayerByID(game.players, game.currentPlayer).name;
                    sendChatMessage(game.id, name + ' Draft Phase Ended. Starting Attack Phase');
                    io.emit('Attack Phase Start', gameEvent);
                    res.send("ok");
                });

                break;

            case "attack":
                game.currentPhase = "fortify";

                updateGame(game).then(function(data) {
                    var gameEvent = new Event(game.id, 'End Phase');
                    gameEvent.player = game.currentPlayer;
                    var name = getPlayerByID(game.players, game.currentPlayer).name;
                    sendChatMessage(game.id, name + ' Attack Phase Ended. Starting Fortify Phase');
                    io.emit('Fortify Phase Start', gameEvent);
                    res.send("ok");
                });

                break;

            case "fortify":
                endTurn(res, game);
                break;
            default:
                console.log("Something went wrong.");
        }
    });
}

function endGame(gameID) {
    delete games[gameID];
    return true;
}

function calculateDraft(res, gameID, player) {
    getGame(gameID).then(function(data) {
        var game = buildGame(data);
        if (game.currentDraftCount != -1) res.json(game.currentDraftCount);
        var totalTerritories = game.map.territoriesOwned(player);
        var result = Math.floor(totalTerritories / 3);

        if (result < 3) {
            result = 3;
        }

        game.currentDraftCount = result;
        updateGame(game).then(function(data) {
            res.json(result);
        });
    });
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

function attack(res, gameID, attackingTerritory, defendingTerritory, attackingTroops, playerID) {
    getGame(gameID).then(function(data) {
        var game = buildGame(data);

        //attacking verifications:

        //attacking player owns source territory
        if (game.map.territories[attackingTerritory - 1].player != playerID) {
            return false;
        }

        //attack player doesn’t own target territory
        if (game.map.territories[defendingTerritory - 1].player == playerID) {
            return false;
        }

        //source territory is adjacent to target territory
        if (!game.map.isAdjacent(attackingTerritory, defendingTerritory)) {
            return false;
        }

        //attack amount is >= source territory troop amount
        if (attackingTroops >= game.map.territories[attackingTerritory - 1].troops) {
            return false;
        }

        if (attackingTroops == 0 || game.map.territories[attackingTerritory - 1].player == 0) {
            return false;
        }

        var attackers = attackingTroops;
        game.map.territories[attackingTerritory - 1].troops -= attackers;
        var defenders = game.map.territories[defendingTerritory - 1].troops;
        var AttackerName = getPlayerByID(game.players, game.currentPlayer).name;
        var DefenderName = getPlayerByID(game.players, game.map.territories[defendingTerritory - 1].player).name;
        var AttackTerritoryName = game.map.territories[attackingTerritory - 1].name;
        var DefendTerritoryName = game.map.territories[defendingTerritory - 1].name;

        console.log("Attacking " + attackers + " Defending " + defenders);


        while (attackers > 0 && defenders > 0) {
            var result = simulate(attackers, defenders);
            attackers = result[0];
            defenders = result[1];
            console.log("AfterBattle: Attackers " + attackers + " Defending " + defenders);
        }

        if (defenders == 0) {
            game.map.setPlayer(playerID, defendingTerritory);
            game.map.territories[defendingTerritory - 1].troops = attackers;
            sendChatMessage(game.id, AttackTerritoryName + ' (' + AttackerName + ') has attacked ' +
                DefendTerritoryName + ' (' + DefenderName + ') and taken the territory!');
        } else {
            game.map.territories[defendingTerritory - 1].troops = defenders;
            sendChatMessage(game.id, AttackTerritoryName + ' (' + AttackerName + ') has attacked ' +
                DefendTerritoryName + ' (' + DefenderName + ') and was defeated!');
        }

        updateGame(game).then(function(data) {
            var gameEvent = new Event(game.id, 'Battle Result');
            gameEvent.player = game.currentPlayer;
            io.emit('Battle Result', gameEvent);

            res.send(true);
        });
    });



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

    //Compares highest die
    if (attack[0] > defense[0]) {
        --result[1];

        //Compares second highest die
        if (attack[1] > defense[1]) {
            --result[1];
        } else {
            --result[0];
        }

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

function fortify(res, gameID, playerID, sourceterritory, targetterritory, amount) {
    getGame(gameID).then(function(data) {
        var game = buildGame(data);

        var player = getPlayerByID(game.players, playerID);
        if ((player == false) ||
            (game.map.territories[sourceterritory - 1].player != player.id ||
                game.map.territories[targetterritory - 1].player != player.id) ||
            (game.map.territories[sourceterritory - 1].troops <= amount)) {
            console.log("Failed validation");
            res.send(false);
        } else {
            game.map.territories[sourceterritory - 1].troops -= parseInt(amount);
            game.map.territories[targetterritory - 1].troops += parseInt(amount);
        }

        updateGame(game).then(function(data) {
            sendChatMessage(game.id, player.name + ' has moved ' + amount + ' troops from ' +
                game.map.territories[sourceterritory - 1].name + ' to ' + game.map.territories[targetterritory - 1].name);
            var gameEvent = new Event(game.id, 'Battle Result');
            gameEvent.player = game.currentPlayer;
            io.emit('Fortify Move', gameEvent);

            endPhase(res, game.id);
        });
    });

}


/* This file will contain all of the backend game logic */
router.get('/', function(req, res, next) {
    res.render('index');
});


router.get('/:id/territories', function(req, res, next) {
    getGame(req.params.id).then(function(data) {
        var game = buildGame(data);
        res.send(game.map.territories);
    }).catch(function(error) {
        res.send(false);
    });
});

router.get('/:id/chat', function(req, res, next) {
    getChatMessages(req.params.id).then(function(data) {
        res.send(data);
    }).catch(function(error) {
        res.send(false);
    });
});

router.get('/:id/state', function(req, res, next) {
    getGame(req.params.id).then(function(data) {
        var game = buildGame(data);
        res.send(game);
    }).catch(function(error) {
        res.send(false);
    });
});

router.post('/draft', function(req, res, next) {
    calculateDraft(res, req.body.gameid, req.body.playerid);
});

router.get('/:id', function(req, res, next) {
    getGame(req.params.id).then(function(data) {
        var game = buildGame(data);
        res.render('game', {
            gameid: req.params.id
        });
    }).catch(function(error) {
        res.render('game', {
            gameid: false
        });
    });
});

router.post('/events', function(req, res, next) {
    console.log(req.body);
    switch (req.body.type) {
        case "CreateGame":
            createGame(res);
            break;
        case "PlayerJoined":
            addPlayer(res, req.body.gameid, req.body.player);
            break;
        case "PlayerLeft":
            res.send(removePlayer(req.body.event.gameid, req.body.event.player));
            break;
        case "DraftMove":
            draft(res, req.body.gameid, req.body.playerid, req.body.territory, req.body.amount);
            break;
        case "Attack":
            attack(res, req.body.gameid, req.body.sourceterritory, req.body.targetterritory, req.body.amount, req.body.playerid);
            break;
        case "Fortify":
            fortify(res, req.body.gameid, req.body.playerid, req.body.sourceterritory, req.body.targetterritory, req.body.amount);
            break;
        case "PhaseEnd":
            endPhase(res, req.body.gameid);
            break;
        case "TurnEnd":
            endTurn(res, req.body.event.gameid, req.body.event.player);
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