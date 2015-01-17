'use strict';
Application.Controllers.controller('Main', function($scope,$timeout,Game) {

    $scope.version = 0.001; $scope.versionName = 'Mark Attack';
    console.log('Main controller initialized!');
    
    $scope.game = Game.game;
    
});