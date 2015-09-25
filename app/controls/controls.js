'use strict';
Application.Directives.directive('controls',function() {
    return {
        restrict: 'E',
        templateUrl: 'app/controls/controls.html',
        replace: true,
        scope: {},
        controller: function($scope,Controls,Interface,Game,Players,Util,Renderer) {
            // TODO: Clean up unused functions
            $scope.game = Game.game;
            $scope.selectThing = Interface.controlsSelectThing;
            $scope.thingIsSelected = function(thing) { return Game.game.selected && Game.game.selected.guid == thing.guid; };
            $scope.isOnThing = function(thing) { return Controls.cursor.hover.hasOwnProperty(thing.guid); };
            $scope.dropThing = Players.dropThing;
            $scope.thingIsCarried = Players.thingIsCarried;
            $scope.quality = Util.objectQuality;
            $scope.cursor = Controls.cursor;
            window.addEventListener('keydown',function(e) { return Controls.onKey(e, e.keyCode, true); },false);
            window.addEventListener('keyup',function(e) { return Controls.onKey(e, e.keyCode, false); },false);
            jQuery(window).mouseup(function(e) { return Controls.onMouse(e, e.which, false); });
            this.initMainCanvas = function(canvas,ctx) {
                Renderer.initMainCanvas(canvas,ctx,Controls.cursor);
                canvas.addEventListener('mousemove',function(e){
                    var offset = jQuery(canvas).offset();
                    var newX = e.pageX - offset.left < 0 ? 0 : Math.floor((e.pageX - offset.left)/2);
                    var newY = e.pageY - offset.top < 0 ? 0 : Math.floor((e.pageY - offset.top)/2);
                    var moved = Controls.cursor.x != newX || Controls.cursor.y != newY;
                    if(!moved) return;
                    Controls.cursor.x = newX; Controls.cursor.y = newY;
                },false);
                canvas.addEventListener('mouseleave',function(e){
                    Controls.cursor.x = '-'; Controls.cursor.y = '-';
                },false);
                canvas.addEventListener('mousedown',function(){},false);
                canvas.addEventListener('mouseup',function(){},false);
                jQuery(canvas).mousedown(function(e) { return Controls.onMouse(e, e.which, true); });
            };
            this.initMinimap = Renderer.initMinimap;
            this.initZoomCanvas = Renderer.initZoomCanvas;
            this.initPanel = Controls.initPanel;
        },
        link: function(scope,elem,attrs,ctrl) {
            ctrl.initPanel(elem);
            var mcv = document.getElementById('mainCanvas');
            var mc = mcv.getContext ? mcv.getContext('2d') : null;
            mc.mozImageSmoothingEnabled = false;
            mc.msImageSmoothingEnabled = false;
            mc.imageSmoothingEnabled = false;
            mcv.onselectstart = function() { return false; }; // Disable selecting
            ctrl.initMainCanvas(mcv,mc);
            var mmcv = document.getElementById('minimap');
            var mmc = mmcv.getContext ? mmcv.getContext('2d') : null;
            mmcv.onselectstart = function() { return false; }; // Disable selecting
            ctrl.initMinimap(mmcv,mmc);
            var zcv = document.getElementById('zoomCanvas');
            var zc = zcv.getContext ? zcv.getContext('2d') : null;
            zc.mozImageSmoothingEnabled = false;
            zc.imageSmoothingEnabled = false;
            mmcv.onselectstart = function() { return false; }; // Disable selecting
            ctrl.initZoomCanvas(zcv,zc);
            // Disable right clicking
            jQuery('body').on('contextmenu', '#minimap', function(){ return false; })
                .on('contextmenu', '#zoomCanvas', function(){ return false; })
                .on('contextmenu', '#mainCanvas', function(){ return false; });
        }
    }
});

Application.Services.factory('Controls',function(Interface,Util) {
    
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
    
    var cursor = { x: '-', y: '-', hover: {} };
    var panel;
    
    return {
        processInput: function(game,Players) {
            for(var key in input.kb) { if(!input.kb.hasOwnProperty(key)) continue;
                
            }
            Interface.updateCursor(cursor,panel,input.mouse.left,input.mouse.right);
        },
        initPanel: function(div) {
            panel = div;
        },
        onKey: onKey, onMouse: onMouse, cursor: cursor
    };
});