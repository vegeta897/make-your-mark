'use strict';
Application.Services.factory('World',function(Util,Dungeon,Things,Containers,SpriteMan,FireService) {

    var position = { sx: 0, sy: 0, x: 0, y: 0}, inContainer;
    var game;
    var world = { things: [], removed: {}, dropped: {}, containers: [], players: {}, sectorObjectCount: 0,
        nearSectors: {}, map: {}, thrown: {} };
    var removedReady = false, droppedReady = false;
    
    var generateContainersAndThings = function() {
        world.things = [];
        world.containers = [];
        var newSectors = {}, newMap = {};
        for(var sw = -1; sw < 2; sw++) { for(var sh = -1; sh < 2; sh++) { // Include neighbor sectors
            if(Math.abs(sw) + Math.abs(sh) > 1) continue; // Don't include diagonals
            var sectorKey = (+position.sx+sw)+':'+(+position.sy+sh);
            // Copy stored sector objects/map if not new sector
            if(world.nearSectors[sectorKey]) { 
                newSectors[sectorKey] = world.nearSectors[sectorKey];
                newMap[sectorKey] = world.map[sectorKey];
                continue;
            }
            newMap[sectorKey] = {'15:6':true,'15:7':true,'15:8':true,'-1:6':true,'-1:7':true,'-1:8':true,
                '6:15':true,'7:15':true,'8:15':true,'6:-1':true,'7:-1':true,'8:-1':true};
            newSectors[sectorKey] = {things:[],containers:[]}; // Sector not near, spawn objects
            Math.seedrandom('ctg'+Util.positionSeed(+position.sx+sw, +position.sy+sh, 0, 0));
            var containersSpawned = 0;
            for(var w = 0; w < game.arena.width; w++) { for(var h = 0; h < game.arena.height; h++) {
                newMap[sectorKey][w+':'+h] = true;
                // 2% initial chance of container, diminishes with each spawn
                if(Math.random() <= 0.02 / (containersSpawned + 1)
                    && w > 0 && h > 0 && w < game.arena.width - 1 && h < game.arena.height - 1
                    && (w != 7 || h != 7)) { // Don't spawn on edges or in center of sector
                    containersSpawned++;
                    newSectors[sectorKey].containers.push(
                        Containers.spawnContainer(+position.sx+sw, +position.sy+sh, w, h));
                    //newMap[sectorKey][w+':'+h] = false;
                } else if(Math.random() <= 0.0007) {
                    newSectors[sectorKey].things.push(
                        Things.spawnThing({sx:+position.sx+sw, sy:+position.sy+sh, x:w, y:h}));
                }
            } }
        } }
        world.nearSectors = newSectors;
        world.map = newMap;
        for(var sKey in world.nearSectors) { if(!world.nearSectors.hasOwnProperty(sKey)) continue;
            world.things = world.things.concat(world.nearSectors[sKey].things);
            world.containers = world.containers.concat(world.nearSectors[sKey].containers);
        }
    };
    
    var generateDungeon = function() {
        world.things = [];
        world.containers = [];
        var dungeon = Dungeon.buildDungeon(inContainer);
        for(var rKey in dungeon.rooms) { if(!dungeon.rooms.hasOwnProperty(rKey)) continue;
            world.map[rKey] = dungeon.rooms[rKey].tiles;
        }
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
            world.sectorObjectCount += th.sx == position.sx && th.sy == position.sy && !th.removed ? 1 : 0;
            if(world.dropped.hasOwnProperty(th.guid)) {
                var d = world.dropped[th.guid];
                th.dropped = true; th.sx = d.sx; th.sy = d.sy; th.x = d.x; th.y = d.y;
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
            var pguid = world.containerDeltas[cKey].split(':')[2];
            var ability = world.containerDeltas[cKey].split(':')[3];
            var cIndex = Util.objectInArray({guid:cKey},world.containers);
            if(cIndex >= 0) {
                var container = world.containers[cIndex];
                container.health[0] = +health;
                var dmg = container.realHealth - +health;
                container.realHealth = +health;
                container.lastHit = +lastHit;
                if(pguid != game.player.guid) {
                    for(var x = -1; x <= 1; x++) { for(var y = -1; y <= 1; y++) {
                        if(Math.abs(x)+Math.abs(y) != 1 || !world.players[pguid]
                            || container.sx != game.player.osx || container.sy != game.player.osy) continue;
                        if(container.x == +world.players[pguid].ox+x && container.y == +world.players[pguid].oy+y) {
                            world.players[pguid].attacking = { dir: {x:x,y:y}, frame: 0, target: container, type: ability };
                            setTimeout(function(ctr){
                                    ctr.newHit = true;
                                    ctr.knockback = { dir:{x:x,y:y},
                                        hit: {dmg: dmg, ability: ability}, player: world.players[pguid] };
                                }(container),
                                SpriteMan.abiSpriteLib.indexes[ability].delay * 15.5 + 30);
                            break;
                        }
                    }}
                }
            }
        }
    };

    var addThing = function(thing) {
        //Things.changeThing(thing,thing.id);
        var child = thing.guid.split('-');
        var origPos = Util.positionFromSeed(child[0]);
        if(origPos.sx == thing.sx && origPos.sy == thing.sy && origPos.x == thing.x && origPos.y == thing.y &&
            !thing.changedFrom) { FireService.remove('removed/'+thing.guid); // Dropped in original spot with no change
        } else { // Dropped somewhere else and/or with changes
            FireService.set('dropped/'+thing.guid,Things.shrinkThings([thing])[0]);
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
                removedReady = true;
            });
            FireService.onValue('dropped',function(dropped) {
                for(var dKey in dropped) { if(!dropped.hasOwnProperty(dKey)) continue;
                    dropped[dKey] = Things.expandThings([dropped[dKey]])[0];
                }
                world.dropped = dropped || {};
                applyRemovalsAndDrops();
                droppedReady = true;
            });
            FireService.onValue('containers',function(containers) {
                if(!containers) return;
                world.containerDeltas = containers;
                applyContainerStatuses();
            });
            FireService.onAddChild('thrown',function(thrown,thrownKey) {
                world.thrown[thrownKey] = Things.expandThings([thrown])[0];
                world.thrown[thrownKey].dest = thrown.dest;
            });
            FireService.onRemoveChild('thrown',function(thrown,thrownKey) {
                delete world.thrown[thrownKey];
            });
        },
        update: function(tick) {
            for (var i = 0; i < world.containers.length; i++) {
                var ctr = world.containers[i];
                // Diminish knockback
                ctr.knocked.x = ctr.knocked.x <= 1 ? 0 : Math.round(ctr.knocked.x / 1.5);
                ctr.knocked.y = ctr.knocked.y <= 1 ? 0 : Math.round(ctr.knocked.y / 1.5);
                // Regen container healths
                if (ctr.realHealth < ctr.health[1]) ctr.pristine = false;
                ctr.broke = ctr.health[0] == 0 || ctr.realHealth == 0;
                ctr.open = ctr.broke ? true : ctr.open;
                if (ctr.health[0] == ctr.health[1] || ctr.health[0] == 0 || ctr.realHealth == 0) continue;
                ctr.realHealth = tick - ctr.lastHit > 2000 ? // ~33 seconds since last hit before regen
                    Math.min(ctr.health[1], 
                        ctr.health[0] + Math.floor((tick - (ctr.lastHit + 2000)) / 30)) : ctr.health[0];
                if (ctr.realHealth == ctr.health[1] && !ctr.pristine) {
                    FireService.remove('containers/' + ctr.guid);
                    ctr.pristine = true;
                }
            }
            for(var throwKey in world.thrown) { if(!world.thrown.hasOwnProperty(throwKey)) continue;
                var thrown = world.thrown[throwKey], phys;
                if(!thrown.done) {
                    if(thrown.hasOwnProperty('physics')) {
                        phys = thrown.physics;
                        phys.x += phys.vx; phys.y += phys.vy; phys.z += phys.vz;
                        if(phys.z <= 0) {
                            phys.vz *= -0.3; phys.vx *= 0.6; phys.vy *= 0.6;
                            phys.z = Math.max(phys.z,0);
                            //if(phys.vz < 0.04) phys.vz = 0;
                        }
                        if(phys.x < 0 || phys.x > game.arena.width-1) {
                            phys.vx *= -0.7; phys.vz *= 0.9;
                            phys.x = Math.max(0,Math.min(phys.x,game.arena.width-1));
                        }
                        if(phys.y < 0 || phys.y > game.arena.height-1) {
                            phys.vy *= -0.7; phys.vz *= 0.9;
                            phys.y = Math.max(0,Math.min(phys.y,game.arena.height-1));
                        }
                        phys.vz -= 0.01;
                        thrown.x = Math.round(phys.x); thrown.y = Math.round(phys.y);
                        if(Math.abs(phys.vx) + Math.abs(phys.vy) + Math.abs(phys.vz) + Math.abs(phys.z) < 0.01) {
                            thrown.done = true;
                        }
                    } else {
                        var xDist = thrown.dest.x - thrown.x, yDist = thrown.dest.y - thrown.y;
                        var power = Math.min(5,Math.sqrt(xDist * xDist + yDist * yDist));
                        var rad = Math.atan2(yDist,xDist);
                        xDist = Math.cos(rad); yDist = Math.sin(rad);
                        thrown.physics = {
                            x: thrown.x, y: thrown.y, z: 0.5,
                            vx: power * xDist / 20, vy: power * yDist / 20,
                            vz: Math.min(0.21,0.03 * power)
                        };
                    }
                } else {
                    phys = thrown.physics;
                    // TODO: Prevent thrown objects from landing on containers
                    var diff = {x: thrown.x - phys.x, y: thrown.y - phys.y};
                    phys.x += diff.x / 4; phys.y += diff.y / 4;
                    if(Math.abs(diff.x) < 0.02 && Math.abs(diff.y) < 0.02) {
                        addThing(thrown);
                        FireService.remove('thrown/'+thrown.guid);
                    }
                }
            }
        },
        setPosition: function(sx,sy,x,y,ic) {
            position.sx = sx; position.sy = sy; position.x = x; position.y = y;
            if(!inContainer && ic) {
                inContainer = ic; generateDungeon();
            }
        },
        newSector: function() {
            if(inContainer) return;
            generateContainersAndThings(); 
            applyRemovalsAndDrops();
            applyContainerStatuses();
        },
        getObjectsAt: function(sx,sy,x,y,type) {
            sx = type == 'cursor' ? position.sx : sx; sy = type == 'cursor' ? position.sy : sy;
            var objects = [];
            if(x == '-' || position.sx != sx || position.sy != sy) return objects;
            if(type == 'cursor' && (x >= game.arena.width || y >= game.arena.height || x < 0 || y < 0)) return objects;
            if(type == 'cursor' || type == 'all' || type == 'things') {
                for(var i = 0; i < world.things.length; i++) {
                    var tx = (world.things[i].sx - position.sx) * (game.arena.width) + world.things[i].x,
                        ty = (world.things[i].sy - position.sy) * (game.arena.height) + world.things[i].y;
                    if(tx == x && ty == y && (!world.things[i].removed || world.things[i].dropped)) {
                        objects.push(world.things[i]); }
                }
            }
            if(type == 'cursor' || type == 'all' || type == 'containers') {
                for(var j = 0; j < world.containers.length; j++) {
                    var cx = (world.containers[j].sx - position.sx) * (game.arena.width) + world.containers[j].x,
                        cy = (world.containers[j].sy - position.sy) * (game.arena.height) + world.containers[j].y;
                    if(cx == x && cy == y) objects.push(world.containers[j]);
                }
            }
            return objects;
        },
        removeThing: function(thing) {
            FireService.set('removed/'+thing.guid,1); FireService.remove('dropped/'+thing.guid);
        },
        addThing: addThing,
        attack: function(target,hit,dir,player) {
            if(target.realHealth <= 0) return;
            if(hit.ability != 'punch') game.addEvent({target:target,hit:hit});
            target.newHit = true;
            target.knockback = { dir:dir, hit:hit, player:player };
            var newHealth = target.realHealth-hit.dmg;
            // TODO: Use transact to lower health
            FireService.set('containers/'+target.guid,
                Math.max(newHealth,0)+':'+game.ticks+':'+game.player.guid+':'+hit.ability);
            if(newHealth <= 0) { // Container opened
                var contents = Containers.openContainer(target);
                var positions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]; // 8 spots around container
                for(var i = 0; i < contents.length; i++) {
                    var pos = positions.splice(Util.randomIntRange(0,positions.length-1),1)[0];
                    contents[i].sx = target.sx; contents[i].sy = target.sy;
                    contents[i].x = target.x; contents[i].y = target.y;
                    var thrown = Things.shrinkThings([contents[i]])[0];
                    thrown.dest = {x:target.x + pos[0], y:target.y + pos[1]};
                    FireService.set('thrown/'+contents[i].guid,thrown);
                }
            }
        },
        getMap: function(s) { 
            var sectorKey = s.osx + ':' + s.osy;
            if(!world.map || !world.map[sectorKey]) return false; else return world.map[sectorKey]; },
        worldReady: function() { return removedReady && droppedReady; },
        clearMapData: function() {
            FireService.remove('dropped'); FireService.remove('containers'); FireService.remove('removed');
        },
        world: world
    };
});