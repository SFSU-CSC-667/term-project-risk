$(function() {
    $('#notLoggedIn').hide().removeClass('hide');
    $('#loggedIn').hide().removeClass('hide');
});

function triggerLogin() {
    FB.login(function(response) {
        if (response.authResponse) {
            $('#notLoggedIn').hide();
            $('#loggedIn').show();
        } else {
            console.log('User cancelled login or did not fully authorize.');
        }
    });
}

function createGame() {
    var event = {};
    event.type = "CreateGame";
    $.post(
        "/game/events",
        event,
        createPlayer
    );
}

function createPlayer(data) {
    FB.api('/me', function(response) {
        var event = {};
        event.gameid = data.id;
        event.player = {};
        event.player.name = response.name;
        event.player.id = response.id;
        event.player.game = data.id;
        event.type = "PlayerJoined";
        $.post(
            "/game/events",
            event,
            function(data) {
                window.location = "/game/" + event.gameid;
            }
        );
    });
}

function joinGame() {
    var data = {};
    data.id = $('#gameid').val();
    createPlayer(data);
}