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

}]);

ngApp.controller('CtrlFriend', ['$scope', '$location', function($scope, $location) {

}]);

ngApp.controller('CtrlRegister', ['$scope', '$location', function($scope, $location) {
    // Stores to variables
    //var tempTableUsers = new Firebase('https://duoandchill-db.firebaseio.com/users');
    $scope.verifySummoner = function() {
        var verified = {'verified' : 'pending'};
        var summonerName = $scope.ngInputSummonerName;
        var checkSummoner = {summonerName : verified};
        debugMsg('sent verify request');
        fbTableVerify.child(summonerName).set(checkSummoner);
    }


    // Creates the user object
    $scope.registerUser = function() {
        var hashPass = CryptoJS.SHA3($scope.ngInputPassword).toString();

        var userObject = {
            'userName' : $scope.ngInputUsername,
            'summonerName' : $scope.ngInputSummonerName,
            'summonerId' : '1111111',
            'summonerIcon' : '121212',
            'emailAddress' : $scope.ngInputEmail,
            'password' : hashPass
        };

        console.log(userObject);
        // Creates a new child with an id of the username, and the results are the userObject
        fbTableUsers.child($scope.ngInputUsername).set(userObject);
        debugMsg('User object successfully created.')
    }
}]);

ngApp.controller('CtrlLogin', ['$scope', '$location', function($scope, $location) {
    $scope.loginError = false;
    $scope.checkLoggedIn;
    $scope.login = function () {
        var hashPass = CryptoJS.SHA3($scope.ngInputPassword).toString();
        var getUser = fbTableUsers.child($scope.ngInputUsername).once('value', function(rawUserObject) {
            userObject = rawUserObject.val();
            if (userObject == null) {
                $scope.loginError = true;
                debugMsg('user does not exist');
            }
            else { // checks password
                if (hashPass == userObject.password) {
                    $scope.loginError = false;
                    $.cookie('sessionLoggedIn', true, { expires: 14, path: '/' });
                    $.cookie('sessionUsername', userObject.username, { expires: 14, path: '/' });
                    $.cookie('sessionSummonerId', userObject.summonerId, { expires: 14, path: '/' });
                    $scope.checkLoggedIn = true;
                    location.reload()
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
