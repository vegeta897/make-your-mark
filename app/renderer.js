'use strict';
Application.Services.factory('Renderer',function(Canvas,Util) {

    var c; // Canvas object
    var cursor = Canvas.cursor;
    var game, world, pix;
    var renderArray = [], lastSO = { };
    
    return {
        init: function(g) { c = Canvas.getCanvases(); game = g; pix = game.arena.pixels; },
        initWorld: function(w) { world = w; },
        drawFrame: function(rt,step,tick) {
            if(!c.main) return; Canvas.clear(); Canvas.clearHigh();
            var drawBG = lastSO.x != game.player.sectorMove.x || lastSO.y != game.player.sectorMove.y;
            var so = { x: game.player.sectorMove.x * (c.mainCanvas.width - pix*4), 
                y: game.player.sectorMove.y * (c.mainCanvas.height - pix*4) };
            if(drawBG) { // Render background
                lastSO.x = game.player.sectorMove.x; lastSO.y = game.player.sectorMove.y;
                Canvas.clearUnder();
                for(var sw = -1; sw < 2; sw++) { for(var sh = -1; sh < 2; sh++) {
                    for(var w = 0; w < game.arena.width-4; w++) { for(var h = 0; h < game.arena.height-4; h++) {
                        var tileX = sw*(game.arena.width-4) + w, tileY = sh*(game.arena.height-4) + h;
                        var bgDrawX = (tileX+2)*pix+so.x, bgDrawY = (tileY+2)*pix+so.y;
                        if(bgDrawX < pix*-1 || bgDrawX >= c.mainCanvas.width || 
                            bgDrawY < pix*-1 || bgDrawY >= c.mainCanvas.height) continue;
                        Math.seedrandom('bg'+Util.positionSeed(+game.player.sx+sw, +game.player.sy+sh, w, h));
                        var tileChance = Math.random(); if(tileChance > 0.05) continue;
                        else if(tileChance < 0.002) {c.mainUnder.fillStyle = 'rgba(0,0,0,0.1)'; }
                        else if(tileChance < 0.005) {c.mainUnder.fillStyle = 'rgba(0,0,0,0.08)'; }
                        else if(tileChance < 0.02) {c.mainUnder.fillStyle = 'rgba(0,0,0,0.04)'; }
                        else {c.mainUnder.fillStyle = 'rgba(0,0,0,0.02)'; }
                        c.mainUnder.fillRect(bgDrawX,bgDrawY,pix,pix);
                    } }
                } }
                if(so.x == 0 && so.y == 0) game.player.sectorMove.rendered = true;
            }
            // Render sector buffer
            var buffer = pix*2;
            c.high.fillStyle = 'rgba(47,56,60,0.48)';
            c.high.fillRect(0,0, c.highCanvas.width,buffer);
            c.high.fillRect(0,buffer, buffer, c.highCanvas.height-buffer);
            c.high.fillRect(c.highCanvas.width - buffer,buffer, buffer, c.highCanvas.height-buffer*2);
            c.high.fillRect(buffer,c.highCanvas.height-buffer, c.highCanvas.width, buffer);
            // Render cursor highlight
            if(cursor.x != '-') {
                c.high.fillStyle = 'rgba(121,255,207,0.12)';
                c.high.beginPath();
                c.high.arc(parseInt(cursor.x/pix)*pix+pix/2, parseInt(cursor.y/pix)*pix+pix/2,
                    pix/2, 0, 2 * Math.PI, false);
                c.high.closePath(); c.high.fill();
                c.high.fillStyle = 'rgba(121,255,207,1)';
                c.high.globalCompositeOperation = 'destination-out';
                c.high.beginPath();
                c.high.arc(parseInt(cursor.x/pix)*pix+pix/2, parseInt(cursor.y/pix)*pix+pix/2,
                    pix/2-3, 0, 2 * Math.PI, false);
                c.high.closePath(); c.high.fill();
                c.high.globalCompositeOperation = 'source-over';
            }
            // Render things
            var hoverCount = {};
            for(var j = 0; j < world.things.length; j++) {
                var t = world.things[j];
                if(t.removed && !t.dropped) continue; // If object removed
                var tdx = (t.sx - game.player.sx)*(game.arena.width-4) + t.x, 
                    tdy = (t.sy - game.player.sy)*(game.arena.height-4) + t.y;
                c.main.fillStyle = 'rgba(0,0,0,0.07)';
                var drawX = (tdx+2) * pix+so.x, drawY = (tdy+2) * pix+so.y;
                if(drawX <= pix || drawX >= c.mainCanvas.width - pix
                    || drawY <= pix || drawY >= c.mainCanvas.height - pix) continue;
                c.main.fillRect(drawX+6,drawY+6,12,12);
                c.main.fillStyle = '#6699aa';
                c.main.fillRect(drawX+7,drawY+7,10,10);
                c.main.fillStyle = '#112244';
                c.main.font = 'bold 11px Arial';c.main.textAlign = 'center';
                var letterFix = jQuery.inArray(t.name[0],['R','H','B']) >= 0 ? 1 : 0;
                c.main.fillText(t.name[0],drawX+11+letterFix,drawY+16);
                // Draw hover/select box
                if(!cursor.hover.hasOwnProperty(t.guid) && !(game.selected && game.selected.guid == t.guid)) continue;
                c.main.lineWidth = 2;c.main.strokeStyle = game.selected && game.selected.guid == t.guid ?
                    'rgba(200,230,255,0.8)' : 'rgba(150,200,255,0.5)';
                c.main.beginPath();
                c.main.moveTo(drawX + 4,drawY + 4); c.main.lineTo(drawX + 20,drawY + 4);
                c.main.lineTo(drawX + 20,drawY + 20); c.main.lineTo(drawX + 4,drawY + 20);
                c.main.closePath(); c.main.stroke();
                c.high.font = '14px Verdana'; c.high.textAlign = 'center';
                c.high.fillStyle = 'rgba(240,240,240,1)';
                c.high.shadowColor = 'rgba(0,0,0,1)'; c.high.shadowBlur = 3;
                c.high.shadowOffsetX = 0; c.high.shadowOffsetY = 0;
                var propsExtra = '';
                if(t.hasOwnProperty('propsExtra')) { 
                    for(var i = 0; i < t.propsExtra.length; i++) { 
                        propsExtra += Util.capitalize(t.propsExtra[i]) + ' '; } 
                }
                var grid = drawX+':'+drawY;
                c.high.fillText(propsExtra+t.name,drawX+12,drawY-4-(16*(hoverCount[grid] || 0)));
                c.high.shadowBlur = 0;
                hoverCount[grid] = hoverCount[grid] ? hoverCount[grid] + 1 : 1;
            }
            // Erase things from buffer
            c.main.clearRect(0,0, c.mainCanvas.width,buffer);
            c.main.clearRect(0,buffer, buffer, c.mainCanvas.height-buffer);
            c.main.clearRect(c.mainCanvas.width - buffer,buffer, buffer, c.mainCanvas.height-buffer*2);
            c.main.clearRect(buffer,c.mainCanvas.height-buffer, c.mainCanvas.width, buffer);
            // Render players
            for(var pKey in world.players) { if(!world.players.hasOwnProperty(pKey)) continue;
                var p = world.players[pKey];
                var pdx = (p.sx - game.player.sx)*(game.arena.width-4) + p.x,
                    pdy = (p.sy - game.player.sy)*(game.arena.height-4) + p.y;
                var drawPX = (pdx+2) * pix+so.x, drawPY = (pdy+2) * pix+so.y;
                if(drawPX < pix*-1 || drawPX > c.mainCanvas.width
                    || drawPY < pix*-1 || drawPY > c.mainCanvas.height) continue;
                // Render player move path
                if(game.player.guid == pKey && game.player.moving) {
                    drawPX += game.player.offset.x; drawPY += +game.player.offset.y;
                    c.high.strokeStyle = 'rgba(121,255,207,0.08)'; c.high.lineWidth = 3;
                    c.high.beginPath(); c.high.moveTo(drawPX+pix/2,drawPY+pix/2);
                    c.high.lineTo((game.player.moving.x+2)*pix+pix/2, (game.player.moving.y+2)*pix+pix/2);
                    c.high.stroke();
                    c.high.fillStyle = 'rgba(121,255,207,1)';
                    c.high.globalCompositeOperation = 'destination-out'; c.high.beginPath();
                    c.high.arc((game.player.moving.x+2)*pix+pix/2, (game.player.moving.y+2)*pix+pix/2,
                        6, 0, 2 * Math.PI, false);
                    c.high.arc(drawPX+pix/2, drawPY+pix/2, 8, 0, 2 * Math.PI, false);
                    c.high.closePath(); c.high.fill();
                    c.high.globalCompositeOperation = 'source-over'; c.high.beginPath();
                    c.high.arc((game.player.moving.x+2)*pix+pix/2, (game.player.moving.y+2)*pix+pix/2,
                        6, 0, 2 * Math.PI, false);
                    c.high.fillStyle = 'rgba(121,255,207,0.08)'; c.high.fill();
                }
                c.main.fillStyle = 'rgba('+p.color.rgb.r+','+p.color.rgb.g+','+p.color.rgb.b+',0.8)';
                c.main.beginPath(); c.main.arc(drawPX+pix/2, drawPY+pix/2, 8, 0, 2 * Math.PI, false); c.main.fill();
            }
            
            
        },
        addRender: function(r) { renderArray.push(r); }
    };
});