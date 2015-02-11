'use strict';
Application.Services.factory('Player',function(Renderer,Controls,World,Util,localStorageService) {

    Math.seedrandom();
    var storedPlayer = localStorageService.get('player') || 
        { x: Util.randomIntRange(-100,100), y: Util.randomIntRange(-100,100), score: 0 };
    localStorageService.set('player',storedPlayer);
    var player = { 
        x: +storedPlayer.x, y: +storedPlayer.y, offset: { x: 0, y: 0 }, input: {}, score: +storedPlayer.score
    };
    var last = { offset: {  } };
    var moveStart, doneMoving;
    
    Renderer.addRender(function(c) {
        c.main.fillStyle = 'rgba(255,255,255,0.8)';
        var width = c.mainCanvas.width, height = c.mainCanvas.height;
        c.main.beginPath();
        c.main.arc(width/2, height/2, 8, 0, 2 * Math.PI, false);
        c.main.fill();
    });
    
    var move = function(dir) {
        player.moving = !player.moving ? dir : player.moving;
    };
    
    var doMove = function(step,tick) {
        if(!player.moving) return;
        moveStart = moveStart ? moveStart : tick;
        var progress = (tick - moveStart)/12;
        //progress += (1-progress)/3; // Ease out
        switch(player.moving) {
            case 'up': player.offset.y = progress*-24; break;
            case 'left': player.offset.x = progress*-24; break;
            case 'right': player.offset.x = progress*24; break;
            case 'down': player.offset.y = progress*24; break;
        }
        doneMoving = progress >= 1;
        if(!doneMoving) return;
        moveStart = doneMoving = false;
        switch(player.moving) {
            case 'up': player.y--; break;
            case 'left': player.x--; break;
            case 'right': player.x++; break;
            case 'down': player.y++; break;
        }
        var storedPlayer = { x: player.x, y: player.y, score: player.score };
        localStorageService.set('player',storedPlayer);
        player.vicinity = World.setPosition(player.x,player.y);
        player.moving = false; player.offset.x = player.offset.y = 0;
    };
    
    Controls.attachMoves(move);
    
    return {
        init: function() { },
        update: function(step,tick) {
            doMove(step,tick);
        },
        hasMoved: function() {
            if(last.x != player.x || last.y != player.y || last.offset.x != player.offset.x || last.offset.y != player.offset.y) {
                last.x = player.x; last.y = player.y; last.offset.x = player.offset.x; last.offset.y = player.offset.y;
                return true;
            } else {
                return false;
            }
        },
        move: move,
        player: player
    };
});