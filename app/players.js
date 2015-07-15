'use strict';
Application.Services.factory('Players',function(Renderer,Controls,World,Util,Things,FireService,localStorageService) {

    var revision = 4; // Stored player data format revision
    Math.seedrandom();
    var storedPlayer = localStorageService.get('player');
    storedPlayer = storedPlayer && storedPlayer.hasOwnProperty('rv') && storedPlayer.rv == revision ? storedPlayer :
        { sx: Util.randomIntRange(-5,5), sy: Util.randomIntRange(-5,5), x: 16, y: 10,
            score: 0, cash: 0, seeking: Things.newSeek(), guid: 'P'+Util.randomIntRange(0,1000000), rv: revision };
    localStorageService.set('player',storedPlayer);
    Math.seedrandom(storedPlayer.guid);
    var player = {
        sx: +storedPlayer.sx, sy: +storedPlayer.sy, x: +storedPlayer.x, y: +storedPlayer.y, 
        offset: { x: 0, y: 0 }, sectorMove: { x: 0, y: 0 },
        input: {}, score: +storedPlayer.score, cash: +storedPlayer.cash, seeking: storedPlayer.seeking, 
        guid: storedPlayer.guid, color: Util.randomColor('vibrant'), name: storedPlayer.name,
        carried: Things.expandThings(storedPlayer.carried) || []
    };
    var playerSpeed = 4, last = { offset: {  } };
    var game, world, tick;
    
    var storePlayer = function() {
        var storedPlayer = { sx: player.sx, sy: player.sy, x: player.x, y: player.y, 
            score: player.score, cash: player.cash, seeking: player.seeking, guid: player.guid, name: player.name,
            carried: Things.shrinkThings(player.carried), rv: revision };
        localStorageService.set('player',storedPlayer);
    };
    
    var move = function(c) {
        if(c.x == '-' || c.y == '-') return;
        var moveX = Math.floor(c.x/24)- 2, moveY = Math.floor(c.y/24)-2;
        var aw = game.arena.width - 4, ah = game.arena.height - 4;
        var moved = true;
        if(player.x  == moveX && player.y == moveY) moved = false;
        player.sx = player.osx + (moveX >= aw ? 1 : moveX < 0 ? -1 : 0);
        player.sy = player.osy + (moveY >= ah ? 1 : moveY < 0 ? -1 : 0);
        player.x = moveX >= aw ? moveX - aw : moveX < 0 ? aw + moveX : moveX;
        player.y = moveY >= ah ? moveY - ah : moveY < 0 ? ah + moveY : moveY;
        if(!moved) return;
        var storedName = player.name && player.name.trim() != '' ? ':' + player.name : '';
        FireService.set('players/'+player.guid,player.sx+':'+player.sy+':'+player.x+':'+player.y+storedName);
        player.vicinity = [];
    };
    
    var doMove = function(p) {
        if(p.hasOwnProperty('sectorMove')) {
            if(p.sectorMove.x != 0 || p.sectorMove.y != 0) { p.sectorMove.done = false; delete game.selected; }
            if(p.sectorMove.x != 0) p.sectorMove.x *= 0.85;
            if(p.sectorMove.y != 0) p.sectorMove.y *= 0.85;
            // TODO: Move this easing stuff to the renderer, make this decrease constant
            p.sectorMove.x = Math.abs(p.sectorMove.x) < 0.001 ? 0 : p.sectorMove.x;
            p.sectorMove.y = Math.abs(p.sectorMove.y) < 0.001 ? 0 : p.sectorMove.y;
            if(p.sectorMove.x == 0 && p.sectorMove.y == 0 &&
                p.sectorMove.rendered && !p.sectorMove.done) { World.newSector(); p.sectorMove.done = true; }
        }
        if(!p.hasOwnProperty('ox')) {  p.ox = p.x; p.oy = p.y; p.osx = p.sx; p.osy = p.sy; }
        p.moving = p.ox != p.x || p.oy != p.y || p.osx != p.sx || p.osy != p.sy;
        if(!p.moving) return;
        var aw = game.arena.width - 4, ah = game.arena.height - 4;
        var mx = p.x + (p.sx - p.osx) * aw, my = p.y + (p.sy - p.osy) * ah;
        var total = Util.getDistance(p.ox*24+p.offset.x,p.oy*24+p.offset.y, mx*24, my*24)/playerSpeed;
        var diff = Util.getXYdiff(p.ox*24+p.offset.x,p.oy*24+p.offset.y, mx*24, my*24);
        p.offset.x += diff.x * (1/total); p.offset.y += diff.y * (1/total);
        if(total >= 1) return;
        if(p.hasOwnProperty('sectorMove')) player.sectorMove = { x: p.sx - p.osx, y: p.sy - p.osy };
        p.moving = false; p.offset.x = 0; p.offset.y = 0; p.ox = p.x; p.oy = p.y; p.osx = p.sx; p.osy = p.sy;
        if(p.hasOwnProperty('sectorMove')) { storePlayer(); p.vicinity = World.setPosition(p.sx,p.sy,p.x,p.y); }
    };

    var thingIsCarried = function(thing) {
        if(!thing) return false;
        for(var i = 0; i < player.carried.length; i++) {
            if(player.carried[i].guid == thing.guid) return true;
        }
        return false;
    };
    
    var checkSeek = function() {
        for(var i = 0; i < player.carried.length; i++) {
            var carriedProps = Util.subtractArrays((player.carried[i].props || [])
                    .concat(player.carried[i].propsExtra || []), player.carried[i].propsLost || []);
            if(player.carried[i].name == player.seeking.properName && 
                jQuery.inArray(player.seeking.property,carriedProps) >= 0) {
                console.log('player has seeked object!!!');
                player.cash += 100;
                player.seeking = Things.newSeek();
                return true;
            }
        }
        return false;
    };
    
    var removeFromCarried = function(thing) {
        for(var i = 0; i < player.carried.length; i++) {
            if(player.carried[i].guid == thing.guid) {
                player.carried.splice(i,1); break;
            }
        }
        if(game.selected.guid == thing.guid) delete game.selected;
    };
    
    World.setRemovedCallback(function(){ player.vicinity = World.setPosition(player.sx,player.sy,player.x,player.y); });
    
    return {
        initGame: function(g) {
            game = g; world = World.world;
            player.vicinity = World.setPosition(player.sx,player.sy,player.x,player.y);
            World.newSector();
            var storedName = player.name && player.name.trim() != '' ? ':' + player.name : '';
            FireService.set('players/'+player.guid,player.sx+':'+player.sy+':'+player.x+':'+player.y+storedName);
            console.log('Player:',player.guid,player.sx+':'+player.sy);
            checkSeek();
            FireService.onValue('players',function(players) {
                if(!players) players = {};
                for(var pKey in players) { if(!players.hasOwnProperty(pKey)) continue;
                    if(pKey == player.guid) { players[pKey] = player; continue; }
                    var sx = +players[pKey].split(':')[0], sy = +players[pKey].split(':')[1],
                        x = +players[pKey].split(':')[2], y = +players[pKey].split(':')[3];
                    var moving = world.players[pKey] && (world.players[pKey].sx != sx || world.players[pKey].sy != sy ||
                        world.players[pKey].x != x || world.players[pKey].y != y);
                    var ox = world.players[pKey] ? world.players[pKey].ox : x,
                        oy = world.players[pKey] ? world.players[pKey].oy : y,
                        osx = world.players[pKey] ? world.players[pKey].osx : sx,
                        osy = world.players[pKey] ? world.players[pKey].osy : sy;
                    var name = players[pKey].split(':').length == 5 ? players[pKey].split(':')[4] : pKey;
                    Math.seedrandom(pKey);
                    players[pKey] = {
                        guid: pKey, sx: sx, sy: sy, x: x, y: y, moving: moving,
                        ox: ox, oy: oy, osx: osx, osy: osy, name: name,
                        offset: world.players[pKey] ? world.players[pKey].offset : { x: 0, y: 0 },
                        color: Util.randomColor('vibrant')
                    };
                }
                world.players = players;
            });
        },
        update: function(step,t) {
            tick = t;
            for(var pKey in world.players) { if(!world.players.hasOwnProperty(pKey)) continue;
                doMove(world.players[pKey]);
            }
        },
        hasMoved: function() {
            if(last.sx != player.sx || last.sy != player.sy || 
                last.offset.x != player.offset.x || last.offset.y != player.offset.y) {
                last.sx = player.sx; last.sy = player.sy; 
                last.offset.x = player.offset.x; last.offset.y = player.offset.y;
                return true;
            } else { return false; }
        },
        newSector: function() {
            if(last.sx != player.sx || last.sy != player.sy) {
                last.sx = player.sx; last.sy = player.sy;
                return true;
            } else { return false; }
        },
        takeThing: function(thing) {
            thing.removed = true;
            player.carried.push(thing);
            World.removeThing(thing);
            if(game.selected.guid == thing.guid) delete game.selected;
            storePlayer();
            checkSeek();
        },
        dropThing: function(thing) {
            thing.removed = false;
            removeFromCarried(thing);
            thing.sx = player.sx; thing.sy = player.sy;
            thing.x = player.x; thing.y = player.y;
            World.addThing(thing);
            storePlayer();
        },
        thingIsCarried: thingIsCarried,
        thingAction: function(thing,action) {
            if(thing.hasOwnProperty('t') && thing.t.guid == thing.s.guid) return; // Can't target self (maybe allow this?)
            action = action == 'continue' ? player.needTarget : action;
            var targets = thing.hasOwnProperty('t') ? 1 : 0;
            targets += thing.hasOwnProperty('t2') ? 1 : 0;
            targets += thing.hasOwnProperty('t3') ? 1 : 0; // Replace with countProperties
            if(Things.targetsRequired(action) > targets) {
                player.needTarget = action;
                return;
            }
            if(Things.doAction(thing,action)) {
                if(thing.c) { // If a child was created, set its position to the player's
                    thing.c.sx = player.sx; thing.c.sy = player.sy;
                    thing.c.x = player.x; thing.c.y = player.y;
                }
                for(var tKey in thing) { if(!thing.hasOwnProperty(tKey) || tKey == 'r') continue;
                    if(!thingIsCarried(thing[tKey])) {
                        World.removeThing(thing[tKey]); World.addThing(thing[tKey]);
                    }
                }
                if(thing.r) { // If removing something
                    removeFromCarried(thing.r);
                    World.removeThing(thing.r);
                }
                player.needTarget = false;
                storePlayer();
            }
            checkSeek();
        },
        clearPlayerData: function() {
            localStorageService.remove('player');
            FireService.remove('players/'+player.guid);
        },
        move: move,
        player: player
    };
});