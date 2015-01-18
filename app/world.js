'use strict';
Application.Services.factory('World',function(Util,Things,Renderer) {

    var position = { x: 0, y: 0 };
    var game;
    var world = { things: [] };
    
    Renderer.initWorld(world);
    
    var generateThings = function() {
        world.things = [];
        for(var bgw = Math.ceil(game.arena.width/-2)-1; bgw < Math.floor(game.arena.width/2)+2; bgw++) {
            for(var bgh = Math.ceil(game.arena.height/-2)-1; bgh < Math.floor(game.arena.height/2)+2; bgh++) {
                var seed = Util.positionSeed(+position.x + bgw, +position.y + bgh);
                Math.seedrandom(seed);
                if(Math.random() > 0.02) continue; // 5% chance of thing
                var thing = Things.spawnThing(seed,+position.x + bgw, +position.y + bgh);
                thing.relative = { x: bgw, y: bgh };
                world.things.push(thing);
            }
        }
    };

    return {
        initGame: function(g) { game = g; },
        setPosition: function(x,y) { 
            position.x = x; position.y = y;
            generateThings();
        },
        getThingsAt: function(x,y) {
            var things = [];
            if(x == '-') return things;
            var gameX = Math.floor(x/24), gameY = Math.floor(y/24);
            for(var i = 0; i < world.things.length; i++) {
                if(world.things[i].relative.x+18 == gameX && world.things[i].relative.y+12 == gameY) things.push(world.things[i]);
            }
            return things;
        },
        world: world
    };
});