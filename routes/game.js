var express = require('express');
var world = require("./map.js");
var router = express.Router();

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

/* This file will contain all of the backend game logic */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Game Home Page' });
});

router.get('/territories', function(req, res, next) {
	res.send(map);
});

module.exports = router;
