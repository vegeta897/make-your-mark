'use strict';
Application.Services.factory('Players',function(Renderer,Controls,World,Util,Things,FireService,localStorageService) {

    var revision = 1; // Stored player data format revision
    Math.seedrandom();
    var storedPlayer = localStorageService.get('player');
    storedPlayer = storedPlayer.hasOwnProperty('rv') && storedPlayer.rv == revision ? storedPlayer :
        { sx: Util.randomIntRange(-10,10), sy: Util.randomIntRange(-10,10), x: 16, y: 10,
            score: 0, guid: 'P'+Util.randomIntRange(0,1000000), rv: revision };
    localStorageService.set('player',storedPlayer);
    Math.seedrandom(storedPlayer.guid);
    var player = {
        sx: +storedPlayer.sx, sy: +storedPlayer.sy, x: +storedPlayer.x, y: +storedPlayer.y, 
        offset: { x: 0, y: 0 }, sectorMove: { x: 0, y: 0 },
        input: {}, score: +storedPlayer.score, guid: storedPlayer.guid, color: Util.randomColor('vibrant'),
        carried: Things.expandThings(storedPlayer.carried) || []
    };
    var last = { offset: {  } };
    var game, world, tick;
    
    //Renderer.addRender(function(c) {
    //    c.main.fillStyle = 'rgba('+player.color.rgb.r+','+player.color.rgb.g+','+player.color.rgb.b+',0.8)';
    //    var width = c.mainCanvas.width, height = c.mainCanvas.height;
    //    c.main.beginPath();
    //    c.main.arc(width/2, height/2, 8, 0, 2 * Math.PI, false);
    //    c.main.fill();
    //});
    
    var storePlayer = function() {
        var storedPlayer = { sx: player.sx, sy: player.sy, x: player.x, y: player.y, 
            score: player.score, guid: player.guid, carried: Things.shrinkThings(player.carried), rv: revision };
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
        FireService.set('players/'+player.guid,player.sx+':'+player.sy+':'+player.x+':'+player.y);
    };
    
    var doMove = function(p) {
        if(p.hasOwnProperty('sectorMove')) {
            if(p.sectorMove.x != 0 || p.sectorMove.y != 0) p.sectorMove.done = false;
            if(p.sectorMove.x != 0) p.sectorMove.x *= 0.9-(Math.abs(p.sectorMove.x)/50);
            if(p.sectorMove.y != 0) p.sectorMove.y *= 0.9-(Math.abs(p.sectorMove.y)/50);
            p.sectorMove.x = Math.abs(p.sectorMove.x) < 0.002 ? 0 : p.sectorMove.x;
            p.sectorMove.y = Math.abs(p.sectorMove.y) < 0.002 ? 0 : p.sectorMove.y;
            if(p.sectorMove.x == 0 && p.sectorMove.y == 0 &&
                p.sectorMove.rendered && !p.sectorMove.done) { World.newSector(); p.sectorMove.done = true; }
        }
        if(!p.hasOwnProperty('ox')) {  p.ox = p.x; p.oy = p.y; p.osx = p.sx; p.osy = p.sy; }
        p.moving = p.ox != p.x || p.oy != p.y || p.osx != p.sx || p.osy != p.sy;
        if(!p.moving) return;
        var aw = game.arena.width - 4, ah = game.arena.height - 4;
        var mx = p.x + (p.sx - p.osx) * aw, my = p.y + (p.sy - p.osy) * ah;
        var total = Util.getDistance(p.ox*24+p.offset.x,p.oy*24+p.offset.y, mx*24, my*24)/2.4;
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
    
    World.setRemovedCallback(function(){ player.vicinity = World.setPosition(player.sx,player.sy,player.x,player.y); });
    
    return {
        initGame: function(g) {
            game = g; world = World.world;
            player.vicinity = World.setPosition(player.sx,player.sy,player.x,player.y);
            World.newSector();
            FireService.set('players/'+player.guid,player.sx+':'+player.sy+':'+player.x+':'+player.y);
            console.log('Player:',player.guid,player.sx+':'+player.sy);

            FireService.onValue('players',function(players) {
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
                    Math.seedrandom(pKey);
                    players[pKey] = {
                        guid: pKey, sx: sx, sy: sy, x: x, y: y, moving: moving,
                        ox: ox, oy: oy, osx: osx, osy: osy,
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
            delete game.selected;
            storePlayer();
        },
        dropThing: function(thing) {
            thing.removed = false;
            for(var i = 0; i < player.carried.length; i++) {
                if(player.carried[i].guid == thing.guid) {
                    player.carried.splice(i,1); break;
                }
            }
            thing.x = player.x; thing.y = player.y;
            World.addThing(thing);
            delete game.selected;
            storePlayer();
        },
        thingIsCarried: thingIsCarried,
        thingAction: function(s,a) {
            if(s.hasOwnProperty('t') && s.t.guid == s.s.guid) return; // Can't target self (maybe allow this?)
            a = a == 'continue' ? player.needTarget : a;
            var targets = s.hasOwnProperty('t') ? 1 : 0;
            targets += s.hasOwnProperty('t2') ? 1 : 0;
            targets += s.hasOwnProperty('t3') ? 1 : 0; // Replace with countProperties
            if(Things.targetsRequired(a) > targets) {
                player.needTarget = a;
                return;
            }
            if(Things.doAction(s,a)) {
                for(var tKey in s) { if(!s.hasOwnProperty(tKey)) continue;
                    if(!thingIsCarried(s[tKey])) {
                        World.removeThing(s[tKey]); World.addThing(s[tKey]);
                    }
                }
                player.needTarget = false;
                storePlayer();
            }
        },
        move: move,
        player: player
    };
});