'use strict';
Application.Services.factory('Renderer',function(Canvas,Util) {

    var c, cmm; // Canvas and minimap objects
    var cursor = Canvas.cursor;
    var game, world, pix, mmWidth, mmHeight, mWidth, mHeight;
    var thingSpriteImg, thingSpriteLib, containerSpriteImg, containerSpriteLib,
        tinyNumbersImg, bgTiles = [], genericSprite, cursorSprite, sectorSpriteImg;
    var lastSO = {};
    var graphicsRevision = 0;
    
    var disableShadow = function(canvas) {
        canvas.shadowColor = 'transparent';
        canvas.shadowBlur = 0; canvas.shadowOffsetX = 0; canvas.shadowOffsetY = 0;
    };
    
    var findSprite = function(thing) {
        var list = thingSpriteLib.names[thingSpriteLib.indexes[thing.id][0]]; // List of sprite mods
        var basePosition = thingSpriteLib.indexes[thing.id][1]; // Position of base sprite in sheet
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
            thingSpriteImg = new Image();
            thingSpriteImg.src = 'img/thing-sprites.png';
            thingSpriteLib = {
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
                    ['guitar','scratched','broken','broken+scratched','cut','cut+scratched','written-on','scratched+written-on','broken+written-on','broken+scratched+written-on','cut+written-on','cut+scratched+written-on'],
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
            var position = 0; // Build thing sprite name and position index list
            for(var n = 0; n < thingSpriteLib.names.length; n++) {
                thingSpriteLib.indexes[thingSpriteLib.names[n][0]] = [n,position];
                position += thingSpriteLib.names[n].length
            }
            // Load container sprite sheet
            containerSpriteImg = new Image();
            containerSpriteImg.src = 'img/container-sprites.png?'+graphicsRevision;
            containerSpriteLib = {
                bag: 0, // Row index of first of container type (add tierNum to get other tiers)
                present: 4
            };
            // Load sector sprite sheet
            sectorSpriteImg = new Image();
            sectorSpriteImg.src = 'img/sector-sprites.png?'+graphicsRevision;
            tinyNumbersImg = new Image();
            tinyNumbersImg.src = 'img/tiny-numbers.png?'+graphicsRevision; // Tiny numbers font
            // Create BG tiles
            var bgTileAlphas = [0.1,0.08,0.04,0.02];
            for(var i = 0; i < 4; i++) {
                bgTiles.push(document.createElement('canvas'));
                bgTiles[i].width = pix; bgTiles[i].height = pix;
                var ctx = bgTiles[i].getContext('2d');
                ctx.fillStyle = 'rgba(0,0,0,'+bgTileAlphas[i]+')';
                ctx.fillRect(0,0,pix,pix);
            }
            // Create generic sprite for missing image
            genericSprite = document.createElement('canvas');
            genericSprite.width = 24; genericSprite.height = 24;
            var spriteThingContext = genericSprite.getContext('2d');
            spriteThingContext.shadowColor = 'rgba(0,0,0,0.3)';
            spriteThingContext.shadowBlur = 4;
            spriteThingContext.shadowOffsetX = 2;
            spriteThingContext.shadowOffsetY = 1;
            spriteThingContext.fillStyle = 'rgba(0,0,0,0.3)';
            spriteThingContext.fillRect(4,4,16,16);
            spriteThingContext.fillStyle = '#6699aa';
            spriteThingContext.fillRect(5,5,14,14);
            // Create sprite for mouse cursor highlight
            cursorSprite = document.createElement('canvas');
            cursorSprite.width = pix; cursorSprite.height = pix;
            var cursorSpriteContext = cursorSprite.getContext('2d');
            cursorSpriteContext.fillStyle = 'rgba(121,255,207,0.12)';
            cursorSpriteContext.beginPath();
            cursorSpriteContext.arc(pix/2, pix/2, pix/2, 0, 2 * Math.PI, false);
            cursorSpriteContext.closePath(); cursorSpriteContext.fill();
            cursorSpriteContext.fillStyle = 'rgba(121,255,207,1)';
            cursorSpriteContext.globalCompositeOperation = 'destination-out';
            cursorSpriteContext.beginPath();
            cursorSpriteContext.arc(pix/2, pix/2, pix/2-3, 0, 2 * Math.PI, false);
            cursorSpriteContext.closePath(); cursorSpriteContext.fill();
            cursorSpriteContext.globalCompositeOperation = 'source-over';
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
                        if(thingCount > 30) thingCount = 7;
                        else if(thingCount > 20) thingCount = 6;
                        else if(thingCount > 14) thingCount = 5;
                        else if(thingCount > 9) thingCount = 4;
                        else if(thingCount > 5) thingCount = 3;
                        else if(thingCount > 2) thingCount = 2;
                        else if(thingCount > 0) thingCount = 1;
                        else thingCount = 0;
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
            if(cursor.x != '-') c.high.drawImage(cursorSprite,parseInt(cursor.x/pix)*pix,parseInt(cursor.y/pix)*pix);
            var hoverCount = {};
            // Render objects
            var objects = world.things.concat(world.containers);
            for(var j = objects.length-1; j >= 0; j--) {
                var o = objects[j];
                if(o.removed && !o.dropped) continue; // Skip if object removed and not dropped
                var tdx = (o.sx - game.player.osx)*(game.arena.width-4) + o.x, 
                    tdy = (o.sy - game.player.osy)*(game.arena.height-4) + o.y;
                var drawX = (tdx+2) * pix+so.x, drawY = (tdy+2) * pix+so.y;
                if(drawX <= pix || drawX >= mWidth - pix
                    || drawY <= pix || drawY >= mHeight - pix) continue;
                var knockX = 0, knockY = 0;
                var dirXY = [];
                if(o.knockback && o.knockback[1] > 0) switch(o.knockback[0]) {
                    case 'left': 
                        knockX = parseInt(-Math.pow(o.knockback[1],2)/70*(1.2-o.realHealth/o.health[1]));
                        knockY = parseInt(o.knockback[2] * o.knockback[1]/20*(1.2-o.realHealth/o.health[1])); 
                        dirXY = [-1,0]; break;
                    case 'right': 
                        knockX = parseInt(Math.pow(o.knockback[1],2)/70*(1.2-o.realHealth/o.health[1]));
                        knockY = parseInt(o.knockback[2] * o.knockback[1]/20*(1.2-o.realHealth/o.health[1]));
                        dirXY = [1,0]; break;
                    case 'up': 
                        knockY = parseInt(-Math.pow(o.knockback[1],2)/70*(1.2-o.realHealth/o.health[1]));
                        knockX = parseInt(o.knockback[2] * o.knockback[1]/20*(1.2-o.realHealth/o.health[1]));
                        dirXY = [0,-1]; break;
                    case 'down': 
                        knockY = parseInt(Math.pow(o.knockback[1],2)/70*(1.2-o.realHealth/o.health[1]));
                        knockX = parseInt(o.knockback[2] * o.knockback[1]/20*(1.2-o.realHealth/o.health[1]));
                        dirXY = [0,1]; break;
                }
                if(thingSpriteLib.indexes.hasOwnProperty(o.id)) { // If this thing has a sprite
                    c.main.shadowColor = 'rgba(0,0,0,0.3)';
                    c.main.shadowBlur = 4;
                    c.main.shadowOffsetX = 2;
                    c.main.shadowOffsetY = 1;
                    var thingSpritePos = findSprite(o);
                    var thingSpriteX = 24 * (thingSpritePos % 16),
                        thingSpriteY = 24 * Math.floor(thingSpritePos / 16);
                    c.main.drawImage(thingSpriteImg, thingSpriteX, thingSpriteY, pix, pix, 
                        drawX, drawY, pix, pix);
                    disableShadow(c.main);
                } else if(containerSpriteLib.hasOwnProperty(o.id)) { // If this container has a sprite
                    c.main.shadowColor = 'rgba(0,0,0,0.3)';
                    c.main.shadowBlur = 4;
                    c.main.shadowOffsetX = 2;
                    c.main.shadowOffsetY = 1;
                    var containerSpriteX = o.open ? o.broke ? 48 : 24 : 0,
                        containerSpriteY = (containerSpriteLib[o.id] + o.tierNum) * 24;
                    c.main.drawImage(containerSpriteImg, containerSpriteX, containerSpriteY, pix, pix,
                        drawX+knockX, drawY+knockY, pix, pix);
                    disableShadow(c.main);
                } else { // No sprite, draw letter box
                    c.main.drawImage(genericSprite,drawX+knockX, drawY+knockY);
                    c.main.shadowBlur = 0;
                    c.main.fillStyle = '#112244';
                    c.main.font = 'bold 14px Arial';c.main.textAlign = 'center';
                    var kerning = jQuery.inArray(o.name[0],['A','B','C','G','H','R','M']) >= 0 ? 1 : 0;
                    c.main.fillText(o.name[0],drawX+11+kerning+knockX,drawY+17+knockY);
                }
                if(o.newHit) { // If hit and haven't created fx yet
                    game.effects.push({type:'damage', amt: o.knockback[3], dirXY: dirXY,
                        ox: drawX + pix/2 + 16*dirXY[0], oy: drawY, time: 30,
                        vx: dirXY[0] * 12 + Util.randomIntRange(-8,8), vy: -Util.randomIntRange(25,40)});
                    for(var pe = 0; pe < 12; pe++) {
                        game.effects.push({ type:'spark', color: o.colors ? Util.pickInArray(o.colors) : 'ffffff',
                            ox: drawX + pix/2 - dirXY[0]*pix/4, oy: drawY + pix/2 - dirXY[1]*pix/4,
                            vx: dirXY[0] * 16 + Util.randomIntRange(-pix,pix), vy: -Util.randomIntRange(20,50),
                            ground: drawY + Util.randomIntRange(16,28), time: Util.randomIntRange(20,60) });
                    }
                    o.newHit = false;
                }
                var showHealth = o.health && o.realHealth < o.health[1];
                // Draw container health
                if(showHealth) {
                    var under = o.x == game.player.ox && o.y == game.player.oy + 1 ? pix+6 : 0;
                    c.main.fillStyle = 'rgba(0,0,0,0.7)';
                    c.main.fillRect(drawX+1+knockX,drawY-5+knockY+under,pix,5);
                    c.main.fillStyle = 'white';
                    c.main.fillRect(drawX+knockX,drawY-6+knockY+under,pix,5);
                    var hp = o.realHealth/ o.health[1];
                    c.main.fillStyle = 'rgba(0,0,0,0.9)';
                    c.main.fillRect(drawX-1+pix+knockX,drawY-5+knockY+under,parseInt((pix-2)*(1-hp))*-1,3);
                }
                // Draw select box
                if(cursor.hover.hasOwnProperty(o.guid)) {
                    var quality = Util.objectQuality(o);
                    c.high.fillStyle = 'rgba('+quality.r+','+quality.g+','+quality.b+',1)';
                    c.high.shadowColor = 'rgba(0,0,0,1)'; c.high.shadowBlur = 3;
                    c.high.shadowOffsetX = 0; c.high.shadowOffsetY = 0;
                    var propsExtra = '';
                    if(o.propsExtra) {
                        for(var i = 0; i < o.propsExtra.length; i++) {
                            propsExtra += Util.capitalize(o.propsExtra[i]) + ' '; }
                    }
                    var grid = drawX+':'+drawY;
                    var healthSpacing = showHealth ? 8 : 0;
                    c.high.font = 'bold 16px Roboto'; c.high.textAlign = 'center';
                    c.high.fillText(quality.name+' '+propsExtra+o.name,
                        drawX+12,drawY-3-healthSpacing-(16*(hoverCount[grid] || 0)));
                    c.high.shadowBlur = 0;
                    hoverCount[grid] = hoverCount[grid] ? hoverCount[grid] + 1 : 1;
                }
                // Draw hover info
                if(!game.selected || game.selected.guid != o.guid) continue;
                c.main.lineWidth = 2; c.main.strokeStyle = 'rgba(200,230,255,0.5)';
                c.main.beginPath();
                c.main.moveTo(drawX,drawY); c.main.lineTo(drawX + pix,drawY);
                c.main.lineTo(drawX + pix,drawY + pix); c.main.lineTo(drawX,drawY + pix);
                c.main.closePath(); c.main.stroke();
            }
            // Draw effects
            for(var f = 0; f < game.effects.length; f++) {
                var efx = game.effects[f];
                c.high.save();
                c.high.globalAlpha = efx.frame >= (efx.time - 10) ? (efx.time - efx.frame) / 10 : 1; // Fade out
                if(efx.type == 'damage') {
                    c.high.drawImage(tinyNumbersImg,efx.amt*4,0,4,6,parseInt(efx.x),parseInt(efx.y),4,6);
                } else if(efx.type == 'spark') {
                    c.high.fillStyle = '#'+efx.color;
                    c.high.shadowColor = 'rgba(0,0,0,1)'; c.high.shadowBlur = 1;
                    c.high.shadowOffsetX = 0; c.high.shadowOffsetY = 0;
                    c.high.fillRect(parseInt(efx.x),parseInt(efx.y),1,1);
                    disableShadow(c.high);
                }
                c.high.restore();
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
                cmm.fillStyle = '#'+p.color.hex;
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
                // Render player attack
                if(p.attacking) {
                    var attackProgress = 1 - Math.pow((20-game.player.attacking.frame),5)/Math.pow(20,5);
                    var xOff = game.player.attacking.dir == 'left' ? -attackProgress*10 :
                        game.player.attacking.dir == 'right' ? 21 + attackProgress*10 : 9;
                    var yOff = game.player.attacking.dir == 'up' ? -attackProgress*10 :
                        game.player.attacking.dir == 'down' ? 21 + attackProgress*10 : 9;
                    c.main.fillStyle = 'rgba(255,255,255,'+(1-attackProgress)+')';
                    c.main.fillRect(drawPX+xOff,drawPY+yOff,6,6);
                    // TODO: Show damage number animation
                }
                c.main.shadowColor = 'rgba(0,0,0,0.5)';
                c.main.shadowBlur = 5;
                c.main.shadowOffsetX = 2;
                c.main.shadowOffsetY = 1;
                c.main.fillStyle = '#'+p.color.hex;
                c.main.beginPath(); c.main.arc(drawPX+pix/2, drawPY+pix/2, 8, 0, 2 * Math.PI, false); c.main.fill();
                disableShadow(c.main);
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