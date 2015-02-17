'use strict';
Application.Controllers.controller('Main', function($scope,$timeout,Game,World,Canvas,FireService) {

    $scope.version = 0.005; $scope.versionName = 'Mark Attack';
    FireService.onceGlobal('version',function(ver) {
        if($scope.version < ver) {
            $scope.needUpdate = true;
        } else {
            Game.init();
            FireService.onGlobal('version',function(newVer){
                $scope.needUpdate = newVer > $scope.version;
            });
        }
    });
    
    $scope.game = Game.game;
    $scope.world = World.world;
    $scope.cursor = Canvas.cursor;
    
});