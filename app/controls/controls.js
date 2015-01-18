'use strict';
Application.Directives.directive('controls',function() {
    return {
        restrict: 'E',
        templateUrl: 'app/controls/controls.html',
        replace: true,
        scope: {},
        controller: function($scope,Controls) {
            this.init = Controls.initListeners;
        },
        link: function(scope,elem,attrs,ctrl) {
            var up = document.getElementById('moveUp');
            var left = document.getElementById('moveLeft');
            var right = document.getElementById('moveRight');
            var down = document.getElementById('moveDown');

            ctrl.init(up,left,right,down);
        }
    }
});

Application.Services.factory('Controls',function() {

    var cursor;
    var onUp, onLeft, onRight, onDown;
    
    return {
        attachCursor: function(c) { cursor = c; },
        initListeners: function(up,left,right,down) {
            up.addEventListener('mousedown',onUp,false);
            left.addEventListener('mousedown',onLeft,false);
            right.addEventListener('mousedown',onRight,false);
            down.addEventListener('mousedown',onDown,false);
        },
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
        }
    };
});