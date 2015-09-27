'use strict';
Application.Services.factory('Players',function(Renderer,Pathfinder,World,Util,Things,SpriteMan,UIMan,FireService,localStorageService) {

    var revision = 11; // Stored player data format revision
    var allInv; // Backpack and toolbelt combined
    Math.seedrandom();
    var storedPlayer = localStorageService.get('player');
    storedPlayer = storedPlayer && storedPlayer.hasOwnProperty('rv') && storedPlayer.rv == revision ? storedPlayer :
        { sx: Util.randomIntRange(-3,3), sy: Util.randomIntRange(-6,6), x: 7, y: 7,
            score: 0, cash: 0, guid: 'P'+Util.randomIntRange(0,1000000), 
            rv: revision, explored: {}, name: storedPlayer && storedPlayer.name ? storedPlayer.name : null,
            backpack: [0,0,0,0,0,0,0,0], toolbelt: [0,0,0,0]
        };
    localStorageService.set('player',storedPlayer);
    Math.seedrandom(storedPlayer.guid);
    if(storedPlayer.inContainer) { // If player was in a container, put them back to the container in overworld
        storedPlayer.sx = +storedPlayer.inContainer.sx; storedPlayer.sy = +storedPlayer.inContainer.sy;
        storedPlayer.osx = +storedPlayer.inContainer.sx; storedPlayer.osy = +storedPlayer.inContainer.sy;
        storedPlayer.x = +storedPlayer.inContainer.x; storedPlayer.y = +storedPlayer.inContainer.y;
        storedPlayer.ox = +storedPlayer.inContainer.x; storedPlayer.oy = +storedPlayer.inContainer.y;
    }
    var player = {
        sx: +storedPlayer.sx, sy: +storedPlayer.sy, osx: +storedPlayer.sx, osy: +storedPlayer.sy, 
        x: +storedPlayer.x, y: +storedPlayer.y, ox: +storedPlayer.x, oy: +storedPlayer.y,
        input: {}, score: +storedPlayer.score, cash: +storedPlayer.cash, 
        guid: storedPlayer.guid, color: Util.randomColor('vibrant'), name: storedPlayer.name,
        backpack: Things.expandThings(storedPlayer.backpack), toolbelt: Things.expandThings(storedPlayer.toolbelt),
        explored: storedPlayer.explored
    };
    var playerSpeed = 1;
    var game, world, tick;
    
    var storePlayer = function() {
        var storedPlayer = { sx: player.sx, sy: player.sy, x: player.x, y: player.y, 
            score: player.score, cash: player.cash, guid: player.guid, name: player.name,
            backpack: Things.shrinkThings(player.backpack), toolbelt: Things.shrinkThings(player.toolbelt), 
            rv: revision, explored: player.explored, inContainer: player.inContainer };
        var oldStoredPlayer = localStorageService.get('player');
        if(oldStoredPlayer && player.inContainer) storedPlayer.explored = oldStoredPlayer.explored;
        localStorageService.set('player',storedPlayer);
    };
    
    var move = function(dest) {
        if(!dest) return;
        dest.rsx = dest.x >= game.arena.width ? 1 : dest.x < 0 ? -1 : 0;
        dest.rsy = dest.y >= game.arena.height ? 1 : dest.y < 0 ? -1 : 0;
        if(dest.rsx != 0 || dest.rsy != 0) {
            if(!Util.validOffSectorTiles[dest.x+':'+dest.y]) return;
        }
        var valid = true;
        if(player.ox == dest.x && player.oy == dest.y) valid = false;
        if(!valid) {
            takeThing(World.getObjectsAt(player.sx,player.sy,player.x,player.y,'things')[0]);
            onStopMovement();
            return;
        }
        //if(World.getObjectsAt(player.sx,player.sy,dest.x,dest.y,'containers').length > 0) valid = false;
        if(player.x + (player.sx-player.osx)*game.arena.width == dest.x
            && player.y + (player.sy-player.osy)*game.arena.height == dest.y) return; // Destination hasn't changed
        UIMan.removePrompt();
        delete player.containerPrompt;
        player.newDest = true; player.moving = true;
        player.sx = player.osx + dest.rsx; player.sy = player.osy + dest.rsy;
        player.x = dest.rsx > 0 ? 0 : dest.x < 0 ? game.arena.width-1 : dest.x;
        player.y = dest.rsy > 0 ? 0 : dest.y < 0 ? game.arena.height-1 : dest.y;
    };
    
    var doMove = function(p) {
        // TODO: Pathfind from in-between grid squares
        if(!p.moving) return;
        if((!p.path || p.newDest)) {
            var rel = {x:(p.sx - p.osx)  * game.arena.width + p.x, y:(p.sy - p.osy)  * game.arena.height + p.y};
            if(p.path) {
                p.path = [p.path[0]].concat(Pathfinder.pathfind(World.getMap(p),p.path[0],rel));
            } else {
                p.path = Pathfinder.pathfind(World.getMap(p),{x:p.ox,y:p.oy},rel);
            }
            p.newDest = false;
        }
        if(p.path[0].x == p.ox && p.path[0].y == p.oy) { p.moving = false; delete p.path; return; }
        var moveAmount = (Math.abs(p.path[0].x- p.ox) + Math.abs(p.path[0].y- p.oy) > 1 ? 0.084 : 0.12) * playerSpeed;
        if(!p.hasOwnProperty('moveProgress')) {
            p.moveProgress = moveAmount;
        } else {
            p.moveProgress += moveAmount;
            if(p.moveProgress >= 1) {
                p.ox = p.path[0].x;
                p.oy = p.path[0].y;
                if (p.guid == player.guid) {
                    World.setPosition(p.osx,p.osy,p.ox,p.oy,player.inContainer);
                }
                p.path.splice(0, 1);
                delete p.moveProgress;
                if (p.path.length < 1) {
                    var sxd = p.ox >= game.arena.width ? 1 : p.ox < 0 ? -1 : 0;
                    var syd = p.oy >= game.arena.height ? 1 : p.oy < 0 ? -1 : 0;
                    p.osx += sxd; p.osy += syd;
                    p.ox = sxd > 0 ? 0 : sxd < 0 ? game.arena.width-1 : p.ox;
                    p.oy = syd > 0 ? 0 : syd < 0 ? game.arena.height-1 : p.oy;
                    delete p.path;
                    p.moving = false;
                    if (p.guid == player.guid) {
                        World.setPosition(p.osx,p.osy,p.ox,p.oy,player.inContainer);
                        storePlayer(); onStopMovement();
                        if(Math.abs(sxd) + Math.abs(syd) > 0) { 
                            World.newSector(); 
                            if(!thingIsCarried(game.selected)) delete game.selected; 
                        }
                        exploreSector(player.sx,player.sy);
                    }
                }
            }
        }
    };
    
    var updateInv = function() { allInv = player.backpack.concat(player.toolbelt); };
    
    var onStopMovement = function() {
        var underPlayer = World.getObjectsAt(player.sx,player.sy,player.x,player.y,'all');
        for(var u = 0; u < underPlayer.length; u++) {
            if(!underPlayer[u].health) { takeThing(underPlayer[u]); } // If on thing, take it
            else if(!player.containerPrompt) { // If on container, prompt to enter
                player.containerPrompt = underPlayer[u];
                UIMan.createPrompt('enterContainer',function(){
                    player.inContainer = player.containerPrompt;
                    delete player.containerPrompt;
                    player.osx = 0; player.sx = 0; player.osy = 0; player.sy = 0; 
                    player.ox = 7; player.x = 7; player.oy = 7; player.y = 7;
                    World.setPosition(player.sx,player.sy,player.x,player.y,player.inContainer);
                    World.newSector();
                    storePlayer();
                    player.explored = {'0,0':0};
                },{ container: player.containerPrompt, player: player });
            }
        }
    };
    
    var takeThing = function(thing) {
        if(!thing) return;
        var stored = false;
        for(var j = 0; j < player.toolbelt.length; j++) { // First try toolbelt
            if(!player.toolbelt[j]) { player.toolbelt[j] = thing; stored = true; break; }
        }
        if(!stored) for(var i = 0; i < player.backpack.length; i++) { // Then try backpack
            if(!player.backpack[i]) { player.backpack[i] = thing; stored = true; break; }
        }
        if(stored) {
            World.removeThing(thing);
            exploreSector(player.sx,player.sy);
            updateInv();
        }
    };
    
    var thingIsCarried = function(thing) {
        if(!thing) return false;
        for(var i = 0; i < allInv.length; i++) {
            if(allInv[i] && allInv[i].guid == thing.guid) return true;
        }
        return false;
    };
    
    var removeFromCarried = function(thing) {
        for(var i = 0; i < player.backpack.length; i++) {
            if(player.backpack[i] && player.backpack[i].guid == thing.guid) {
                player.backpack[i] = 0; break;
            }
        }
        for(var j = 0; j < player.toolbelt.length; j++) {
            if(player.toolbelt[j] && player.toolbelt[j].guid == thing.guid) {
                player.toolbelt[j] = 0; break;
            }
        }
        if(game.selected && game.selected.guid == thing.guid) delete game.selected;
        storePlayer();
        updateInv();
    };
    
    var exploreSector = function(sx,sy) {
        player.explored[sx+','+sy] = World.world.sectorObjectCount;
        storePlayer();
    };
    
    var attack = function(dir) {
        
        // TODO: For abilities, show how the total damage is reached by showing the multipliers being applied
        
        if(player.attacking) return;
        return;
        player.attacking = { dir: dir, frame: 0, type: 'punch' };
        if(player.x + dir.x < 0 || player.y + dir.y < 0 || player.x + dir.x > 14 || player.y + dir.y > 14) return;
        var target = World.getObjectsAt(player.osx,player.osy,player.x + dir.x,player.y + dir.y,'containers')[0];
        if(target) {
            // Determine best attack ability
            var best = {dmg: 1, ability: 'punch'};
            for(var ti = 0; ti < player.toolbelt.length; ti++) {
                if(!player.toolbelt[ti]) continue;
                var toolAbilities = player.toolbelt[ti].abilities;
                for(var tia in toolAbilities) { if(!toolAbilities.hasOwnProperty(tia)) continue; // Tool abilities
                    if(player.toolbelt[ti].cooldown) continue;
                    var dmg = player.toolbelt[ti].power * (toolAbilities[tia] +
                        (player.toolbelt[ti].buffAbility == tia ? player.toolbelt[ti].buffAmount : 0));
                    var abiDmg = Math.round(dmg * (target[tia] || 1));
                    //console.log(player.toolbelt[ti].name,player.toolbelt[ti].baseDmg,tia,toolAbilities[tia],abiDmg);
                    if(abiDmg > best.dmg) {
                        best = { dmg: abiDmg, tool: player.toolbelt[ti], ability: tia };
                        if(target[tia]) best.combo = target[tia];
                    }
                }
            }
            if(best.tool) best.tool.cooldown = 
                [best.ability,Math.max(1,Things.abilities[best.ability].cooldown-best.tool.handling)*1];
            //best.ability = Util.pickInObject(Things.abilities); // Random ability
            player.attacking.type = best.ability;
            player.attacking.target = target;
            setTimeout(function(){ World.attack(target,best,dir,player); }, 
                SpriteMan.abiSpriteLib.indexes[best.ability].delay * 15.5 + 30);
        }
    };
    
    return {
        initGame: function(g) {
            game = g; world = World.world;
            updateInv();
            World.setPosition(player.sx,player.sy,player.x,player.y);
            World.newSector();
            var storedName = player.name && player.name.trim() != '' ?  player.name : '';
            FireService.set('players/'+player.guid,storedName);
            console.log('Player:',player.name,player.guid,player.sx+':'+player.sy);
            FireService.onValue('players',function(players) {
                if(!players) players = {};
                for(var pKey in players) { if(!players.hasOwnProperty(pKey)) continue;
                    if(pKey == player.guid) { players[pKey] = player; continue; }
                    var name = players[pKey].length > 0 ? players[pKey] : pKey;
                    var color;
                    if(world.players[pKey]) {
                        color = world.players[pKey].color;
                    } else {
                        Math.seedrandom(pKey);
                        color = Util.randomColor('vibrant');
                    }
                    players[pKey] = { guid: pKey, name: name, color: color };
                }
                world.players = players;
            });
        },
        update: function(step,t) {
            tick = t;
            doMove(player);
            if(player.moving) player.attacking = false;
            if(player.attacking) {
                if(player.attacking.hasOwnProperty('frame')) {
                    player.attacking.frame++;
                    var totalFrames = player.attacking.type == 'punch' ? 22 :
                        Things.abilities[player.attacking.type].time;
                    if(player.attacking.frame > totalFrames) player.attacking = false;
                } else {
                    console.log('unreachable code?');
                    player.attacking = { dir: player.attacking, frame: 0 };
                }
            }
            if(!(tick & 7)) { // Every 8 ticks
                for(var i = 0; i < allInv.length; i++) { if(!allInv[i]) continue;
                    if(allInv[i].cooldown) {
                        allInv[i].cooldown[1]--;
                        if(allInv[i].cooldown[1] <= 0) delete allInv[i].cooldown;
                    }
                }
                storePlayer();
            }
        },
        takeThing: takeThing,
        dropThing: function(thing) {
            if(!thing) return;
            thing.removed = false;
            removeFromCarried(thing);
            thing.sx = player.osx; thing.sy = player.osy;
            thing.x = player.ox; thing.y = player.oy;
            World.addThing(thing);
            exploreSector(player.osx,player.osy);
        },
        thingIsCarried: thingIsCarried,
        clearPlayerData: function() {
            localStorageService.set('player',{name:player.name});
            FireService.remove('players/'+player.guid);
        },
        move: move, removeFromCarried: removeFromCarried, updateInv: updateInv, storePlayer: storePlayer, attack: attack,
        player: player
    };
});