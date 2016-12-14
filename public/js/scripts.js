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


document.addEventListener("DOMContentLoaded", function(event) {
});
	
