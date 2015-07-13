'use strict';
Application.Services.factory('Renderer',function(Canvas,Util) {

    var c, cmm; // Canvas and minimap objects
    var cursor = Canvas.cursor;
    var game, world, pix, mmWidth, mmHeight, mWidth, mHeight;
    var bgTiles = [], spriteThing, spriteCursor;
    var lastSO = { };
    
    return {
        init: function(g) { 
            c = Canvas.getCanvases(); game = g; pix = game.arena.pixels;
            mWidth = c.mainCanvas.width; mHeight = c.mainCanvas.height;
            // Create BG tiles
            var bgTileAlphas = [0.1,0.08,0.04,0.02];
            for(var i = 0; i < 4; i++) {
                bgTiles.push(document.createElement('canvas'));
                bgTiles[i].width = pix; bgTiles[i].height = pix;
                var ctx = bgTiles[i].getContext('2d');
                ctx.fillStyle = 'rgba(0,0,0,'+bgTileAlphas[i]+')';
                ctx.fillRect(0,0,pix,pix);
            }
            // Create sprite for things (with no letter)
            spriteThing = document.createElement('canvas');
            spriteThing.width = 12; spriteThing.height = 12;
            var spriteThingContext = spriteThing.getContext('2d');
            spriteThingContext.fillStyle = 'rgba(0,0,0,0.07)';
            spriteThingContext.fillRect(0,0,12,12);
            spriteThingContext.fillStyle = '#6699aa';
            spriteThingContext.fillRect(1,1,10,10);
            // Create sprite for mouse cursor highlight
            spriteCursor = document.createElement('canvas');
            spriteCursor.width = pix; spriteCursor.height = pix;
            var spriteCursorContext = spriteCursor.getContext('2d');
            spriteCursorContext.fillStyle = 'rgba(121,255,207,0.12)';
            spriteCursorContext.beginPath();
            spriteCursorContext.arc(pix/2, pix/2, pix/2, 0, 2 * Math.PI, false);
            spriteCursorContext.closePath(); spriteCursorContext.fill();
            spriteCursorContext.fillStyle = 'rgba(121,255,207,1)';
            spriteCursorContext.globalCompositeOperation = 'destination-out';
            spriteCursorContext.beginPath();
            spriteCursorContext.arc(pix/2, pix/2, pix/2-3, 0, 2 * Math.PI, false);
            spriteCursorContext.closePath(); spriteCursorContext.fill();
            spriteCursorContext.globalCompositeOperation = 'source-over';
        },
        initMinimap: function(mmcv,mmc) { cmm = mmc; mmWidth = mmcv.width; mmHeight = mmcv.height; },
        initWorld: function(w) { world = w; },
        drawFrame: function(rt,step,tick) {
            if(!c.main) return; Canvas.clear(); Canvas.clearHigh();
            var so = { x: game.player.sectorMove.x * (mWidth - pix*4), 
                y: game.player.sectorMove.y * (mHeight - pix*4) };
            if(lastSO.x != game.player.sectorMove.x || lastSO.y != game.player.sectorMove.y) { // Render background
                lastSO.x = game.player.sectorMove.x; lastSO.y = game.player.sectorMove.y;
                Canvas.clearUnder();
                for(var sw = -1; sw < 2; sw++) { for(var sh = -1; sh < 2; sh++) {
                    for(var w = 0; w < game.arena.width-4; w++) { for(var h = 0; h < game.arena.height-4; h++) {
                        var tileX = sw*(game.arena.width-4) + w, tileY = sh*(game.arena.height-4) + h;
                        var bgDrawX = (tileX+2)*pix+so.x, bgDrawY = (tileY+2)*pix+so.y;
                        if(bgDrawX < pix*-1 || bgDrawX >= 888 || 
                            bgDrawY < pix*-1 || bgDrawY >= 600) continue;
                        Math.seedrandom('bg'+Util.positionSeed(+game.player.osx+sw, +game.player.osy+sh, w, h));
                        var tileChance = Math.random();
                        if(tileChance < 0.002) {c.mainUnder.drawImage(bgTiles[0],bgDrawX,bgDrawY); }
                        else if(tileChance < 0.004) {c.mainUnder.drawImage(bgTiles[1],bgDrawX,bgDrawY); }
                        else if(tileChance < 0.06) {c.mainUnder.drawImage(bgTiles[2],bgDrawX,bgDrawY); }
                        else if(tileChance < 0.1) {c.mainUnder.drawImage(bgTiles[3],bgDrawX,bgDrawY); }
                    } }
                } }
                if(so.x == 0 && so.y == 0) game.player.sectorMove.rendered = true;
            }
            // Render sector buffer
            var buffer = pix*2;
            c.high.fillStyle = 'rgba(47,56,60,0.48)';
            c.high.fillRect(0,0, mWidth,buffer);
            c.high.fillRect(0,buffer, buffer, mHeight-buffer);
            c.high.fillRect(mWidth - buffer,buffer, buffer, mHeight-buffer*2);
            c.high.fillRect(buffer,mHeight-buffer, mWidth, buffer);
            // Render cursor highlight
            if(cursor.x != '-') c.high.drawImage(spriteCursor,parseInt(cursor.x/pix)*pix,parseInt(cursor.y/pix)*pix);
            // Render things
            var hoverCount = {};
            for(var j = 0; j < world.things.length; j++) {
                var t = world.things[j];
                if(t.removed && !t.dropped) continue; // If object removed
                var tdx = (t.sx - game.player.osx)*(game.arena.width-4) + t.x, 
                    tdy = (t.sy - game.player.osy)*(game.arena.height-4) + t.y;
                var drawX = (tdx+2) * pix+so.x, drawY = (tdy+2) * pix+so.y;
                if(drawX <= pix || drawX >= mWidth - pix
                    || drawY <= pix || drawY >= mHeight - pix) continue;
                c.main.drawImage(spriteThing,drawX+6,drawY+6);
                c.main.fillStyle = '#112244';
                c.main.font = 'bold 11px Arial';c.main.textAlign = 'center';
                var letterFix = jQuery.inArray(t.name[0],['R','H','B','G']) >= 0 ? 1 : 0;
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
                if(t.propsExtra) { 
                    for(var i = 0; i < t.propsExtra.length; i++) { 
                        propsExtra += Util.capitalize(t.propsExtra[i]) + ' '; } 
                }
                var grid = drawX+':'+drawY;
                c.high.fillText(propsExtra+t.name,drawX+12,drawY-4-(16*(hoverCount[grid] || 0)));
                c.high.shadowBlur = 0;
                hoverCount[grid] = hoverCount[grid] ? hoverCount[grid] + 1 : 1;
            }
            // Erase things from buffer
            c.main.clearRect(0,0, mWidth,buffer);
            c.main.clearRect(0,buffer, buffer, mHeight-buffer);
            c.main.clearRect(mWidth - buffer,buffer, buffer, mHeight-buffer*2);
            c.main.clearRect(buffer,mHeight-buffer, mWidth, buffer);
            // Render players
            for(var pKey in world.players) { if(!world.players.hasOwnProperty(pKey)) continue;
                var p = world.players[pKey];
                var pdx = (p.osx - game.player.osx)*(game.arena.width-4) + p.ox,
                    pdy = (p.osy - game.player.osy)*(game.arena.height-4) + p.oy;
                var drawPX = (pdx+2) * pix+so.x, drawPY = (pdy+2) * pix+so.y;
                if(drawPX < pix*-1 || drawPX > mWidth
                    || drawPY < pix*-1 || drawPY > mHeight) continue;
                drawPX += +p.offset.x; drawPY += +p.offset.y;
                // Render player move path
                if(game.player.guid == pKey && p.moving) {
                    var mx = p.x + (p.sx - p.osx) * (game.arena.width-4), 
                        my = p.y + (p.sy - p.osy) * (game.arena.height-4);
                    c.high.strokeStyle = 'rgba(121,255,207,0.08)'; c.high.lineWidth = 3;
                    c.high.beginPath(); c.high.moveTo(drawPX+pix/2,drawPY+pix/2);
                    c.high.lineTo((mx+2)*pix+pix/2, (my+2)*pix+pix/2);
                    c.high.stroke();
                    c.high.fillStyle = 'rgba(121,255,207,1)';
                    c.high.globalCompositeOperation = 'destination-out'; c.high.beginPath();
                    c.high.arc((mx+2)*pix+pix/2, (my+2)*pix+pix/2,
                        6, 0, 2 * Math.PI, false);
                    c.high.arc(drawPX+pix/2, drawPY+pix/2, 8, 0, 2 * Math.PI, false);
                    c.high.closePath(); c.high.fill();
                    c.high.globalCompositeOperation = 'source-over'; c.high.beginPath();
                    c.high.arc((mx+2)*pix+pix/2, (my+2)*pix+pix/2,
                        6, 0, 2 * Math.PI, false);
                    c.high.fillStyle = 'rgba(121,255,207,0.08)'; c.high.fill();
                }
                c.main.fillStyle = 'rgba('+p.color.rgb.r+','+p.color.rgb.g+','+p.color.rgb.b+',0.8)';
                c.main.beginPath(); c.main.arc(drawPX+pix/2, drawPY+pix/2, 8, 0, 2 * Math.PI, false); c.main.fill();
            }
            // Render minimap
            if(!mmWidth) return;
            cmm.clearRect(0,0,mmWidth,mmHeight);
            var mmw = mmWidth / 3, mmh = mmHeight / 3;
            cmm.fillStyle = 'rgba(47,56,60,0.48)';
            cmm.fillRect(0,0, mmWidth,mmh);
            cmm.fillRect(0,mmh, mmw, mmHeight-mmh);
            cmm.fillRect(mmWidth - mmw,mmh, mmw, mmHeight-mmh*2);
            cmm.fillRect(mmw,mmHeight-mmh, mmWidth-mmw, mmh);
        }
    };
});