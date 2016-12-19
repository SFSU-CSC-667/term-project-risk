this.Map = function(gameid) {
    this.territories = [{
		id: 1,
		name: "Alaska",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [2, 4, 32]
	}, {
		id: 2,
		name: "North West Territory",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [1, 4, 5, 3]
	}, {
		id: 3,
		name: "Greenland",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [2, 5, 6, 22]
	}, {
		id: 4,
		name: "Alberta",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [1, 2, 5, 7]
	}, {
		id: 5,
		name: "Ontario",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [2, 4, 7, 8, 6, 3]
	}, {
		id: 6,
		name: "Quebec",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [3, 5, 8]
	}, {
		id: 7,
		name: "Western United States",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [4, 5, 8, 9]
	}, {
		id: 8,
		name: "Eastern United States",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [5, 6, 7, 9]
	}, {
		id: 9,
		name: "Central America",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [7, 8, 10]
	}, {
		id: 10,
		name: "Venezuela",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [9, 11, 13]
	}, {
		id: 11,
		name: "Peru",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [10, 12, 13]
	}, {
		id: 12,
		name: "Argentina",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [11, 13]
	}, {
		id: 13,
		name: "Brazil",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [10, 11, 12]
	}, {
		id: 14,
		name: "North Africa",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [13, 15, 18, 19, 20, 25]
	}, {
		id: 15,
		name: "Congo",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [14, 16, 18]
	}, {
		id: 16,
		name: "South Africa",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [15, 17, 18]
	}, {
		id: 17,
		name: "Madagascar",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [16, 18]
	}, {
		id: 18,
		name: "East Africa",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [14, 15, 16, 17, 19, 27]
	}, {
		id: 19,
		name: "Egypt",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [14, 18, 25, 27]
	}, {
		id: 20,
		name: "Western Europe",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [14, 21, 24, 25]
	}, {
		id: 21,
		name: "Great Britain",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [20, 22, 23, 24]
	}, {
		id: 22,
		name: "Iceland",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [3, 21, 23]
	}, {
		id: 23,
		name: "Scandinavia",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [21, 22, 24, 26]
	}, {
		id: 24,
		name: "Northern Europe",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [20, 21, 23, 25, 26]
	}, {
		id: 25,
		name: "Southern Europe",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [14, 19, 20, 24, 26, 27]
	}, {
		id: 26,
		name: "Ukraine",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [23, 24, 25, 27, 28, 29]
	}, {
		id: 27,
		name: "Middle East",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [18, 19, 25, 26, 28, 37]
	}, {
		id: 28,
		name: "Afghanistan",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [26, 27, 29, 36, 37]
	}, {
		id: 29,
		name: "Ural",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [26, 28, 30, 36]
	}, {
		id: 30,
		name: "Siberia",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [29, 31, 33, 35, 36]
	}, {
		id: 31,
		name: "Yakutsk",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [30, 32, 33]
	}, {
		id: 32,
		name: "Kamchatka",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [1, 31, 33, 34, 35]
	}, {
		id: 33,
		name: "Irkutsk",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [30, 31, 32, 35]
	}, {
		id: 34,
		name: "Japan",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [32, 25]
	}, {
		id: 35,
		name: "Mongolia",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [30, 32, 33, 34, 36]
	}, {
		id: 36,
		name: "China",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [28, 29, 30, 35, 37, 38]
	}, {
		id: 37,
		name: "India",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [27, 28, 36, 38]
	}, {
		id: 38,
		name: "Siam",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [36, 37, 39]
	}, {
		id: 39,
		name: "Indonesia",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [38, 40, 42]
	}, {
		id: 40,
		name: "New Guinea",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [39, 41, 42]
	}, {
		id: 41,
		name: "Eastern Australia",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [40, 42]
	}, {
		id: 42,
		name: "Western Australia",
		troops: 0,
		player: 0,
		game: gameid, 
		ajacent: [39, 40, 41]
	}];
    this.isAjacent = function(a, b) {
        return this.territories[a-1].ajacent.indexOf(b) >= 0 ? true : false;
    };
    this.setPlayer = function(playerID, territoryID) {
        this.territories[territoryID-1].player = playerID;
    };
    this.addTroops = function(territoryID, amount) {
    	//This also works with negatives!
    	this.territories[territoryID-1].troops += parseInt(amount);

    }
    this.territoriesOwned = function(playerID) {
    	var amount = 0;
    	for (var i = 0; i < this.territories.length; i++) {
		    if (this.territories[i].player == playerID) amount++;
		}
    	return amount;
    }
};