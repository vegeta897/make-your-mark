'use strict';
Application.Services.factory('Interface',function(World) {

    var game, world;
    var controls = { };

    return {
        initGame: function(g) { game = g; },
        initWorld: function(w) { world = w; },
        controlsOnThing: function(thing) { controls.hover = thing; },
        controlsOffThing: function(thing) { delete controls.hover; },
        updateCursor: function(c) {
            // Generate hover list
            c.hover = {};
            var underCursor = World.getThingsAt(c.x, c.y);
            for(var i = 0; i < underCursor.length; i++) {
                c.hover[underCursor[i].guid] = underCursor[i];
            }
            if(controls.hover) c.hover[controls.hover.guid] = controls.hover;
            
            // Determine cursor quad
            var co = { x: c.x - 444, y: c.y - 300 }; // Center-based cursor coords
            if(c.x != '-' && Math.pow(co.x,2) + Math.pow(co.y,2) > 1296) {
                if(co.y < 0 && Math.abs(co.x) <= Math.abs(co.y)) { c.quad = 'up'; }
                else if(co.y >= 0 && Math.abs(co.x) <= Math.abs(co.y)) { c.quad = 'down'; }
                else if(co.x < 0 && Math.abs(co.x) >= Math.abs(co.y)) { c.quad = 'left'; }
                else { c.quad = 'right'; }
            } else { c.quad = false; }
        }
    };
});