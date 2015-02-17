'use strict';
Application.Directives.directive('controls',function() {
    return {
        restrict: 'E',
        templateUrl: 'app/controls/controls.html',
        replace: true,
        scope: {},
        controller: function($scope,Controls,Interface,Game,Player,Canvas,Util) {
            $scope.game = Game.game;
            $scope.selectThing = Interface.controlsSelectThing;
            $scope.thingIsSelected = function(thing) { return Game.game.selected && Game.game.selected.guid == thing.guid; };
            $scope.onThing = Interface.controlsOnThing;
            $scope.offThing = Interface.controlsOffThing;
            $scope.isOnThing = function(thing) { return Canvas.getCursor().hover.hasOwnProperty(thing.guid); };
            $scope.takeThing = Player.takeThing;
            $scope.dropThing = Player.dropThing;
            $scope.thingIsCarried = Player.thingIsCarried;
            $scope.thingAction = Player.thingAction;
            $scope.isInReach = function(thing) {
                return Player.thingIsCarried(thing) || Util.thingInArray(thing,Player.player.vicinity);
            };
            
            window.addEventListener('keydown',function(e) { return Controls.onKey(e, e.keyCode, true); },false);
            window.addEventListener('keyup',function(e) { return Controls.onKey(e, e.keyCode, false); },false);
            jQuery('#highCanvas').mousedown(function(e) { return Controls.onMouse(e, e.which, true); });
            jQuery(window).mouseup(function(e) { return Controls.onMouse(e, e.which, false); });
            // TODO: Sometimes mouse down event handler doesn't initialize
        }
    }
});

Application.Services.factory('Controls',function(Interface,Canvas) {
    
    var KEY = { BACKSPACE: 8, TAB: 9, RETURN: 13, ESC: 27, SPACE: 32, PAGEUP: 33, PAGEDOWN: 34, END: 35,
        HOME: 36, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, INSERT: 45, DELETE: 46, ZERO: 48, ONE: 49, TWO: 50,
        THREE: 51, FOUR: 52, FIVE: 53, SIX: 54, SEVEN: 55, EIGHT: 56, NINE: 57, A: 65, B: 66, C: 67, D: 68,
        E: 69, F: 70, G: 71, H: 72, I: 73, J: 74, K: 75, L: 76, M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82, S: 83,
        T: 84, U: 85, V: 86, W: 87, X: 88, Y: 89, Z: 90, TILDA: 192 };
    var input = { kb: {}, mouse: {} };

    var onKey = function(e,key,pressed) {
        switch(key) {
            
        }
    };
    var onMouse = function(e,button,pressed) {
        switch(button) {
            case 1: input.mouse.left = pressed; e.preventDefault(); break;
            case 3: input.mouse.right = pressed; e.preventDefault(); break;
        }
    };

    var cursor = Canvas.getCursor();
    
    return {
        processInput: function(game,Player) {
            for(var key in input.kb) { if(!input.kb.hasOwnProperty(key)) continue;
                
            }
            var io = Interface.updateCursor(cursor,input.mouse.left,input.mouse.right);
            
            if(input.mouse.left) {
                //if(cursor.quad && io.move) Player.move(cursor.quad);
            }
            if(input.mouse.right) {
                if(io.move) Player.move(cursor);
            }
        },
        onKey: onKey, onMouse: onMouse
    };
});