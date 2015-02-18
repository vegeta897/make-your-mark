'use strict';
Application.Services.factory('Player',function(Renderer,Controls,World,Util,Things,FireService,localStorageService) {

    var revision = 1; // Stored player data format revision
    Math.seedrandom();
    var storedPlayer = localStorageService.get('player');
    storedPlayer = storedPlayer.hasOwnProperty('rv') && storedPlayer.rv == revision ? storedPlayer :
        { sx: Util.randomIntRange(-10,10), sy: Util.randomIntRange(-10,10), x: 16, y: 10,
            score: 0, guid: 'P'+Util.randomIntRange(0,1000000), rv: revision };
    localStorageService.set('player',storedPlayer);
    Math.seedrandom(storedPlayer.guid);
    var player = {
        sx: +storedPlayer.sx, sy: +storedPlayer.sy, x: +storedPlayer.x, y: +storedPlayer.y, offset: { x: 0, y: 0 }, 
        input: {}, score: +storedPlayer.score, guid: storedPlayer.guid, color: Util.randomColor('vibrant'),
        carried: Things.expandThings(storedPlayer.carried) || []
    };
    var last = { offset: {  } };
    var game, tick;
    
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
        if(!player.moving && player.x == moveX && player.y == moveY) return;
        player.moving = { x: moveX, y: moveY };
    };
    
    var doMove = function() {
        if(!player.moving) return;
        var mx = player.moving.x, my = player.moving.y;
        var total = Util.getDistance(player.x*24+player.offset.x,player.y*24+player.offset.y,mx*24,my*24)/2.4;
        var diff = Util.getXYdiff(player.x*24+player.offset.x,player.y*24+player.offset.y,mx*24,my*24);
        player.offset.x += diff.x * (1/total); player.offset.y += diff.y * (1/total);
        if(total >= 1) return;
        var aw = game.arena.width - 4, ah = game.arena.height - 4;
        player.sx += mx >= aw ? 1 : mx < 0 ? -1 : 0;
        player.sy += my >= ah ? 1 : my < 0 ? -1 : 0;
        player.x = mx >= aw ? mx - aw : mx < 0 ? aw + mx : mx;
        player.y = my >= ah ? my - ah : my < 0 ? ah + my : my;
        storePlayer();
        FireService.set('players/'+player.guid,player.sx+':'+player.sy+':'+player.x+':'+player.y);
        player.vicinity = World.setPosition(player.sx,player.sy,player.x,player.y);
        player.moving = false; player.offset.x = 0; player.offset.y = 0;
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
            game = g;
            player.vicinity = World.setPosition(player.sx,player.sy,player.x,player.y);
            FireService.set('players/'+player.guid,player.sx+':'+player.sy+':'+player.x+':'+player.y);
            console.log('Player:',player.guid,player.sx+':'+player.sy);
        },
        update: function(step,t) {
            tick = t; doMove();
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