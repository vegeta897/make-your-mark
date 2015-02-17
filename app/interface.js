'use strict';
Application.Services.factory('Interface',function(World) {

    var game, world;
    var controls = { };

    return {
        initGame: function(g) { game = g; },
        initWorld: function(w) { world = w; },
        controlsOnThing: function(thing) { controls.hover = thing; },
        controlsOffThing: function(thing) { delete controls.hover; },
        controlsSelectThing: function(thing) {
            if(game.selected && game.selected.guid == thing.guid) { delete game.selected; return; }
            game.selected = thing;
        },
        updateCursor: function(c,lmb,rmb) { // lmb,rmb = left/right mouse pressed
            // Generate hover list
            c.hover = {};
            var underCursor = World.getThingsAt(0,0,c.x, c.y);
            var hoverSelect;
            for(var i = 0; i < underCursor.length; i++) {
                c.hover[underCursor[i].guid] = underCursor[i];
                hoverSelect = underCursor[i];
            }
            if(controls.hover) c.hover[controls.hover.guid] = controls.hover;
            // Select/Deselect things
            if(lmb && hoverSelect) game.selected = hoverSelect;
            if(lmb && !hoverSelect) { delete game.selected; }
            if(rmb) { /*delete game.selected;*/ }
            
            return { move: rmb };
        }
    };
});