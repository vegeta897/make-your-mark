'use strict';
Application.Services.factory('Renderer',function(Canvas,Util) {

    var c; // Canvas object
    var cursor = Canvas.cursor;
    var game, world;
    var renderArray = [];

    return {
        init: function(g) { c = Canvas.getCanvases(); game = g; },
        initWorld: function(w) { world = w; },
        drawBG: function(rt,step,tick) {
            Canvas.clearUnder();
            // Render background
            for(var bgw = -1; bgw < game.arena.width+1; bgw++) {
                for(var bgh = -1; bgh < game.arena.height+1; bgh++) {
                    Math.seedrandom('bg'+Util.positionSeed(+game.player.x + +bgw, +game.player.y + +bgh));
                    var tileChance = Math.random();
                    if(tileChance > 0.1) { continue; }
                    else if(tileChance < 0.002) {c.mainUnder.fillStyle = 'rgba(0,0,0,0.1)'; }
                    else if(tileChance < 0.005) {c.mainUnder.fillStyle = 'rgba(0,0,0,0.08)'; }
                    else if(tileChance < 0.02) {c.mainUnder.fillStyle = 'rgba(0,0,0,0.04)'; }
                    else {c.mainUnder.fillStyle = 'rgba(0,0,0,0.02)'; }
                    c.mainUnder.fillRect(bgw*game.arena.pixels-game.player.offset.x,bgh*game.arena.pixels-game.player.offset.y,
                        game.arena.pixels,game.arena.pixels);
                }
            }
        },
        drawFrame: function(rt,step,tick) {
            Canvas.clear();
            if(!c.main) return;
            // Render things
            var hoverCount = {};
            for(var j = 0; j < world.things.length; j++) {
                var t = world.things[j];
                c.main.fillStyle = '#6699aa';
                var drawX = (t.relative.x + Math.floor(game.arena.width / 2)) * game.arena.pixels-game.player.offset.x;
                var drawY = (t.relative.y + Math.floor(game.arena.height / 2)) * game.arena.pixels-game.player.offset.y;
                var grid = drawX+':'+drawY;
                c.main.fillRect(drawX+7,drawY+7,10,10);
                c.main.fillStyle = '#112244';
                c.main.font = 'bold 11px Arial';c.main.textAlign = 'center';
                c.main.fillText(t.name[0],drawX+11,drawY+16);
                // Draw hover/select box
                if(!cursor.hover.hasOwnProperty(t.guid) && !(game.selected && game.selected.guid == t.guid)) continue;
                c.main.lineWidth = 2;c.main.strokeStyle = game.selected && game.selected.guid == t.guid ?
                    'rgba(200,230,255,0.8)' : 'rgba(150,200,255,0.5)';
                c.main.beginPath();
                c.main.moveTo(drawX + 4,drawY + 4); c.main.lineTo(drawX + 20,drawY + 4);
                c.main.lineTo(drawX + 20,drawY + 20); c.main.lineTo(drawX + 4,drawY + 20);
                c.main.closePath(); c.main.stroke();
                c.main.font = '14px Verdana'; c.main.textAlign = 'center';
                c.main.fillStyle = 'rgba(240,240,240,1)';
                c.main.shadowColor = 'rgba(0,0,0,1)'; c.main.shadowBlur = 3;
                c.main.shadowOffsetX = 0; c.main.shadowOffsetY = 0;
                c.main.fillText(t.name,drawX+12,drawY-4-(16*(hoverCount[grid] || 0)));
                c.main.shadowBlur = 0;
                hoverCount[grid] = hoverCount[grid] ? hoverCount[grid] + 1 : 1;
            }
            // Render player
            for(var i = 0; i < renderArray.length; i++) {
                renderArray[i](c);
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