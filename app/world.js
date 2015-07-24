'use strict';
Application.Services.factory('World',function(Util,Things,Containers,Renderer,FireService) {

    var position = { sx: 0, sy: 0, x: 0, y: 0 };
    var game;
    var world = { things: [], removed: {}, dropped: {}, containers: [], players: {}, sectorObjectCount: 0,
        nearSectors: {} };
    var removedReady = false, droppedReady = false, onRemoved;
    
    Renderer.initWorld(world);
    
    var generateContainersAndThings = function() {
        world.things = [];
        world.containers = [];
        var newSectors = {};
        for(var sw = -1; sw < 2; sw++) { for(var sh = -1; sh < 2; sh++) { // 9 sectors
            var sectorKey = (+position.sx+sw)+':'+(+position.sy+sh);
            if(world.nearSectors[sectorKey]) { // Copy stored sector objects if not new sector
                newSectors[sectorKey] = world.nearSectors[sectorKey]; continue; 
            }
            newSectors[sectorKey] = {things:[],containers:[]}; // Sector not near, spawn objects
            Math.seedrandom('container-thing-gen'+Util.positionSeed(+position.sx+sw, +position.sy+sh, 0, 0));
            for(var w = 0; w < game.arena.width - 4; w++) { for(var h = 0; h < game.arena.height - 4; h++) { // 33x21
                if(Math.random() <= 0.003 // 0.3% chance of container
                    && w > 0 && h > 0 && w < game.arena.width - 5 && h < game.arena.height - 5) { // Don't spawn on edges
                    newSectors[sectorKey].containers.push(Containers.spawnContainer(+position.sx+sw, +position.sy+sh, w, h));
                } else if(Math.random() <= 0.0007) {
                    newSectors[sectorKey].things.push(Things.spawnThing({sx:+position.sx+sw, sy:+position.sy+sh, x:w, y:h}));
                }
            } }
        } }
        world.nearSectors = newSectors;
        for(var sKey in world.nearSectors) { if(!world.nearSectors.hasOwnProperty(sKey)) continue;
            world.things = world.things.concat(world.nearSectors[sKey].things);
            world.containers = world.containers.concat(world.nearSectors[sKey].containers);
        }
    };
    
    var getVicinity = function() {
        var vicinity = [];
        for(var vt = 0; vt < world.things.length; vt++) {
            if(world.things[vt].sx != position.sx || world.things[vt].sy != position.sy) continue;
            if(Util.getFastDistance(world.things[vt].x,world.things[vt].y,position.x,position.y) <= 2 && 
                (!world.things[vt].removed || world.things[vt].dropped)) {
                vicinity.push(world.things[vt]);
            }
        }
        return vicinity;
    };
    
    var applyRemovalsAndDrops = function() {
        for(var dKey in world.dropped) { if(!world.dropped.hasOwnProperty(dKey)) continue;
            var thingsIndex = Util.objectInArray(world.dropped[dKey],world.things);
            if(thingsIndex < 0) {
                world.things.push(world.dropped[dKey]);
            } else { world.things[thingsIndex] = world.dropped[dKey]; }
        }
        world.sectorObjectCount = 0;
        for(var t = 0; t < world.things.length; t++) {
            var th = world.things[t];
            th.removed = world.removed.hasOwnProperty(th.guid);
            th.allProps = Things.createFullPropertyList(th);
            th.allActions = Things.createFullActionList(th);
            world.sectorObjectCount += th.sx == position.sx && th.sy == position.sy && !th.removed ? 1 : 0;
            if(world.dropped.hasOwnProperty(th.guid)) {
                var d = world.dropped[th.guid];
                th.dropped = true; th.sx = d.sx; th.sy = d.sy; th.x = d.x; th.y = d.y;
                th.propsExtra = d.propsExtra; th.propsLost = d.propsLost; 
                th.actionsExtra = d.actionsExtra; th.actionsLost = d.actionsLost;
                world.sectorObjectCount += th.sx == position.sx && th.sy == position.sy ? 1 : 0;
            } else { delete th.dropped; }
        }
        for(var c = 0; c < world.containers.length; c++) {
            var ctr = world.containers[c];
            world.sectorObjectCount += ctr.sx == position.sx && ctr.sy == position.sy && ctr.realHealth > 0 ? 1 : 0;
        }
    };
    
    var applyContainerStatuses = function() {
        if(!world.containerDeltas) return;
        for(var cKey in world.containerDeltas) { if(!world.containerDeltas.hasOwnProperty(cKey)) continue;
            var pos = Util.positionFromSeed(cKey);
            var health = world.containerDeltas[cKey].split(':')[0];
            var lastHit = world.containerDeltas[cKey].split(':')[1];
            var cIndex = Util.objectInArray({guid:cKey},world.containers);
            if(cIndex >= 0) {
                world.containers[cIndex].health[0] = +health;
                world.containers[cIndex].realHealth = +health;
                world.containers[cIndex].lastHit = +lastHit;
            }
        }
    };
    
    return {
        initGame: function(g) {
            game = g;
            FireService.onValue('removed',function(removed) {
                for(var rKey in removed) { if(!removed.hasOwnProperty(rKey)) continue;
                    var pos = Util.positionFromSeed(rKey);
                    removed[rKey] = Things.spawnThing({sx:pos.sx,sy:pos.sy,x:pos.x,y:pos.y});
                    removed[rKey].removed = true;
                }
                world.removed = removed || {};
                applyRemovalsAndDrops();
                removedReady = true; onRemoved();
            });
            FireService.onValue('dropped',function(dropped) {
                for(var dKey in dropped) { if(!dropped.hasOwnProperty(dKey)) continue;
                    dropped[dKey] = Things.expandThings([dropped[dKey]])[0];
                }
                world.dropped = dropped || {};
                applyRemovalsAndDrops();
                droppedReady = true; onRemoved();
            });
            FireService.onValue('containers',function(containers) {
                if(!containers) return;
                world.containerDeltas = containers;
                applyContainerStatuses();
            });
        },
        update: function() {
            for(var i = 0; i < world.containers.length; i++) { // Regen container healths
                var ctr = world.containers[i];
                if(ctr.knockback && ctr.knockback[1] > 0) ctr.knockback[1]--;
                ctr.broke = ctr.health[0] == 0 || ctr.realHealth == 0;
                ctr.open = ctr.broke ? true : ctr.open;
                if(ctr.health[0] == ctr.health[1] || ctr.health[0] == 0 || ctr.realHealth == 0) continue;
                ctr.realHealth = game.ticks - ctr.lastHit > 2000 ? // ~33 seconds since last hit before regen
                    Math.min(ctr.health[1],ctr.health[0]+parseInt((game.ticks - (ctr.lastHit+1000))/300)) : ctr.health[0];
                if(ctr.realHealth == ctr.health[1]) FireService.remove('containers/'+ctr.guid);
            }
        },
        setRemovedCallback: function(cb) { onRemoved = cb; },
        setPosition: function(sx,sy,x,y) {
            var osx = position.sx, osy = position.sy;
            position.sx = sx; position.sy = sy; position.x = x; position.y = y;
            return getVicinity();
        },
        newSector: function() {
            generateContainersAndThings(); 
            applyRemovalsAndDrops();
            applyContainerStatuses();
        },
        getObjectsAt: function(sx,sy,x,y,type) {
            sx = type == 'cursor' ? position.sx : sx; sy = type == 'cursor' ? position.sy : sy;
            var objects = []; 
            if(x == '-' || position.sx != sx || position.sy != sy) return objects;
            var gameX = type == 'cursor' ? Math.floor(x/24)-2 : x, gameY = type == 'cursor' ? Math.floor(y/24)-2 : y;
            if(type == 'cursor' && (gameX >= game.arena.width - 4 || gameY >= game.arena.height - 4 || gameX < 0 || gameY < 0)) return objects;
            if(type == 'cursor' || type == 'all' || type == 'things') {
                for(var i = 0; i < world.things.length; i++) {
                    var tx = (world.things[i].sx - position.sx) * (game.arena.width - 4) + world.things[i].x,
                        ty = (world.things[i].sy - position.sy) * (game.arena.height - 4) + world.things[i].y;
                    if(tx == gameX && ty == gameY && (!world.things[i].removed || world.things[i].dropped)) {
                        objects.push(world.things[i]); }
                }
            }
            if(type == 'cursor' || type == 'all' || type == 'containers') {
                for(var j = 0; j < world.containers.length; j++) {
                    var cx = (world.containers[j].sx - position.sx) * (game.arena.width - 4) + world.containers[j].x,
                        cy = (world.containers[j].sy - position.sy) * (game.arena.height - 4) + world.containers[j].y;
                    if(cx == gameX && cy == gameY) objects.push(world.containers[j]);
                }
            }
            return objects;
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
                FireService.set('dropped/'+thing.guid,Things.shrinkThings([thing])[0]);
            }
        },
        attack: function(target,damage,dir) {
            if(target.realHealth <= 0) return;
            target.knockback = [dir,20,Util.randomIntRange(-2,2),damage];
            var newHealth = target.realHealth-damage;
            // TODO: Use transact to lower health
            FireService.set('containers/'+target.guid,Math.max(newHealth,0)+':'+game.ticks);
            if(newHealth <= 0) { // Container opened
                var contents = Containers.openContainer(target);
                var positions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]; // 8 spots around container
                for(var i = 0; i < contents.length; i++) {
                    var pos = positions.splice(Util.randomIntRange(0,positions.length-1),1)[0];
                    contents[i].sx = target.sx; contents[i].sy = target.sy;
                    contents[i].x = target.x + pos[0]; contents[i].y = target.y + pos[1];
                    FireService.set('dropped/'+contents[i].guid,Things.shrinkThings([contents[i]])[0]);
                }
            }
        },
        worldReady: function() { return removedReady; },
        world: world
    };
});