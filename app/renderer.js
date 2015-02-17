'use strict';
Application.Services.factory('Renderer',function(Canvas,Util) {

    var c; // Canvas object
    var cursor = Canvas.cursor;
    var game, world, pix;
    var renderArray = [];

    return {
        init: function(g) { c = Canvas.getCanvases(); game = g; pix = game.arena.pixels; },
        initWorld: function(w) { world = w; },
        drawBG: function(rt,step,tick) {
            Canvas.clearUnder();
            // Render background
            for(var sw = -1; sw < 2; sw++) { for(var sh = -1; sh < 2; sh++) {
                for(var w = 0; w < game.arena.width-4; w++) { for(var h = 0; h < game.arena.height-4; h++) {
                    var tileX = sw*(game.arena.width-4) + w, tileY = sh*(game.arena.height-4) + h;
                    if(tileX < -2 || tileX > game.arena.width || tileY < -2 || tileY > game.arena.height) continue;
                    Math.seedrandom('bg'+Util.positionSeed(+game.player.sx+sw, +game.player.sy+sh, w, h));
                    var tileChance = Math.random();
                    if(tileChance > 0.1) { continue; }
                    else if(tileChance < 0.002) {c.mainUnder.fillStyle = 'rgba(0,0,0,0.1)'; }
                    else if(tileChance < 0.005) {c.mainUnder.fillStyle = 'rgba(0,0,0,0.08)'; }
                    else if(tileChance < 0.02) {c.mainUnder.fillStyle = 'rgba(0,0,0,0.04)'; }
                    else {c.mainUnder.fillStyle = 'rgba(0,0,0,0.02)'; }
                    c.mainUnder.fillRect((tileX+2)*pix,(tileY+2)*pix,pix,pix);
                } }
            } }
        },
        drawFrame: function(rt,step,tick) {
            if(!c.main) return; Canvas.clear(); Canvas.clearHigh();
            // Render sector buffer
            var buffer = pix*2;
            c.high.fillStyle = 'rgba(47,56,60,0.48)';
            c.high.fillRect(0,0, c.highCanvas.width,buffer);
            c.high.fillRect(0,buffer, buffer, c.highCanvas.height-buffer);
            c.high.fillRect(c.highCanvas.width - buffer,buffer, buffer, c.highCanvas.height-buffer*2);
            c.high.fillRect(buffer,c.highCanvas.height-buffer, c.highCanvas.width, buffer);
            // Render things
            var hoverCount = {};
            for(var j = 0; j < world.things.length; j++) {
                var t = world.things[j];
                if(t.removed && !t.dropped) continue; // If object removed
                var tdx = (t.sx - game.player.sx)*(game.arena.width-4) + t.x, 
                    tdy = (t.sy - game.player.sy)*(game.arena.height-4) + t.y;
                if(tdx < -2 || tdx >= game.arena.width || tdy < -2 || tdy >= game.arena.height) continue;
                c.main.fillStyle = 'rgba(0,0,0,0.07)';
                var drawX = (tdx+2) * pix, drawY = (tdy+2) * pix;
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
            // Render players
            for(var pKey in world.players) { if(!world.players.hasOwnProperty(pKey)) continue;
                var p = world.players[pKey];
                var pdx = (p.sx - game.player.sx)*(game.arena.width-4) + p.x,
                    pdy = (p.sy - game.player.sy)*(game.arena.height-4) + p.y;
                if(pdx < -2 || pdx >= game.arena.width || pdy < -2 || pdy >= game.arena.height) continue;
                var drawPX = (pdx+2) * pix+game.player.offset.x, drawPY = (pdy+2) * pix+game.player.offset.y;
                if(game.player.guid == pKey) {
                    c.high.strokeStyle = 'rgba(121,255,207,0.08)'; c.high.lineWidth = 3;
                    c.high.beginPath(); c.high.moveTo(drawPX+pix/2,drawPY+pix/2);
                    c.high.lineTo(parseInt(cursor.x/pix)*pix+pix/2, parseInt(cursor.y/pix)*pix+pix/2);
                    c.high.stroke();
                    // Render cursor highlight
                    if(cursor.x != '-') { c.high.fillStyle = 'rgba(121,255,207,1)';
                        c.high.globalCompositeOperation = 'destination-out'; c.high.beginPath();
                        c.high.arc(parseInt(cursor.x/pix)*pix+pix/2, parseInt(cursor.y/pix)*pix+pix/2,
                            6, 0, 2 * Math.PI, false);
                        c.high.arc(drawPX+pix/2, drawPY+pix/2, 8, 0, 2 * Math.PI, false);
                        c.high.closePath(); c.high.fill();
                        c.high.globalCompositeOperation = 'source-over'; c.high.beginPath();
                        c.high.arc(parseInt(cursor.x/pix)*pix+pix/2, parseInt(cursor.y/pix)*pix+pix/2,
                            6, 0, 2 * Math.PI, false);
                        c.high.fillStyle = 'rgba(121,255,207,0.08)'; c.high.fill();
                    }
                }
                c.main.fillStyle = 'rgba('+p.color.rgb.r+','+p.color.rgb.g+','+p.color.rgb.b+',0.8)';
                c.main.beginPath(); c.main.arc(drawPX+pix/2, drawPY+pix/2, 8, 0, 2 * Math.PI, false); c.main.fill();
            }
            
            // Render move arrow
            
        },
        addRender: function(r) { renderArray.push(r); }
    };
});