function checkLoginState() {
    FB.getLoginStatus(function(response) {
        statusChangeCallback(response);
    });
}

function statusChangeCallback(response) {
    console.log('statusChangeCallback');
    console.log(response);
    if (response.status === 'connected') {
        localStorage.setItem("userID", parseInt(response.authResponse.userID, 10));
        console.log("Set auth " + parseInt(response.authResponse.userID, 10));
        $('#notLoggedIn').hide();
        $('#loggedIn').show();
    } else {
        $('#notLoggedIn').show();
    }
}

window.fbAsyncInit = function() {
    FB.init({
        appId: '1270139143069695',
        cookie: true, // enable cookies to allow the server to access 
        // the session
        xfbml: true, 
        version: 'v2.8'
    });

    checkLoginState();
};

// Load the SDK asynchronously
(function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s);
    js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));