'use strict';
Application.Directives.directive('canvas',function() {
    return {
        restrict: 'C',
        templateUrl: 'app/canvas/canvas.html',
        replace: true,
        scope: {},
        controller: function($scope,Canvas) {
            this.init = function(mcv,mucv,hcv,hucv,mc,muc,hc,huc) {
                Canvas.attachCanvases({
                    main: mc, mainUnder: muc, high: hc, highUnder: huc,
                    mainCanvas: mcv, mainUnderCanvas: mucv, highCanvas: hcv, highUnderCanvas: hucv
                });
                Canvas.initListeners(jQuery(hcv)[0]);
            };
        },
        link: function(scope,elem,attrs,ctrl) {
            var mcv = document.getElementById('mainCanvas');
            var mucv = document.getElementById('mainUnderCanvas');
            var hcv = document.getElementById('highCanvas');
            var hucv = document.getElementById('highUnderCanvas');
            var mc = mcv.getContext ? mcv.getContext('2d') : null;
            var muc = mucv.getContext ? mucv.getContext('2d') : null;
            var hc = hcv.getContext ? hcv.getContext('2d') : null;
            var huc = hucv.getContext ? hucv.getContext('2d') : null;

            hcv.onselectstart = function() { return false; }; // Disable selecting and right clicking
            jQuery('body').on('contextmenu', '#highCanvas', function(){ return false; });

            ctrl.init(mcv,mucv,hcv,hucv,mc,muc,hc,huc);
        }
    }
});

Application.Services.factory('Canvas', function(FireService,Controls,Util) {
    var canvases, cursor = { x: '-', y: '-'};
    Controls.attachCursor(cursor);
    
    var clearAll = function() {
        for (var c in canvases) {
            if (!canvases.hasOwnProperty(c) || c.substr(c.length - 6) == 'Canvas') continue;
            canvases[c].clearRect(0, 0, canvases[c + 'Canvas'].width, canvases[c + 'Canvas'].height);
        }
    };

    return {
        attachCanvases: function(c) { canvases = c; },
        getCanvases: function() { return canvases; },
        initListeners: function(c) {
            c.addEventListener('mousemove',function(e){
                var offset = jQuery(c).offset();
                var newX = e.pageX - offset.left < 0 ? 0 : Math.floor((e.pageX - offset.left));
                var newY = e.pageY - offset.top < 0 ? 0 : Math.floor((e.pageY - offset.top));
                var moved = cursor.x != newX || cursor.y != newY;
                if(!moved) return;
                cursor.x = newX; cursor.y = newY;
                Controls.onMouseMove();
            },false);
            c.addEventListener('mouseleave',Controls.onMouseOut,false);
            c.addEventListener('mousedown',Controls.onMouseDown,false);
            c.addEventListener('mouseup',Controls.onMouseUp,false);
        },
        getFireService: function(prefix) {
            return { // Override some FireService functions to include path prefix
                set: function(path,value) { FireService.set('canvas/'+prefix+'/'+path,value); },
                push: function(path,value) { FireService.push('canvas/'+prefix+'/'+path,value); },
                once: function(path,callback) { FireService.once('canvas/'+prefix+'/'+path,callback); },
                remove: function(path) {
                    if(path.constructor !== Array) path = [path];
                    for(var i = 0; i < path.length; i++) { path[i] = 'canvas/'+prefix+'/'+path[i]; }
                    FireService.remove(path); 
                },
                onValue: function(path,callback) { FireService.onValue('canvas/'+prefix+'/'+path,callback); },
                onAddChild: function(path,callback) { FireService.onAddChild('canvas/'+prefix+'/'+path,callback); },
                off: function(path) {
                    if(path.constructor !== Array) path = [path];
                    for(var i = 0; i < path.length; i++) { path[i] = 'canvas/'+prefix+'/'+path[i]; }
                    FireService.off(path); 
                },
                ref: FireService.ref.child('canvas/'+prefix)
            };
        },
        clear: function() { canvases.main.clearRect(0,0,canvases.mainCanvas.width,canvases.mainCanvas.height); },
        clearAll: clearAll, cursor: cursor
    };
});