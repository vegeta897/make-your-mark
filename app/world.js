'use strict';
Application.Services.factory('World',function(Util,Things,Renderer,FireService) {

    var position = { x: 0, y: 0 };
    var game;
    var world = { things: [], removed: {}, dropped: {} };
    var removedReady = false, droppedReady = false, onRemoved;
    
    Renderer.initWorld(world);
    
    var generateThings = function() {
        world.things = [];
        for(var bgw = Math.ceil(game.arena.width/-2)-1; bgw < Math.floor(game.arena.width/2)+2; bgw++) {
            for(var bgh = Math.ceil(game.arena.height/-2)-1; bgh < Math.floor(game.arena.height/2)+2; bgh++) {
                var seed = Util.positionSeed(+position.x + bgw, +position.y + bgh);
                //if(world.removed.hasOwnProperty(seed)) continue;
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
                (!world.things[vt].removed || world.things[vt].dropped)) {
                vicinity.push(world.things[vt]);
            }
        }
        return vicinity;
    };
    
    var applyRemovalsAndDrops = function() {
        for(var t = 0; t < world.things.length; t++) {
            if(world.removed.hasOwnProperty(world.things[t].guid)) world.things[t].removed = true;
        }
        for(var dKey in world.dropped) { if(!world.dropped.hasOwnProperty(dKey)) continue;
            var relative = Util.getXYdiff(position.x,position.y,world.dropped[dKey].x,world.dropped[dKey].y);
            world.dropped[dKey].relative = { x: relative.x, y: relative.y };
            world.dropped[dKey].dropped = true;
            world.things.push(world.dropped[dKey]);
        }
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
                applyRemovalsAndDrops();
                removedReady = true; onRemoved();
            });
            FireService.onValue('dropped',function(dropped) {
                for(var dKey in dropped) { if(!dropped.hasOwnProperty(dKey)) continue;
                    var pos = Util.positionFromSeed(dKey);
                    var split = dropped[dKey].split(':');
                    var x = +split[0], y = +split[1];
                    var propsExtra = split[2];
                    propsExtra = propsExtra ? propsExtra.split(',') : propsExtra;
                    var actionsExtra = split[3];
                    actionsExtra = actionsExtra ? actionsExtra.split(',') : actionsExtra;
                    var propsLost = split[4];
                    propsLost = propsLost ? propsLost.split(',') : propsLost;
                    var actionsLost = split[5];
                    actionsLost = actionsLost ? actionsLost.split(',') : actionsLost;
                    var changedTo = split[6];
                    dropped[dKey] = Things.spawnThing(pos.x,pos.y);
                    dropped[dKey].x = x; dropped[dKey].y = y;
                    if(changedTo) Things.changeThing(dropped[dKey],changedTo);
                    if(propsExtra) dropped[dKey].propsExtra = propsExtra;
                    if(actionsExtra) dropped[dKey].actionsExtra = actionsExtra;
                    if(propsLost) dropped[dKey].propsLost = propsLost;
                    if(actionsLost) dropped[dKey].actionsLost = actionsLost;
                }
                world.dropped = dropped || {};
                applyRemovalsAndDrops();
                droppedReady = true; onRemoved();
            });
        },
        setRemovedCallback: function(cb) { onRemoved = cb; },
        setPosition: function(x,y) { 
            position.x = x; position.y = y;
            generateThings();
            applyRemovalsAndDrops();
            return getVicinity();
        },
        getThingsAt: function(x,y,type) {
            var things = [];
            if(x == '-') return things;
            var gameX = Math.floor(x/24), gameY = Math.floor(y/24);
            for(var i = 0; i < world.things.length; i++) {
                if(world.things[i].relative.x+18 == gameX && world.things[i].relative.y+12 == gameY &&
                    (!world.things[i].removed || world.things[i].dropped)) things.push(world.things[i]);
            }
            return things;
        },
        removeThing: function(thing) {
            FireService.set('removed/'+thing.guid,1);
            FireService.remove('dropped/'+thing.guid);
        },
        addThing: function(thing) {
            //Things.changeThing(thing,thing.id);
            var origPos = Util.positionFromSeed(thing.guid);
            if(origPos.x == thing.x && origPos.y == thing.y && 
                !thing.hasOwnProperty('propsExtra') && !thing.hasOwnProperty('propsLost') && 
                !thing.hasOwnProperty('actionsExtra') && !thing.hasOwnProperty('actionsLost') &&
                !thing.hasOwnProperty('changedFrom')) { 
                FireService.remove('removed/'+thing.guid); // Dropped in original position with no changes
            } else { // Dropped somewhere else and/or with changes
                var mods = ':'; // Build mod line
                if(thing.hasOwnProperty('propsExtra')) {
                    for(var m = 0; m < thing.propsExtra.length; m++) {
                        mods += m == thing.propsExtra.length - 1 ? 
                            thing.propsExtra[m] : thing.propsExtra[m] + ',';
                    }
                }
                mods += ':';
                if(thing.hasOwnProperty('actionsExtra')) {
                    for(var l = 0; l < thing.actionsExtra.length; l++) {
                        mods += l == thing.actionsExtra.length - 1 ?
                            thing.actionsExtra[l] : thing.actionsExtra[l] + ',';
                    }
                }
                mods += ':';
                if(thing.hasOwnProperty('propsLost')) {
                    for(var o = 0; o < thing.propsLost.length; o++) {
                        mods += o == thing.propsLost.length - 1 ?
                            thing.propsLost[o] : thing.propsLost[o] + ',';
                    }
                }
                mods += ':';
                if(thing.hasOwnProperty('actionsLost')) {
                    for(var p = 0; p < thing.actionsLost.length; p++) {
                        mods += p == thing.actionsLost.length - 1 ?
                            thing.actionsLost[p] : thing.actionsLost[p] + ',';
                    }
                }
                mods += thing.hasOwnProperty('changedFrom') ? ':'+thing.id : ':';
                FireService.set('dropped/'+thing.guid,thing.x+':'+thing.y+mods);
            }
        },
        worldReady: function() { return removedReady; },
        world: world
    };
});