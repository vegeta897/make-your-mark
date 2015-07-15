'use strict';
Application.Services.factory('World',function(Util,Things,Renderer,FireService) {

    var position = { sx: 0, sy: 0, x: 0, y: 0 };
    var game;
    var world = { things: [], removed: {}, dropped: {}, players: {} };
    var removedReady = false, droppedReady = false, onRemoved;
    
    Renderer.initWorld(world);
    
    var generateThings = function() {
        world.things = []; //return;
        for(var sw = -1; sw < 2; sw++) { for(var sh = -1; sh < 2; sh++) { // 9 sectors
            for(var w = 0; w < game.arena.width - 4; w++) { for(var h = 0; h < game.arena.height - 4; h++) { // 33x21
                var seed = Util.positionSeed(+position.sx+sw, +position.sy+sh, w, h);
                Math.seedrandom('thing-gen'+seed);
                if(Math.random() > 0.02) continue; // 2% chance of thing
                world.things.push(Things.spawnThing(+position.sx+sw, +position.sy+sh, w, h));
            } }
        } }
    };
    
    var getVicinity = function() {
        var vicinity = [];
        for(var vt = 0; vt < world.things.length; vt++) {
            if(world.things[vt].sx != position.sx || world.things[vt].sy != position.sy) continue;
            if(Util.getFastDistance(world.things[vt].x,world.things[vt].y,position.x,position.y) <= 1 && 
                (!world.things[vt].removed || world.things[vt].dropped)) {
                vicinity.push(world.things[vt]);
            }
        }
        return vicinity;
    };
    
    var applyRemovalsAndDrops = function() {
        for(var dKey in world.dropped) { if(!world.dropped.hasOwnProperty(dKey)) continue;
            if(!Util.thingInArray(world.dropped[dKey],world.things)) {
                world.things.push(world.dropped[dKey]);
            }
        }
        for(var t = 0; t < world.things.length; t++) {
            var th = world.things[t];
            th.removed = world.removed.hasOwnProperty(th.guid);
            if(world.dropped.hasOwnProperty(th.guid)) {
                var d = world.dropped[th.guid];
                th.dropped = true; th.sx = d.sx; th.sy = d.sy; th.x = d.x; th.y = d.y;
                th.propsExtra = d.propsExtra; th.propsLost = d.propsLost; 
                th.actionsExtra = d.actionsExtra; th.actionsLost = d.actionsLost;
                th.allProps = Things.createFullPropertyList(th);
                th.allActions = Things.createFullActionList(th);
            } else { delete th.dropped; }
        }
    };

    return {
        initGame: function(g) {
            game = g;
            FireService.onValue('removed',function(removed) {
                for(var rKey in removed) { if(!removed.hasOwnProperty(rKey)) continue;
                    var pos = Util.positionFromSeed(rKey);
                    removed[rKey] = Things.spawnThing(pos.sx,pos.sy,pos.x,pos.y);
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
                    var sx = +split[0], sy = +split[1];
                    var x = +split[2], y = +split[3];
                    var propsExtra = split[4];
                    propsExtra = propsExtra ? propsExtra.split(',') : propsExtra;
                    var actionsExtra = split[5];
                    actionsExtra = actionsExtra ? actionsExtra.split(',') : actionsExtra;
                    var propsLost = split[6];
                    propsLost = propsLost ? propsLost.split(',') : propsLost;
                    var actionsLost = split[7];
                    actionsLost = actionsLost ? actionsLost.split(',') : actionsLost;
                    var changedTo = split[8];
                    dropped[dKey] = Things.spawnThing(pos.sx,pos.sy,pos.x,pos.y);
                    var child = dKey.split('-');
                    if(child.length > 1) dropped[dKey] = Things.createChild(dropped[dKey],child[1],child[2]);
                    dropped[dKey].sx = sx; dropped[dKey].sy = sy; dropped[dKey].x = x; dropped[dKey].y = y;
                    if(changedTo) Things.changeThing(dropped[dKey],changedTo);
                    if(propsExtra) dropped[dKey].propsExtra = propsExtra;
                    if(actionsExtra) dropped[dKey].actionsExtra = actionsExtra;
                    if(propsLost) dropped[dKey].propsLost = propsLost;
                    if(actionsLost) dropped[dKey].actionsLost = actionsLost;
                    dropped[dKey].allProps = Things.createFullPropertyList(dropped[dKey]);
                    dropped[dKey].allActions = Things.createFullActionList(dropped[dKey]);
                }
                world.dropped = dropped || {};
                applyRemovalsAndDrops();
                droppedReady = true; onRemoved();
            });
        },
        setRemovedCallback: function(cb) { onRemoved = cb; },
        setPosition: function(sx,sy,x,y) {
            var osx = position.sx, osy = position.sy;
            position.sx = sx; position.sy = sy; position.x = x; position.y = y;
            //if(osx != sx || osy != sy) { generateThings(); applyRemovalsAndDrops(); }
            return getVicinity();
        },
        newSector: function() {
            generateThings(); applyRemovalsAndDrops();
        },
        getThingsAt: function(sx,sy,x,y,type) {
            sx = type == 'cursor' ? position.sx : sx; sy = type == 'cursor' ? position.sy : sy;
            var things = []; 
            if(x == '-' || position.sx != sx || position.sy != sy) return things;
            var gameX = Math.floor(x/24)-2, gameY = Math.floor(y/24)-2;
            if(type == 'cursor' && (gameX >= game.arena.width - 4 || gameY >= game.arena.height - 4 || gameX < 0 || gameY < 0)) return things;
            for(var i = 0; i < world.things.length; i++) {
                var tx = (world.things[i].sx - position.sx) * (game.arena.width - 4) + world.things[i].x,
                    ty = (world.things[i].sy - position.sy) * (game.arena.height - 4) + world.things[i].y;
                if(tx == gameX && ty == gameY && (!world.things[i].removed || world.things[i].dropped)) {
                    things.push(world.things[i]); }
            }
            return things;
        },
        removeThing: function(thing) {
            FireService.set('removed/'+thing.guid,1); FireService.remove('dropped/'+thing.guid);
        },
        addThing: function(thing) {
            //Things.changeThing(thing,thing.id);
            var child = thing.guid.split('-');
            var origPos = Util.positionFromSeed(child[0]);
            if(origPos.sx == thing.sx && origPos.sy == thing.sy && origPos.x == thing.x && origPos.y == thing.y &&
                !thing.propsExtra && !thing.propsLost && !thing.actionsExtra && !thing.actionsLost &&
                !thing.changedFrom && child.length < 2) { 
                FireService.remove('removed/'+thing.guid); // Dropped in original position with no changes
            } else { // Dropped somewhere else and/or with changes
                var mods = ':'; // Build mod line
                if(thing.propsExtra) {
                    for(var m = 0; m < thing.propsExtra.length; m++) {
                        mods += m == thing.propsExtra.length - 1 ? 
                            thing.propsExtra[m] : thing.propsExtra[m] + ',';
                    }
                }
                mods += ':';
                if(thing.actionsExtra) {
                    for(var l = 0; l < thing.actionsExtra.length; l++) {
                        mods += l == thing.actionsExtra.length - 1 ?
                            thing.actionsExtra[l] : thing.actionsExtra[l] + ',';
                    }
                }
                mods += ':';
                if(thing.propsLost) {
                    for(var o = 0; o < thing.propsLost.length; o++) {
                        mods += o == thing.propsLost.length - 1 ?
                            thing.propsLost[o] : thing.propsLost[o] + ',';
                    }
                }
                mods += ':';
                if(thing.actionsLost) {
                    for(var p = 0; p < thing.actionsLost.length; p++) {
                        mods += p == thing.actionsLost.length - 1 ?
                            thing.actionsLost[p] : thing.actionsLost[p] + ',';
                    }
                }
                mods += thing.changedFrom ? ':'+thing.id : ':';
                FireService.set('dropped/'+thing.guid,thing.sx+':'+thing.sy+':'+thing.x+':'+thing.y+mods);
            }
        },
        worldReady: function() { return removedReady; },
        world: world
    };
});