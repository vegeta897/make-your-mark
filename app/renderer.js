'use strict';
Application.Services.factory('Renderer',function(Canvas,Util) {

    var c; // Canvas object
    var cursor = Canvas.cursor;
    var game, world;
    var renderArray = [];

    return {
        init: function(g) { c = Canvas.getCanvases(); game = g; },
        initWorld: function(w) { world = w; },
        drawFrame: function(rt,step,tick) {
            Canvas.clear();
            if(!c.main) return;
            // Render background
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
            // Render world
            for(var j = 0; j < world.things.length; j++) {
                var t = world.things[j];
                c.main.fillStyle = '#6699aa';
                var drawX = (t.relative.x + Math.floor(game.arena.width / 2)) * game.arena.pixels-game.player.offset.x;
                var drawY = (t.relative.y + Math.floor(game.arena.height / 2)) * game.arena.pixels-game.player.offset.y;
                c.main.fillRect(drawX+7,drawY+7,10,10);
            }
            // Render player
            for(var i = 0; i < renderArray.length; i++) {
                renderArray[i](c);
            }
            if(cursor.onThing) {
                var cx = Math.floor(cursor.x / game.arena.pixels) * game.arena.pixels-game.player.offset.x;
                var cy = Math.floor(cursor.y / game.arena.pixels) * game.arena.pixels-game.player.offset.y;
                c.main.lineWidth = 2;c.main.strokeStyle = 'rgba(150,200,255,0.5)';
                c.main.beginPath();
                c.main.moveTo(cx + 4,cy + 4);
                c.main.lineTo(cx + 20,cy + 4);
                c.main.lineTo(cx + 20,cy + 20);
                c.main.lineTo(cx + 4,cy + 20);
                c.main.closePath();
                c.main.stroke();
            }
            // Render move arrow
            if(cursor.quad) {
                c.main.fillStyle = 'rgba(255,255,255,0.1)';
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