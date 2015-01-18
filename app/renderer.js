'use strict';
Application.Services.factory('Renderer',function(Canvas,Util) {

    var c; // Canvas object
    var cursor = Canvas.cursor;
    var game;
    var renderArray = [];

    return {
        init: function(g) { c = Canvas.getCanvases(); game = g; },
        drawFrame: function(rt,step,tick) {
            Canvas.clear();
            if(!c.main) return;
            for(var bgw = -1; bgw < game.arena.width+1; bgw++) {
                for(var bgh = -1; bgh < game.arena.height+1; bgh++) {
                    Math.seedrandom(Util.positionSeed(+game.player.x + +bgw, +game.player.y + +bgh));
                    var tileChance = Math.random();
                    if(tileChance > 0.5) { continue; }
                    else if(tileChance < 0.03) {c.main.fillStyle = 'rgba(0,0,0,0.15)'; }
                    else if(tileChance < 0.1) {c.main.fillStyle = 'rgba(0,0,0,0.1)'; }
                    else if(tileChance < 0.3) {c.main.fillStyle = 'rgba(0,0,0,0.06)'; }
                    else {c.main.fillStyle = 'rgba(0,0,0,0.02)'; }
                    c.main.fillRect(bgw*game.arena.pixels-game.player.offset.x,bgh*game.arena.pixels-game.player.offset.y,
                        game.arena.pixels,game.arena.pixels);
                }
            }
            for(var i = 0; i < renderArray.length; i++) {
                renderArray[i](c);
            }
            if(cursor.quad) {
                c.main.fillStyle = 'rgba(255,255,255,0.3)';
                c.main.beginPath();
                switch(cursor.quad) {
                    case 'up':
                        c.main.moveTo(c.mainCanvas.width/2, c.mainCanvas.height/2 - 50);
                        c.main.lineTo(c.mainCanvas.width/2 + 20, c.mainCanvas.height/2 - 30);
                        c.main.lineTo(c.mainCanvas.width/2 - 20, c.mainCanvas.height/2 - 30);
                        break;
                    case 'down':
                        c.main.moveTo(c.mainCanvas.width/2, c.mainCanvas.height/2 + 50);
                        c.main.lineTo(c.mainCanvas.width/2 + 20, c.mainCanvas.height/2 + 30);
                        c.main.lineTo(c.mainCanvas.width/2 - 20, c.mainCanvas.height/2 + 30);
                        break;
                    case 'left':
                        c.main.moveTo(c.mainCanvas.width/2 - 50, c.mainCanvas.height/2);
                        c.main.lineTo(c.mainCanvas.width/2 - 30, c.mainCanvas.height/2 + 20);
                        c.main.lineTo(c.mainCanvas.width/2 - 30, c.mainCanvas.height/2 - 20);
                        break;
                    case 'right':
                        c.main.moveTo(c.mainCanvas.width/2 + 50, c.mainCanvas.height/2);
                        c.main.lineTo(c.mainCanvas.width/2 + 30, c.mainCanvas.height/2 + 20);
                        c.main.lineTo(c.mainCanvas.width/2 + 30, c.mainCanvas.height/2 - 20);
                        break;
                }
                c.main.fill();
            }
        },
        addRender: function(r) { renderArray.push(r); }
    };
});