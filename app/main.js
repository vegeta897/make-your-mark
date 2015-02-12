'use strict';
Application.Controllers.controller('Main', function($scope,$timeout,Game,World,Canvas,FireService) {

    $scope.version = 0.003; $scope.versionName = 'Mark attack';
    FireService.onceGlobal('version',function(ver) {
        if($scope.version < ver) {
            $scope.needUpdate = true;
        } else {
            FireService.onGlobal('version',function(newVer){
                $scope.needUpdate = newVer > $scope.version;
            });
        }
    });
    
    $scope.game = Game.game;
    $scope.world = World.world;
    $scope.cursor = Canvas.cursor;
    
});