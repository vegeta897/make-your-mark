'use strict';
Application.Services.factory('World',function(Util,Things,Renderer,FireService) {

    var position = { x: 0, y: 0 };
    var game;
    var world = { things: [], removed: {} };
    var removedReady = false, onRemoved;
    
    Renderer.initWorld(world);
    
    var generateThings = function() {
        world.things = [];
        for(var bgw = Math.ceil(game.arena.width/-2)-1; bgw < Math.floor(game.arena.width/2)+2; bgw++) {
            for(var bgh = Math.ceil(game.arena.height/-2)-1; bgh < Math.floor(game.arena.height/2)+2; bgh++) {
                var seed = Util.positionSeed(+position.x + bgw, +position.y + bgh);
                if(world.removed.hasOwnProperty(seed)) continue;
                Math.seedrandom('thing-gen'+seed);
                if(Math.random() > 0.02) continue; // 2% chance of thing
                var thing = Things.spawnThing(+position.x + bgw, +position.y + bgh);
                thing.relative = { x: bgw, y: bgh };
                world.things.push(thing);
            }
        }
    };
    
    var getVicinity = function() {
        var vicinity = [];
        for(var vt = 0; vt < world.things.length; vt++) {
            if(Math.abs(world.things[vt].relative.x)+Math.abs(world.things[vt].relative.y) <= 1 && 
                !world.removed.hasOwnProperty(world.things[vt].guid)) {
                vicinity.push(world.things[vt]);
            }
        }
        return vicinity;
    };

    return {
        initGame: function(g) { 
            game = g;
            FireService.onValue('players',function(players) {
                for(var pKey in players) { if(!players.hasOwnProperty(pKey)) continue;
                    Math.seedrandom(pKey);
                    players[pKey] = {
                        guid: pKey, x: +players[pKey].split(':')[0], y: +players[pKey].split(':')[1],
                        color: Util.randomColor('vibrant')
                    };
                }
                world.players = players;
            });
            FireService.onValue('removed',function(removed) {
                for(var rKey in removed) { if(!removed.hasOwnProperty(rKey)) continue;
                    var pos = Util.positionFromSeed(rKey);
                    removed[rKey] = Things.spawnThing(pos.x,pos.y);
                    removed[rKey].removed = true;
                }
                world.removed = removed || {};
                removedReady = true; onRemoved();
            });
        },
        setRemovedCallback: function(cb) { onRemoved = cb; },
        setPosition: function(x,y) { 
            position.x = x; position.y = y;
            generateThings();
            return getVicinity();
        },
        getThingsAt: function(x,y,type) {
            var things = [];
            if(x == '-') return things;
            var gameX = Math.floor(x/24), gameY = Math.floor(y/24);
            for(var i = 0; i < world.things.length; i++) {
                if(world.things[i].relative.x+18 == gameX && world.things[i].relative.y+12 == gameY && 
                    !world.removed.hasOwnProperty(world.things[i].guid)) things.push(world.things[i]);
            }
            return things;
        },
        removeThing: function(thing) {
            //world.removed[thing.guid] = thing;
            FireService.set('removed/'+thing.guid,1);
        },
        isRemoved: function(thing) {
            return world.removed.hasOwnProperty(thing.guid);
        },
        worldReady: function() { return removedReady; },
        world: world
    };
});