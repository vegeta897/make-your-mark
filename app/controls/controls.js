'use strict';
Application.Directives.directive('controls',function() {
    return {
        restrict: 'E',
        templateUrl: 'app/controls/controls.html',
        replace: true,
        scope: {},
        controller: function($scope,Controls,Game,Util) {
            $scope.moveUp = Controls.onUp;
            $scope.moveLeft = Controls.onLeft;
            $scope.moveRight = Controls.onRight;
            $scope.moveDown = Controls.onDown;
            $scope.game = Game.game;
            $scope.onThing = Controls.addToHover;
            $scope.offThing = Controls.clearHover;
            $scope.isOnThing = function(thing) { return Util.thingInArray(thing,Controls.getCursor().things); };
            window.addEventListener('keydown',function(e) { return Controls.onKey(e, e.keyCode, true); },false);
            window.addEventListener('keyup',function(e) { return Controls.onKey(e, e.keyCode, false); },false);
            jQuery('#highCanvas').mousedown(function(e) { return Controls.onMouse(e, e.which, true); });
            jQuery(window).mouseup(function(e) { return Controls.onMouse(e, e.which, false); });
            
            // TODO: Sometimes mouse down event handler doesn't initialize
        }
    }
});

Application.Services.factory('Controls',function() {
    
    var KEY = { BACKSPACE: 8, TAB: 9, RETURN: 13, ESC: 27, SPACE: 32, PAGEUP: 33, PAGEDOWN: 34, END: 35,
        HOME: 36, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, INSERT: 45, DELETE: 46, ZERO: 48, ONE: 49, TWO: 50,
        THREE: 51, FOUR: 52, FIVE: 53, SIX: 54, SEVEN: 55, EIGHT: 56, NINE: 57, A: 65, B: 66, C: 67, D: 68,
        E: 69, F: 70, G: 71, H: 72, I: 73, J: 74, K: 75, L: 76, M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82, S: 83,
        T: 84, U: 85, V: 86, W: 87, X: 88, Y: 89, Z: 90, TILDA: 192 };
    var input = { kb: {}, mouse: {} };

    var onKey = function(e,key,pressed) {
        switch(key) {
            // Movement keys
            case KEY.W: input.kb.w = pressed; e.preventDefault(); break;
            case KEY.A: input.kb.a = pressed; e.preventDefault(); break;
            case KEY.S: input.kb.s = pressed; e.preventDefault(); break;
            case KEY.D: input.kb.d = pressed; e.preventDefault(); break;
        }
    };
    var onMouse = function(e,button,pressed) {
        switch(button) {
            case 1: input.mouse.left = pressed; e.preventDefault(); break;
            case 3: input.mouse.right = pressed; e.preventDefault(); break;
        }
    };

    var MOVE = { w: 'up', a: 'left', s: 'down', d: 'right' };

    var cursor;
    var onUp, onLeft, onRight, onDown;
    
    return {
        attachCursor: function(c) { cursor = c; cursor.hover = []; },
        attachMoves: function(move) {
            onUp = function(){move('up');}; onLeft = function(){move('left');}; 
            onRight = function(){move('right');}; onDown = function(){move('down');};
        },
        onMouseMove: function() {
            
        },
        onMouseDown: function(e) {
            
        },
        onMouseUp: function(e) {
            
        },
        onMouseOut: function(e) {
            
            cursor.x = cursor.y = '-';
        },
        processInput: function(game,Player) {
            for(var key in input.kb) { if(!input.kb.hasOwnProperty(key)) continue;
                if(input.kb[key] && MOVE.hasOwnProperty(key)) {
                    Player.move(MOVE[key]); break; 
                }
            }
            var co = { x: cursor.x - 444, y: cursor.y - 300 }; // Center-based cursor coords
            if(cursor.x != '-' && Math.pow(co.x,2) + Math.pow(co.y,2) > 1296) {
                if(co.y < 0 && Math.abs(co.x) <= Math.abs(co.y)) { cursor.quad = 'up'; }
                else if(co.y >= 0 && Math.abs(co.x) <= Math.abs(co.y)) { cursor.quad = 'down'; }
                else if(co.x < 0 && Math.abs(co.x) >= Math.abs(co.y)) { cursor.quad = 'left'; }
                else { cursor.quad = 'right'; }
            } else { cursor.quad = false; }
            
            if(input.mouse.left) {
                if(cursor.quad)
                Player.move(cursor.quad);
            }
            if(input.mouse.right) {
                
            }
        },
        addToHover: function(thing) { cursor.hover.push(thing); },
        clearHover: function(thing) { cursor.hover = []; },
        onUp: function(){onUp();}, onLeft: function(){onLeft();}, 
        onRight: function(){onRight();}, onDown: function(){onDown();}, 
        onKey: onKey, onMouse: onMouse, getCursor: function() { return cursor; }
    };
});