'use strict';
Application.Services.factory('Renderer',function(Canvas,Util) {

    var c, cmm; // Canvas and minimap objects
    var cursor = Canvas.cursor;
    var game, world, pix, mmWidth, mmHeight, mWidth, mHeight;
    var spriteImg, spriteLibrary, bgTiles = [], spriteThing, spriteCursor, sectorSpriteImg;
    var lastSO = { };
    
    var findSprite = function(thing) {
        var list = spriteLibrary.names[spriteLibrary.indexes[thing.id][0]]; // List of sprite mods
        var basePosition = spriteLibrary.indexes[thing.id][1]; // Position of base sprite in sheet
        var position = basePosition;
        for(var m = 1; m < list.length; m++) { // Loop through mods (not counting base)
            var modProps = list[m].split('+'); // Required props for this mod
            var modAccepted = true;
            for(var p = 0; p < modProps.length; p++) { // Loop through required props
                var propVariants = modProps[p].split('|'); // Interchangeable properties (broken|cut)
                var variantFound = false;
                for(var v = 0; v < propVariants.length; v++) { // Loop through variants until one found
                    if(jQuery.inArray(propVariants[v],thing.allProps) >= 0) {
                        variantFound = true; break;
                    }
                }
                if(!variantFound) { modAccepted = false; break; }
            }
            position = modAccepted ? basePosition + m : position;
        }
        return position;
    };
    
    return {
        init: function(g) { 
            c = Canvas.getCanvases(); game = g; pix = game.arena.pixels;
            mWidth = c.mainCanvas.width; mHeight = c.mainCanvas.height;
            // Load sprite sheet
            spriteImg = new Image();
            spriteImg.src = 'img/sprites.png';
            spriteLibrary = {
                indexes: {}, names: [
                    ['pencil','chewed|scratched','broken|cut','broken|cut+chewed|scratched'],
                    ['pen','scratched'],
                    ['paper','folded','cut','torn','written-on','folded+written-on','cut+written-on','torn+written-on'],
                    ['rock','scratched'],
                    ['stone','scratched'],
                    ['shovel','scratched','cut','cut+scratched'],
                    ['hammer','scratched','cut','cut+scratched'],
                    ['scissors','scratched','broken','broken+scratched'],
                    ['paperSnowflake','cut','torn'],
                    ['banana','cut','smashed','peeled','cut+peeled','peeled+smashed'],
                    ['bananaPeel','cut','smashed'],
                    ['guitar','scratched','broken','broken+scratched','cut','cut+scratched','written-on',
                        'scratched+written-on','broken+written-on','broken+scratched+written-on','cut+written-on',
                        'cut+scratched+written-on'],
                    ['stick','cut|broken'],
                    ['television','scratched','broken','broken+scratched'],
                    ['cellphone','scratched','broken','broken+scratched'],
                    ['chewingGum','cut','chewed','chewed+cut'],
                    ['eraser','cut','written-on','cut+written-on'],
                    ['coin','scratched'],
                    ['cookie','broken'],
                    ['bubbleWrap','cut','folded','popped','cut+popped','folded+popped'],
                    ['mirror','scratched','broken','broken+scratched'],
                    ['saw','scratched'],
                    ['axe','scratched']
                ]
            };
            var position = 0; // Build sprite name and position index list
            for(var n = 0; n < spriteLibrary.names.length; n++) {
                spriteLibrary.indexes[spriteLibrary.names[n][0]] = [n,position];
                position += spriteLibrary.names[n].length
            }
            // Load sector sprite sheet
            sectorSpriteImg = new Image();
            sectorSpriteImg.src = 'img/sector-sprites.png';
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
            var so = { x: Math.floor(game.player.sectorMove.x * (mWidth - pix*4)), 
                y: Math.floor(game.player.sectorMove.y * (mHeight - pix*4)) };
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
            // Render minimap
            if(!mmWidth) return;
            cmm.clearRect(0,0,mmWidth,mmHeight);
            cmm.fillStyle = 'rgba(47,56,60,0.7)';
            cmm.fillRect(0,0,mmWidth,mmHeight);
            var mmw = mmWidth / 9, mmh = mmHeight / 9;
            for(var mmsx = -5; mmsx <= 5; mmsx++) {
                for(var mmsy = -5; mmsy <= 5; mmsy++) {
                    var thingCount = game.player.explored[(+game.player.osx+mmsx)+','+(+game.player.osy+mmsy)];
                    if(thingCount >= 0) {
                        cmm.clearRect(mmw*(4+mmsx)+game.player.sectorMove.x*mmw,
                            mmh*(4+mmsy)+game.player.sectorMove.y*mmh,mmw,mmh);
                        if(thingCount > 60) thingCount = 7;
                        else if(thingCount > 40) thingCount = 6;
                        else if(thingCount > 30) thingCount = 5;
                        else if(thingCount > 20) thingCount = 4;
                        else if(thingCount > 14) thingCount = 3;
                        else if(thingCount > 8) thingCount = 2;
                        else if(thingCount > 4) thingCount = 1;
                        else if(thingCount >= 0) thingCount = 0;
                        cmm.drawImage(sectorSpriteImg,(thingCount+1)*mmw,0,mmw,mmh,mmw*(4+mmsx)+game.player.sectorMove.x*mmw,
                        mmh*(4+mmsy)+game.player.sectorMove.y*mmh,mmw,mmh);
                    }
                }
            }
            cmm.drawImage(sectorSpriteImg,0,0,mmw,21,mmw*4,mmh*4,mmw,mmh);
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
                if(t.removed && !t.dropped) continue; // Skip if object removed and not dropped
                var tdx = (t.sx - game.player.osx)*(game.arena.width-4) + t.x, 
                    tdy = (t.sy - game.player.osy)*(game.arena.height-4) + t.y;
                var drawX = (tdx+2) * pix+so.x, drawY = (tdy+2) * pix+so.y;
                if(drawX <= pix || drawX >= mWidth - pix
                    || drawY <= pix || drawY >= mHeight - pix) continue;
                if(spriteLibrary.indexes[t.id]) { // If this object has a sprite
                    var spritePosition = findSprite(t);
                    var spriteX = 24 * (spritePosition % 16),
                        spriteY = 24 * Math.floor(spritePosition / 16);
                    c.main.drawImage(spriteImg,spriteX,spriteY,pix,pix,drawX,drawY,pix,pix);
                } else { // No sprite, draw letter box
                    c.main.drawImage(spriteThing,drawX+6,drawY+6);
                    c.main.fillStyle = '#112244';
                    c.main.font = 'bold 11px Arial';c.main.textAlign = 'center';
                    var kerning = jQuery.inArray(t.name[0],['A','B','C','G','H','R']) >= 0 ? 1 : 0;
                    c.main.fillText(t.name[0],drawX+11+kerning,drawY+16);
                }
                // Draw on minimap
                //cmm.fillStyle = '#6699aa';
                //cmm.fillRect(Math.round(drawX/pix)-2+mmw*4,Math.round(drawY/pix)-2+mmh*4,1,1);
                // Draw select box
                if(cursor.hover.hasOwnProperty(t.guid)) {
                    var quality = Util.thingQuality(t.quality);
                    c.high.fillStyle = 'rgba('+quality.r+','+quality.g+','+quality.b+',1)';
                    c.high.shadowColor = 'rgba(0,0,0,1)'; c.high.shadowBlur = 3;
                    c.high.shadowOffsetX = 0; c.high.shadowOffsetY = 0;
                    var propsExtra = '';
                    if(t.propsExtra) {
                        for(var i = 0; i < t.propsExtra.length; i++) {
                            propsExtra += Util.capitalize(t.propsExtra[i]) + ' '; }
                    }
                    var grid = drawX+':'+drawY;
                    c.high.font = 'bold 16px Roboto'; c.high.textAlign = 'center';
                    c.high.fillText(quality.name+' '+propsExtra+t.name,
                        drawX+12,drawY-4-(16*(hoverCount[grid] || 0)));
                    c.high.shadowBlur = 0;
                    hoverCount[grid] = hoverCount[grid] ? hoverCount[grid] + 1 : 1;
                }
                // Draw hover info
                if(!game.selected || game.selected.guid != t.guid) continue;
                c.main.lineWidth = 2; c.main.strokeStyle = 'rgba(200,230,255,0.5)';
                c.main.beginPath();
                c.main.moveTo(drawX,drawY); c.main.lineTo(drawX + pix,drawY);
                c.main.lineTo(drawX + pix,drawY + pix); c.main.lineTo(drawX,drawY + pix);
                c.main.closePath(); c.main.stroke();
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
                drawPX += +p.offset.x; drawPY += +p.offset.y;
                cmm.fillStyle = 'rgba('+p.color.rgb.r+','+p.color.rgb.g+','+p.color.rgb.b+',0.8)';
                cmm.fillRect(Math.round(drawPX/pix)-3+mmw*4,Math.round(drawPY/pix)-3+mmh*4,3,3);
                if(drawPX < pix*-1 || drawPX > mWidth
                    || drawPY < pix*-1 || drawPY > mHeight) continue;
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
                // Render other player's names
                if(game.player.guid != pKey) {
                    c.high.fillStyle = 'rgba(240,240,240,1)';
                    c.high.shadowColor = 'rgba(0,0,0,1)';
                    c.high.shadowBlur = 3;
                    c.high.shadowOffsetX = 0;
                    c.high.shadowOffsetY = 0;
                    c.high.font = '11px Verdana'; c.high.textAlign = 'center';
                    c.high.fillText(p.name, drawPX + 12, drawPY - 1);
                    c.high.shadowBlur = 0;
                }
            }
        }
    };
});