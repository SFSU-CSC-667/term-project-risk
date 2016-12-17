var socket = io();
game = {};
game.players = {};
game.id = 1;
game.players[0]= "red";
game.players[1]= "blue";
game.players[2]= "yellow";
game.players[3]= "green";
socket.on('chat message', function(msg){
	$('#messages').append($('<li>').text(msg));
});

function territoryClicked(name) {
	console.log(name);
	modal(name);
	document.getElementById('deploy').onclick = function() { 
		document.getElementById('myModal').style.display = "none";
		console.log("Deployed "+document.getElementById('value').value+" in " + name);
		document.getElementById(name + 'Text').textContent = document.getElementById('value').value;
	}
}


function modal(name) {
	//Assigns the current value to the input, or zero if it isn't set
	document.getElementById('value').value = document.getElementById(name + "Text").textContent == "" ? 
		0 : document.getElementById(name + "Text").textContent;
	var modal = document.getElementById('myModal');
	modal.style.display = "block";
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

function setColor(territoryID, playerID) {
	$('#' + document.getElementById(territoryID).alt + 'Text').css("color", game.players[playerID]);
}

function setTroops(territoryID, value) {
	var item = document.getElementById(document.getElementById(territoryID).alt + 'Text');
	item.textContent = value;
}


jQuery(document).ready(function(){
     //Repositioning the texts according to the image size
    $(this).scrollTop(0);
    var height = (675/$("#planetmap").height());
    var width = (1200/$("#planetmap").width());
    console.log($("#planetmap").height()+" "+$("#planetmap").offset().top+" "+$("#indonesiaText").offset().top);
    var size = parseInt($(".text").css('font-size'));
    var text_array = $('.text');
    for(var i=0;i<text_array.length;i++) {
        $(text_array[i]).css("position", "absolute");
        $(text_array[i]).css("color", "white");
        $(text_array[i]).css({top: ((($(text_array[i]).position().top)/height)+5), left: ((($(text_array[i]).position().left)/width)+20)});
        $(".text").css('font-size', size/height);
    }
    // This button will increment the value
    $('.qtyplus').click(function(e){
        // Stop acting like a button
        e.preventDefault();
        // Get the field name
        fieldName = $(this).attr('field');
        // Get its current value
        currentVal = parseInt($('input[name='+fieldName+']').val());
        // If is not undefined
        if (!isNaN(currentVal)) {
            // Increment
            $('input[name='+fieldName+']').val(currentVal + 1);
        } else {
            // Otherwise put a 0 there
            $('input[name='+fieldName+']').val(0);
        }
    });
    // This button will decrement the value till 0
    $(".qtyminus").click(function(e) {
        // Stop acting like a button
        e.preventDefault();
        // Get the field name
        fieldName = $(this).attr('field');
        // Get its current value
        currentVal = parseInt($('input[name='+fieldName+']').val());
        // If it isn't undefined or its greater than 0
        if (!isNaN(currentVal) && currentVal > 0) {
            // Decrement one
            $('input[name='+fieldName+']').val(currentVal - 1);
        } else {
            // Otherwise put a 0 there
            $('input[name='+fieldName+']').val(0);
        }
    });
    $.get(
	    "/game/"+game.id+"/territories",
	    function(data) {
	    	console.log(data);
	    	for (i = 0; i < data.territories.territories.length; i++) {
	    		setTroops(data.territories.territories[i].id, data.territories.territories[i].troops)
	    		setColor(data.territories.territories[i].id, data.territories.territories[i].player);
			}
	       game.territories = data.territories.territories;
	    }
	);
    document.getElementById('sendButton').onclick = function() {
		socket.emit('chat message', $('#text').val());
		$('#text').val('');
		return false;
	};

});
