'use strict';
Application.Services.factory('Player',function(Renderer,Controls,World,Util,Things,FireService,localStorageService) {

    Math.seedrandom();
    var storedPlayer = localStorageService.get('player') || 
        { x: Util.randomIntRange(-60,60), y: Util.randomIntRange(-60,60), 
            score: 0, guid: 'P'+Util.randomIntRange(0,1000000) };
    localStorageService.set('player',storedPlayer);
    Math.seedrandom(storedPlayer.guid);
    var player = { 
        x: +storedPlayer.x, y: +storedPlayer.y, offset: { x: 0, y: 0 }, 
        input: {}, score: +storedPlayer.score, guid: storedPlayer.guid, color: Util.randomColor('vibrant'),
        carried: Things.expandThings(storedPlayer.carried) || []
    };
    var last = { offset: {  } };
    var moveStart, doneMoving, game;
    
    //Renderer.addRender(function(c) {
    //    c.main.fillStyle = 'rgba('+player.color.rgb.r+','+player.color.rgb.g+','+player.color.rgb.b+',0.8)';
    //    var width = c.mainCanvas.width, height = c.mainCanvas.height;
    //    c.main.beginPath();
    //    c.main.arc(width/2, height/2, 8, 0, 2 * Math.PI, false);
    //    c.main.fill();
    //});
    
    var storePlayer = function() {
        var storedPlayer = { x: player.x, y: player.y, score: player.score, guid: player.guid,
            carried: Things.shrinkThings(player.carried) };
        localStorageService.set('player',storedPlayer);
    };
    
    var move = function(dir) {
        player.moving = !player.moving ? dir : player.moving;
    };
    
    var doMove = function(step,tick) {
        if(!player.moving) return;
        moveStart = moveStart ? moveStart : tick;
        var progress = (tick - moveStart)/12;
        switch(player.moving) {
            case 'up': player.offset.y = progress*-24; break;
            case 'left': player.offset.x = progress*-24; break;
            case 'right': player.offset.x = progress*24; break;
            case 'down': player.offset.y = progress*24; break;
        }
        doneMoving = progress >= 1;
        if(!doneMoving) return;
        moveStart = false; doneMoving = false;
        switch(player.moving) {
            case 'up': player.y--; break;
            case 'left': player.x--; break;
            case 'right': player.x++; break;
            case 'down': player.y++; break;
        }
        storePlayer();
        FireService.set('players/'+player.guid,player.x+':'+player.y);
        player.vicinity = World.setPosition(player.x,player.y);
        player.moving = false; player.offset.x = 0; player.offset.y = 0;
    };

    var thingIsCarried = function(thing) {
        if(!thing) return false;
        for(var i = 0; i < player.carried.length; i++) {
            if(player.carried[i].guid == thing.guid) return true;
        }
        return false;
    };
    
    World.setRemovedCallback(function(){ player.vicinity = World.setPosition(player.x,player.y); });
    Controls.attachMoves(move);
    
    return {
        initGame: function(g) {
            game = g;
            player.vicinity = World.setPosition(player.x,player.y);
            FireService.set('players/'+player.guid,player.x+':'+player.y);
            console.log('Player:',player.guid,player.x+':'+player.y);
        },
        update: function(step,tick) {
            doMove(step,tick);
        },
        hasMoved: function() {
            if(last.x != player.x || last.y != player.y || 
                last.offset.x != player.offset.x || last.offset.y != player.offset.y) {
                last.x = player.x; last.y = player.y; 
                last.offset.x = player.offset.x; last.offset.y = player.offset.y;
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