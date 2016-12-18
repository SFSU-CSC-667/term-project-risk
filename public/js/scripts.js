var socket = io();
var game = {};
game.players = {};
var colors = {};
colors[0] = "red";
colors[1] = "blue";
colors[2] = "yellow";
colors[3] = "green";
var currentPlayers = 0;
socket.on('chat message', function(msg) {
    $('#messages').append($('<li>').text(msg));
});

function territoryClicked(name) {
    console.log(name);
    if (game.currentPhase == "draft") {
    	//Decrease draft-amount span accordingly when drafting
    	//only let me deploy/draft on territories I control
    	//only allow me to draft when I have draft-amount > 0
    	 //while $('#draft-amount').text() > 0
    	//Don't let me reduce my troop count more than prexisting
    	//use game.territories to get information
        deploy(name);
    } else if (game.currentPhase == "attack") {
        //attack model
    } else if (game.currentPhase == "reinforce") {
    	//Have them click again
    	//Get their second click and call the next function on that second selection?
		//Click a source territory and a target territory
		//Enter an amount of troops to transfer to the new territory
		//THERE MUST BE AT LEAST ONE TROOP REMAINING IN THE SOURCE TERRITORY
        reinforce(name);
    }
}


function deploy(name) {
    //Assigns the current value to the input, or zero if it isn't set
    document.getElementById('deployValue').value = document.getElementById(name + "Text").textContent == "" ?
        0 : document.getElementById(name + "Text").textContent;
    var modal = document.getElementById('deployModal');
    modal.style.display = "block";
    ///Hides when you click Deploy button
    document.getElementById('deploy').onclick = function() {
            document.getElementById('deployModal').style.display = "none";
            console.log("Deployed " + document.getElementById('deployValue').value + " in " + name);
            document.getElementById(name + 'Text').textContent = document.getElementById('deployValue').value;
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

function reinforce(name) {
    var troopsRemaining = 3;
    //Assigns the current value to the input, or zero if it isn't set
    document.getElementById('reinforceValue').value = troopsRemaining == 0 ?
        0 : troopsRemaining;
    var modal = document.getElementById('reinforceModal');
    modal.style.display = "block";
    ///Hides when you click Deploy button
    document.getElementById('reinforce').onclick = function() {
            document.getElementById('reinforceModal').style.display = "none";
            console.log("Reinforced " + document.getElementById('reinforceValue').value + " in " + name);
            document.getElementById(name + 'Text').textContent = parseInt(document.getElementById(name + 'Text').textContent) + parseInt(document.getElementById('reinforceValue').value);
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
}

function setColor(territoryID, playerID) {
    var color = $('#player_color_' + playerID).attr('class').split(' ')[1];
    $('#' + document.getElementById(territoryID).alt + 'Text').css("color", color);
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

function initDraft(playerID, gameid) {
    var body = {};
    body.playerid = playerID;
    body.gameid = gameid;
    game.draft = 0;
    $.post(
        "/game/draft",
        body,
        draftText
    );
    //enable tab, show text, calculate draft amount, do draft, end phase, go to attack

}

function initGame(gameState) {
    for (i = 0; i < gameState.players.length; i++) {
        addPlayer(gameState.players[i].id, gameState.players[i].name);
    }
    drawMap(gameState.territories.territories);
    setPlayerActive(gameState.currentPlayer);
    game.currentPhase = gameState.currentPhase;
    game.id = gameState.id;
    if (gameState.currentPhase == 'setup') {
        $("#setupText").show();
    } else if (gameState.currentPlayer == localStorage.getItem("userID")) {
        if (gameState.currentPhase == 'draft') {
            initDraft(gameState.currentPlayer, gameState.id);
        } else if (gameState.currentPhase == 'attack') {
            startAttack(gameState.currentPlayer, gameState.id);
        } else if (gameState.currentPhase == 'fortify') {
            //Do fortify
            $('#attackText').hide();
            $('#fortifyText').show();
        }
    } else {
        $('#waitingText').show();
    }
}

function endPhase() {
	var body = {};
	body.gameid = game.id;
	body.type = "PhaseEnd";
	$.post(
        "/game/events",
        body
    );
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
            drawMap(data.territories);
        }
    );
}

function setPlayerActive(playerID, gameID) {
    $('.active').each(function(i, obj) {
        $(this).removeClass("active");
    });
    $('#player_' + playerID).addClass('active');
}

function startAttack(playerID) {
    $('#waitingText').hide();
    $('#draftText').hide();
    $('#draftpill').removeClass("active").addClass('disabled');
    $('#attackpill').removeClass("disabled").addClass('active');
    $('#attackText').show();
}

socket.on('Game Starting', function(event) {
    updateMap();
    setPlayerActive(event.currentPlayer);
    $("#setupText").hide();
    if (Number(localStorage.getItem("userID")) == event.currentPlayer) {
        startDraft(event.currentPlayer);
    } else {
        $("#waitingText").show();
    }
}).on('Attack Phase Start', function(event) {
	console.log(event);
	console.log(localStorage.getItem("userID"));
    if (event.player == localStorage.getItem("userID")) {
        startAttack(event.player, event.game);
    } else {
        $("#waitingText").show();
    }
});


jQuery(document).ready(function() {
    //Repositioning the texts according to the image size
    $(this).scrollTop(0);
    var height = (675 / $("#planetmap").height());
    var width = (1200 / $("#planetmap").width());
    console.log($("#planetmap").height() + " " + $("#planetmap").offset().top + " " + $("#indonesiaText").offset().top);
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
        currentVal = parseInt($('input[name=' + fieldName + ']').val());
        // If is not undefined
        if (!isNaN(currentVal)) {
            // Increment
            $('input[name=' + fieldName + ']').val(currentVal + 1);
        } else {
            // Otherwise put a 0 there
            $('input[name=' + fieldName + ']').val(0);
        }
    });
    // This button will decrement the value till 0
    $(".qtyminus").click(function(e) {
        // Stop acting like a button
        e.preventDefault();
        // Get the field name
        fieldName = $(this).attr('field');
        // Get its current value
        currentVal = parseInt($('input[name=' + fieldName + ']').val());
        // If it isn't undefined or its greater than 0
        if (!isNaN(currentVal) && currentVal > 0) {
            // Decrement one
            $('input[name=' + fieldName + ']').val(currentVal - 1);
        } else {
            // Otherwise put a 0 there
            $('input[name=' + fieldName + ']').val(0);
        }
    });
    document.getElementById('sendButton').onclick = function() {
        socket.emit('chat message', $('#text').val());
        $('#text').val('');
        return false;
    };

    $('#setupText').hide().removeClass('hidden');
    $('#draftText').hide().removeClass('hidden');
    $('#attackText').hide().removeClass('hidden');
    $('#fortifyText').hide().removeClass('hidden');
    $('#waitingText').hide().removeClass('hidden');

});