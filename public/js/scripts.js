function territoryClicked(name) {
	console.log(name);
	modal();
	document.getElementById('deploy').onclick = function() { 
		document.getElementById('myModal').style.display = "none";
		console.log("Deployed "+document.getElementById('value').value+" in " + name);
		document.getElementById(name + 'Text').textContent = document.getElementById('value').value;
		document.getElementById('value').value = 0;	
	}
}


function modal() {
	var currentVal;
	var modal = document.getElementById('myModal');
	modal.style.display = "block";
	document.getElementsByClassName("close")[0].onclick = function() { 
		modal.style.display = "none";
		document.getElementById('value').value = 0;	
	}
	window.onclick = function(event) {
	    if (event.target == modal) {
	        modal.style.display = "none";
	        //document.getElementById('value').value = 0;	
	    }
	}
}


document.addEventListener("DOMContentLoaded", function(event) {
});
	
