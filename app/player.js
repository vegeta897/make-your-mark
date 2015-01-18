'use strict';
Application.Services.factory('Player',function(Renderer,Controls) {

    var player = { 
        x: 0, y: 0, offset: { x: 0, y: 0 }, input: {}, score: 0
    };
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
        var progress = (tick - moveStart)/15;
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
        player.moving = false; player.offset.x = player.offset.y = 0;
    };
    
    Controls.attachMoves(move);
    
    return {
        init: function() { },
        update: function(step,tick) {
            doMove(step,tick);
            
        },
        move: move,
        player: player
    };
});