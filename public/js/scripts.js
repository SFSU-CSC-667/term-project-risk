var socket = io();
var game = {};
game.players = {};
var colors = {};
colors[0] = "red";
colors[1] = "blue";
colors[2] = "yellow";
colors[3] = "green";

var currentPlayers = 0;
var clickCount = 0;
var reinforceTroops, attackTroops, sourceTerritory, sourceID, destID, upLimit;
socket.on('welcome', function(msg) {
    $('#messages').append($('<li style="font-size:20px; font-weight: bold">').text(msg));
});
socket.on('chat message', function(msg) {
    $('#messages').append($('<li>').text(msg));
});

function territoryClicked(name, id) {
    console.log(name);

    if (game.currentPlayer != localStorage.getItem("userID")) {
        return;
    }

    if (game.currentPhase == "draft") {
        //Decrease draft-amount span accordingly when drafting- done
        //only let me deploy/draft on territories I control - done
        //only allow me to draft when I have draft-amount > 0 - done
        //while $('#draft-amount').text() > 0 - done
        //Don't let me reduce my troop count more than prexisting - ?
        if (game.territories[id - 1].player == game.currentPlayer) {
            if (parseInt(document.getElementById('draft-amount').textContent) > 0) {
                deploy(name);
            } else {
                alert("No troops to deploy"); //user does not have troops to deploy
            }
        } else {
            alert("Click on your own territory"); //click on your territory
        }

    } else if (game.currentPhase == "attack") {
        clickCount++;
        if (clickCount == 1) {
            console.log(clickCount + " " + game.territories[id - 1].player + " " + game.currentPlayer);
            if (game.territories[id - 1].player == game.currentPlayer) {
                sourceTerritoryText = document.getElementById(name + "Text");
                sourceID = id;
                attackTroops = parseInt(document.getElementById(name + "Text").textContent) - 1;
                //ask user to click again
                $('#attackTextAdditional').show();
            } else {
                alert("Select your own territory");
                clickCount = 0;
            }
        } else if (clickCount == 2) {
            console.log(clickCount + " " + game.territories[id - 1].player + " " + game.currentPlayer)
            if (game.territories[id - 1].player != game.currentPlayer) {
                destID = id;
                $('#attackTextAdditional').hide();
                attack(name, attackTroops, sourceTerritoryText, sourceID, destID);
            } else {
                alert("Select an enemy territory")
            }
            clickCount = 0;
        }
    } else if (game.currentPhase == "fortify") {
        if (game.territories[id - 1].player == game.currentPlayer) {
            clickCount++;
            if (clickCount == 1) {
                sourceTerritoryText = document.getElementById(name + "Text");
                sourceID = id;
                reinforceTroops = parseInt(document.getElementById(name + "Text").textContent) - 1;
                //ask user to click again
                $('#fortifyTextAdditional').show();
            } else if (clickCount == 2) {
                destID = id;
                $('#fortifyTextAdditional').hide();
                reinforce(name, reinforceTroops, sourceTerritoryText, sourceID, destID);
            }
        } else {
            alert("Click on your own territory"); //click on your territory
            clickCount = 0;
        }

    }
}


function deploy(name) {
    //Assigns the current value to the input, or zero if it isn't set
    document.getElementById('deployValue').value = upLimit = document.getElementById('draft-amount').textContent == "" ?
        0 : document.getElementById('draft-amount').textContent;
    var modal = document.getElementById('deployModal');
    modal.style.display = "block";
    ///Hides when you click Deploy button
    document.getElementById('deploy').onclick = function() {
            document.getElementById('deployModal').style.display = "none";
            var deployed = document.getElementById('deployValue').value;
            document.getElementById(name + 'Text').textContent = parseInt(document.getElementById(name + 'Text').textContent) + parseInt(document.getElementById('deployValue').value);
            document.getElementById('draft-amount').textContent = parseInt(document.getElementById('draft-amount').textContent) - parseInt(document.getElementById('deployValue').value);

            var body = {};
            body.playerid = parseInt(game.currentPlayer);
            body.territory = parseInt(document.getElementsByName(name)[0].id);
            body.amount = deployed;
            body.type = "DraftMove";
            console.log(body);
            sendEvent(body);

            /*if (parseInt(document.getElementById('draft-amount').textContent) == 0) {
                endPhase();
            }*/
        }
        //Hides model when you click away or click the close button
    document.getElementsByClassName("close")[0].onclick = function() {
        modal.style.display = "none";
    }
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}

function reinforce(name, reinforceTroops, sourceTerritoryText, sourceID, destID) {
    if (reinforceTroops <= 0) {
        alert("No troops to reinforce")
    } else if (game.territories[sourceID - 1].adjacent.indexOf(destID) >= 0) {
        console.log(name + " " + sourceTerritoryText + " " + reinforceTroops);
        //Assigns the current value to the input, or zero if it isn't set
        document.getElementById('reinforceValue').value = upLimit = reinforceTroops;
        var modal = document.getElementById('reinforceModal');
        modal.style.display = "block";
        ///Hides when you click Deploy button
        document.getElementById('reinforce').onclick = function() {
                document.getElementById('reinforceModal').style.display = "none";
                console.log("Reinforced " + document.getElementById('reinforceValue').value + " in " + name);
                document.getElementById(name + 'Text').textContent = parseInt(document.getElementById(name + 'Text').textContent) + parseInt(document.getElementById('reinforceValue').value);
                sourceTerritoryText.textContent = parseInt(sourceTerritoryText.textContent) - parseInt(document.getElementById('reinforceValue').value);

                var body = {};
                body.playerid = parseInt(game.currentPlayer);
                body.targetterritory = destID;
                body.sourceterritory = sourceID;
                body.amount = parseInt(document.getElementById('reinforceValue').value);
                body.type = "Fortify";
                console.log(body);
                sendEvent(body);
            }
            //Hides model when you click away or click the close button
        document.getElementsByClassName("close")[1].onclick = function() {
            modal.style.display = "none";
        }
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
    } else {
        alert("Please select an adjacent friendly territory");
        clickCount = 0;
    }
}

function attack(name, attackTroops, sourceTerritoryText, sourceID, destID) {
    if (attackTroops <= 0) {
        alert("No troops to attack")
    } else if (game.territories[sourceID - 1].adjacent.indexOf(destID) >= 0) {
        console.log(name + " " + sourceTerritoryText + " " + attackTroops);
        //Assigns the current value to the input, or zero if it isn't set
        document.getElementById('attackValue').value = upLimit = attackTroops;
        var modal = document.getElementById('attackModal');
        modal.style.display = "block";
        ///Hides when you click Deploy button
        document.getElementById('attack').onclick = function() {
                document.getElementById('attackModal').style.display = "none";
                console.log("Attacked with " + document.getElementById('attackValue').value + " troops against " + name);
                document.getElementById(name + 'Text').textContent = parseInt(document.getElementById(name + 'Text').textContent) - parseInt(document.getElementById('attackValue').value);
                sourceTerritoryText.textContent = parseInt(sourceTerritoryText.textContent) - parseInt(document.getElementById('attackValue').value);

                var body = {};
                body.playerid = parseInt(game.currentPlayer);
                body.targetterritory = destID;
                body.sourceterritory = sourceID;
                body.amount = parseInt(document.getElementById('attackValue').value);
                body.type = "Attack";
                console.log(body);
                sendEvent(body);
            }
            //Hides model when you click away or click the close button
        document.getElementsByClassName("close")[2].onclick = function() {
            modal.style.display = "none";
        }
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
    } else {
        alert("Please select a neighbouring enemy territory");
    }
}

function setColor(territoryID, playerID) {
    if (playerID == 0) {
        return;
    } else {
        var color = $('#player_color_' + playerID).attr('class').split(' ')[1];
        $('#' + document.getElementById(territoryID).alt + 'Text').css("color", color);
    }
}

function setTroops(territoryID, value) {
    var item = document.getElementById(document.getElementById(territoryID).alt + 'Text');
    item.textContent = value;
}

function draftText(data) {
    $("#setupText").hide();
    $('#waitingText').hide();
    $('#draftText').show();
    $('#draftpill').removeClass("disabled").addClass('active');
    $('#draft-amount').text(data);
}

function startDraft(playerID, gameid) {
    var body = {};
    body.playerid = playerID;
    body.gameid = gameid;
    game.draft = 0;
    console.log("FETCHING DRAFT");
    $.post(
        "/game/draft",
        body,
        draftText
    );
}

function updateGame() {
    $.get(
        "/game/" + $('#gameid').val() + "/state",
        function(data) {
            game.territories = data.map.territories;
            game.currentPlayer = data.currentPlayer;
            game.currentPhase = data.currentPhase;
            game.id = data.id;
        }
    );
}

function initGame(gameState) {
    console.log(gameState);
    for (i = 0; i < gameState.players.length; i++) {
        addPlayer(gameState.players[i].id, gameState.players[i].name);
    }
    console.log("currentPlayer " + gameState.currentPlayer);
    console.log("me " + localStorage.getItem("userID"));
    drawMap(gameState.map.territories);
    game.territories = gameState.map.territories;
    setPlayerActive(gameState.currentPlayer);
    game.currentPlayer = gameState.currentPlayer;
    game.currentPhase = gameState.currentPhase;
    game.id = gameState.id;
    if (gameState.currentPhase == 'setup') {
        $("#setupText").show();
    } else if (gameState.currentPlayer == localStorage.getItem("userID")) {
    	console.log("CURRENT PHASE " + gameState.currentPhase);
        if (gameState.currentPhase == 'draft') {
            startDraft(gameState.currentPlayer, gameState.id);
        } else if (gameState.currentPhase == 'attack') {
            startAttack(gameState.currentPlayer, gameState.id);
        } else if (gameState.currentPhase == 'fortify') {
            startFortify(gameState.currentPlayer, gameState.id);
        }
    } else {
        $('#waitingText').show();
    }
}

function sendEvent(body) {
    body.gameid = game.id;
    $.post(
        "/game/events",
        body
    );
}

function endPhase() {
    var body = {};
    body.type = "PhaseEnd";
    sendEvent(body);
}

function addPlayer(playerID, playerName) {
    document.getElementById('players').innerHTML += '<li class="list-group-item" id="player_' + playerID + '">' +
        playerName + '<div id="player_color_' + playerID + '" class="colorbox ' + colors[currentPlayers] + '"></div></li>';
    currentPlayers++;
}

function removePlayer(playerID, playerName) {
    $('#player_' + playerID).remove();
}

function drawMap(territories) {
    for (i = 0; i < territories.length; i++) {
        setTroops(territories[i].id, territories[i].troops)
        setColor(territories[i].id, territories[i].player);
    }
}

function updateMap() {
    $.get(
        "/game/" + game.id + "/territories",
        function(data) {
            console.log(data);
            drawMap(data);
        }
    );
}

function setPlayerActive(playerID, gameID) {
    $('.active').each(function(i, obj) {
        $(this).removeClass("active");
    });
    $('#player_' + playerID).addClass('active');
}

function startAttack(playerID, gameid) {
    $('#waitingText').hide();
    $('#draftText').hide();
    $('#draftpill').removeClass("active").addClass('disabled');
    $('#attackpill').removeClass("disabled").addClass('active');
    $('#attackText').show();
}

function startFortify(playerID, gameid) {
    $('#waitingText').hide();
    $('#attackText').hide();
    $('#attackpill').removeClass("active").addClass('disabled');
    $('#fortifypill').removeClass("disabled").addClass('active');
    $('#fortifyText').show();
}

socket.on('Game Starting', function(event) {
    updateMap();
    setPlayerActive(event.currentPlayer);
    $("#setupText").hide();
    if (Number(localStorage.getItem("userID")) == event.currentPlayer) {
        startDraft(event.currentPlayer, event.game);
    } else {
        $("#waitingText").show();
    }
}).on('Player Joined', function(event) {
    updateGame();
    updateMap();
    addPlayer(event.id, event.name);
}).on('Attack Phase Start', function(event) {
    updateGame();
    updateMap();
    if (event.player == localStorage.getItem("userID")) {
        startAttack(event.player, event.game);
    } else {
        $("#waitingText").show();
    }
}).on('Fortify Phase Start', function(event) {
    updateGame();
    updateMap();
    if (event.player == localStorage.getItem("userID")) {
        startFortify(event.player, event.game);
    } else {
        $("#waitingText").show();
    }
}).on('End Turn', function(event) {
    updateGame();
    updateMap();
    if (event.player == localStorage.getItem("userID")) {
        $('#fortifypill').removeClass("active").addClass('disabled');
        $('#fortifyText').hide();
        $("#waitingText").show();
    } else {
        $("#waitingText").show();
    }
}).on('Start Turn', function(event) {
    updateGame();
    updateMap();
    setPlayerActive(event.player);
    if (event.player == localStorage.getItem("userID")) {
        startDraft(event.currentPlayer, event.game);
    } else {
        $("#waitingText").show();
    }
}).on('Draft Move', function(event) {
    updateGame();
    updateMap();
}).on('Battle Result', function(event) {
    updateGame();
    updateMap();
}).on('Fortify Move', function(event) {
    updateGame();
    updateMap();
});


jQuery(document).ready(function() {
    //Repositioning the texts according to the image size
    $(this).scrollTop(0);
    var height = (675 / $("#planetmap").height());
    var width = (1200 / $("#planetmap").width());
    var size = parseInt($(".text").css('font-size'));
    var text_array = $('.text');
    for (var i = 0; i < text_array.length; i++) {
        $(text_array[i]).css("position", "absolute");
        $(text_array[i]).css("color", "white");
        $(text_array[i]).css({
            top: ((($(text_array[i]).position().top) / height) + 5),
            left: ((($(text_array[i]).position().left) / width) + 20)
        });
        $(".text").css('font-size', size / height);
    }
    //Getting the game state
    $.get(
        "/game/" + $('#gameid').val() + "/state",
        function(data) {
            if (data == false) {
                alert("This game does not exist, redirecting you to home.");
                window.location = "/";
            }
            console.log(data);
            initGame(data);
        }
    );

    // This button will increment the value
    $('.qtyplus').click(function(e) {
        // Stop acting like a button
        e.preventDefault();
        // Get the field name
        fieldName = $(this).attr('field');
        // Get its current value
        if (game.currentPhase == "draft") {
            currentVal = parseInt($('#deployValue').val());
            // If is not undefined
            if (!isNaN(currentVal) && currentVal < upLimit) {
                // Increment
                $('#deployValue').val(currentVal + 1);
            }
        } else if (game.currentPhase == "fortify") {
            currentVal = parseInt($('#reinforceValue').val());
            if (!isNaN(currentVal) && currentVal < upLimit) {
                // Increment
                $('#reinforceValue').val(currentVal + 1);
            }
        } else if (game.currentPhase == "attack") {
            currentVal = parseInt($('#attackValue').val());
            if (!isNaN(currentVal) && currentVal < upLimit) {
                // Increment
                $('#attackValue').val(currentVal + 1);
            }
        }

    });
    // This button will decrement the value till 0
    $(".qtyminus").click(function(e) {
        // Stop acting like a button
        e.preventDefault();
        // Get the field name
        fieldName = $(this).attr('field');
        // Get its current value
        if (game.currentPhase == "draft") {
            currentVal = parseInt($('#deployValue').val());
            // If is not undefined
            if (!isNaN(currentVal) && currentVal > 0) {
                // Increment
                $('#deployValue').val(currentVal - 1);
            }
        } else if (game.currentPhase == "fortify") {
            currentVal = parseInt($('#reinforceValue').val());
            if (!isNaN(currentVal) && currentVal > 0) {
                // Increment
                $('#reinforceValue').val(currentVal - 1);
            }
        } else if (game.currentPhase == "attack") {
            currentVal = parseInt($('#attackValue').val());
            if (!isNaN(currentVal) && currentVal > 0) {
                // Increment
                $('#attackValue').val(currentVal - 1);
            }
        }
    });
    document.getElementById('sendButton').onclick = function() {
        socket.emit('chat message', $('#player_' + localStorage.getItem("userID")).text() + ': ' + $('#text').val());
        $('#text').val('');
        return false;
    };

    $('#setupText').hide().removeClass('hidden');
    $('#draftText').hide().removeClass('hidden');
    $('#attackText').hide().removeClass('hidden');
    $('#fortifyText').hide().removeClass('hidden');
    $('#waitingText').hide().removeClass('hidden');
    $('#fortifyTextAdditional').hide().removeClass('hidden');

});