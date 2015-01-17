'use strict';
Application.Controllers.controller('Main', function($scope,$timeout,Game,Canvas) {

    $scope.version = 0.001; $scope.versionName = 'Mark Attack';
    console.log('Main controller initialized!');
    
    $scope.game = Game.game;
    $scope.cursor = Canvas.cursor;
    
});