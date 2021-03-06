// Debug Stuff
var DEBUG_MODE = true;
var debugVars = {};

var debugMsg = function(msg) {
    if (DEBUG_MODE)
      console.log('!!! DEBUG !!! ' + msg);
};

var loggedIn;

//  Create Angular App
var ngApp = angular.module('ngApp', ['ngRoute']);

var fbTableUsers = new Firebase('https://duoandchill-db.firebaseio.com/users');
var fbTableVerify = new Firebase('https://duoandchill-db.firebaseio.com/verified');
var fbTableGeo = new Firebase('https://duoandchill-db.firebaseio.com/geo');


// Stores route information
ngApp.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'views/home.html',
            controller: 'CtrlHome'
        })
        .when('/friend/', {
            templateUrl: 'views/friend.html',
            controller: 'CtrlFriend'
        })
        .when('/register/', {
            templateUrl: 'views/register.html',
            controller: 'CtrlRegister'
        })
        .when('/login/', {
            templateUrl: 'views/login.html',
            controller: 'CtrlLogin'
        })
        .when('/logout/', {
            templateUrl: 'views/logout.html',
            controller: 'CtrlLogout'
        })
        .when('/profile/', {
            templateUrl: 'views/profile.html',
            controller: 'CtrlProfile'
        })
        .when('/about/', {
            templateUrl: 'views/about.html',
            controller: 'CtrlAbout'
        })
});



// Header (Nav Bar)
ngApp.controller('CtrlNav', ['$scope', '$location', function($scope, $location) {
    $scope.loggedIn;
    if($.cookie('sessionLoggedIn'))
        $scope.loggedIn = true;
    else
        $scope.loggedIn = false;
    $scope.isActive = function (viewLocation) {
        var active = (viewLocation === $location.path());
        return active;
    };
}]);

ngApp.controller('CtrlHome', ['$scope', '$location', function($scope, $location) {
    if($.cookie('sessionLoggedIn')) {
        $location.path( "/profile" );
        location.reload();
    }
}]);

ngApp.controller('CtrlFriend', ['$scope', '$location', function($scope, $location) {
    $scope.nearbyUsers;
    var usersList;
    $scope.startSearch = function() {
        // Grabs userlist
        fbTableUsers.on("value", function(snapshot) {
            usersList = snapshot.val();
            console.log("stores the user list: " + usersList);
        });

        // Resets nearbyUsers
        $scope.nearbyUsers = [];
        var userLat = $.cookie('sessionLat');
        var userLong = $.cookie('sessionLong');


        // Displays loading screen, hides button
        $scope.searchInProgress = true;

        // Pulls from the list of active summo
        var username = $.cookie('sessionUsername');

        fbTableGeo.on("value", function(snapshot) {
            var geoList = snapshot.val();
            console.log(geoList);
            for (var key in geoList) {
                if (geoList.hasOwnProperty(key) && key != username) {
                    var geoObject = geoList[key];
                    distanceBetween(userLat, userLong, geoObject.lat, geoObject.long, key);
                }
            }
            console.log('end read');
        }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
    }

    var distanceBetween = function(lat1, long1, lat2, long2, key) {
        console.log('distance between is running: ' + key);
        var input = [lat1, long1, lat2, long2, "mile"];
        var test = Algorithmia.client("simWnDmQFImOkx4R+tUS3kVkKJC1")
            .algo("algo://Geo/LatLongDistance/0.1.0")
            .pipe(input)
            .then(function(output) {
                if (output.result < 1.5)
                    $scope.nearbyUsers.push(usersList[key]);
                else
                    console.log('too far');
                //$scope.nearbyUsers = shuffle($scope.nearbyUsers)
                $scope.$apply();
            });
    }
}]);

ngApp.controller('CtrlRegister', ['$scope', '$location', function($scope, $location) {
    // Stores to variables
    //var tempTableUsers = new Firebase('https://duoandchill-db.firebaseio.com/users');
    $scope.summonerId;
    $scope.summonerIcon;

    $scope.verifySummoner = function() {
        console.log('verify is now running');
        fbTableVerify.child($scope.ngInputSummonerName).remove();
        $scope.verifyStatus = 'pending';
        var summonerName = $scope.ngInputSummonerName;
        var checkSummoner = {'verified' : 'pending'};
        debugMsg('sent verify request');
        fbTableVerify.child(summonerName).set(checkSummoner);

        // code to check for verification
        var checkTable = new Firebase('https://duoandchill-db.firebaseio.com/verified/');
        checkTable.on('child_changed', function(snapshot) {

            if (snapshot.val().verified && snapshot.val().summonerId && snapshot.val().summonerIcon) {
                if (snapshot.val().verified == 'verified') {
                    $scope.summonerId = snapshot.val().summonerId;
                    $scope.summonerIcon = snapshot.val().summonerIcon;
                    $scope.verifyStatus = 'success';

                } else {
                    $scope.verifyStatus = 'failed';
                }

            }

            if (snapshot.val().verified == 'failed')
                $scope.verifyStatus = 'failed';
            $scope.$apply();
            console.log(snapshot.val());
        })

    }


    // Creates the user object
    $scope.registerUser = function() {
        var hashPass = CryptoJS.SHA3($scope.ngInputPassword).toString();

        var userObject = {
            'userName' : $scope.ngInputUsername,
            'summonerName' : $scope.ngInputSummonerName,
            'summonerId' : $scope.summonerId,
            'summonerIcon' : $scope.summonerIcon,
            'emailAddress' : $scope.ngInputEmail,
            'password' : hashPass,
            'bio' : ''
        };

        console.log(userObject);
        // Creates a new child with an id of the username, and the results are the userObject
        fbTableUsers.child($scope.ngInputUsername).set(userObject);
        fbTableVerify.child($scope.ngInputSummonerName).remove();
        debugMsg('User object successfully created.');
        $location.path( "/login" );
        location.reload();

    }
}]);

ngApp.controller('CtrlLogin', ['$scope', '$location', function($scope, $location) {
    $scope.loginError = false;
    $scope.checkLoggedIn;
    $scope.login = function () {
        var hashPass = CryptoJS.SHA3($scope.ngInputPassword).toString();
        fbTableUsers.child($scope.ngInputUsername).once('value', function(rawUserObject) {
            userObject = rawUserObject.val();
            if (userObject == null) {
                $scope.loginError = true;
                debugMsg('user does not exist');
            }
            else { // checks password
                if (hashPass == userObject.password) {
                    $scope.loginError = false;
                    $.cookie('sessionLoggedIn', true, { expires: 14, path: '/' });
                    $.cookie('sessionUsername', userObject.userName, { expires: 14, path: '/' });
                    $.cookie('sessionSummonerId', userObject.summonerId, { expires: 14, path: '/' });
                    $scope.checkLoggedIn = true;
                    location.reload()
                    $location.path( "/friend" );
                    debugMsg('password matches, log user in')
                }
                else {
                    debugMsg('password does not match - throw error');
                    $scope.loginError = true;
                    $scope.ngInputPassword = '';
                }
            }
            $scope.$apply();

        });
    }
}]);

ngApp.controller('CtrlLogout', ['$scope', '$location', function($scope, $location) {
    $.removeCookie('sessionLoggedIn', { path: '/' });
    $.removeCookie('sessionUsername', { path: '/' });
    $.removeCookie('sessionSummonerId', { path: '/' });
    $location.path( "/login" );
    location.reload()
}]);

ngApp.controller('CtrlProfile', ['$scope', '$location', function($scope, $location) {
    var userName = $.cookie('sessionUsername');
    $scope.userProfile;
    $scope.storeBio;
    fbTableUsers.child(userName).once('value', function(rawUserObject) {
        $scope.userProfile = rawUserObject.val();
        console.log(rawUserObject.val().bio);
        $scope.storeBio = rawUserObject.val().bio;
        $scope.$apply();
    });

    $scope.updateBio = function() {
        var tempBio = $scope.storeBio;
        fbTableUsers.child(userName).once('value', function(rawUserObject) {
            var fbEditBio = new Firebase('https://duoandchill-db.firebaseio.com/users/' + $.cookie('sessionUsername'));
            fbEditBio.child('bio').set(tempBio);
            $location.path( "/profile" );
            location.reload();
        });
    }
}]);

ngApp.controller('CtrlAbout', ['$scope', '$location', function($scope, $location) {
    // This controller is intentionally left blank.
}]);

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}
