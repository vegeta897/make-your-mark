'use strict';
Application.Controllers.controller('Main', function($scope,$timeout,Game,World,Players,Controls,FireService) {

    $scope.version = 0.02; $scope.versionName = 'Mark of the Unicorn';
    FireService.onceGlobal('version',function(ver) {
        if($scope.version < ver) {
            $scope.needUpdate = true;
            $timeout(function(){});
        } else {
            Game.init();
            FireService.onGlobal('version',function(newVer){
                $scope.needUpdate = newVer > $scope.version;
            });
        }
    });
    
    $scope.game = Game.game;
    $scope.world = World.world;
    $scope.cursor = Controls.cursor;
    $scope.player = Players.player;
    
    $scope.clearPlayerData = Players.clearPlayerData;
    $scope.clearMapData = World.clearMapData;
});