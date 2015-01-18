'use strict';
Application.Services.factory('Player',function(Renderer,Controls) {

    var player = { 
        x: 0, y: 0, input: {}, score: 0
    };
    
    //Renderer.initPlayer(player);
    Renderer.addRender(function(c) {
        c.main.fillStyle = 'rgba(255,255,255,0.8)';
        var width = c.mainCanvas.width, height = c.mainCanvas.height;
        c.main.beginPath();
        c.main.arc(width/2, height/2, 8, 0, 2 * Math.PI, false);
        c.main.fill();
    });
    
    var move = function(dir) {
        switch(dir) {
            case 'up': player.y--; break;
            case 'left': player.x--; break;
            case 'right': player.x++; break;
            case 'down': player.y++; break;
        }
    };
    
    Controls.attachMoves(move);
    
    return {
        init: function() { },
        player: player
    };
});