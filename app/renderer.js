'use strict';
Application.Services.factory('Renderer',function(TextDraw,Effects,World,Things,Util,SpriteMan) {

    var cm, cvm, cmm, cz, cvz; // Canvas, minimap, and zoom objects
    var cursor;
    var renderArray, game, world = World.world, pix, mmWidth, mmHeight, mWidth, mHeight, zWidth, zHeight;
    var zoomed, prevZoomed, zoomFrame, zoomOff;
    var cycle, glowRamp;
    var lastSO = {}, so = { x: 0, y: 0}, hoverCount = {};
    var bufferCanvas = document.createElement('canvas');
    var buffer = bufferCanvas.getContext('2d');
    
    var disableShadow = function(canvas) {
        canvas.shadowColor = 'transparent'; canvas.shadowBlur = 0; canvas.shadowOffsetX = 0; canvas.shadowOffsetY = 0;
    };
    
    var qualityShadow = function(object) {
        var quality = Util.objectQuality(object);
        return 'rgba('+quality.r+','+quality.g+','+quality.b+','
            + (object.quality-700) / 300+')'
    };
    
    var addToRender = function(r,x,y,rType) {
        var depth = Math.round((y-x+25)*10); r.renderType = rType;
        if(renderArray[depth]) { renderArray[depth].push(r); } else { renderArray[depth] = [r]; }
    };
    
    var renderObject = function(o) {
        var tdx = (o.sx - game.player.osx)*(game.arena.width) + o.x,
            tdy = (o.sy - game.player.osy)*(game.arena.height) + o.y;
        var draw = Util.isoToScreen(tdx,tdy);
        draw.x += so.x + 11; draw.y += so.y - 7;
        if(draw.x <= -pix || draw.x >= mWidth // Don't draw off-screen objects
            || draw.y <= -pix || draw.y >= mHeight) return;
        var containerSprite = SpriteMan.containerSpriteLib.indexes.hasOwnProperty(o.id) ? 
            SpriteMan.containerSpriteLib.indexes[o.id] : false;
        var knock = { x: 0, y: 0 };
        var knockDir = o.knockback ? o.knockback.dir : {x:0,y:0};
        var doKnock = false;
        if(o.knockback && containerSprite && o.knockback.player.attacking.frame >= 0 
            && o.knockback.player.attacking.target.guid == o.guid) {
            doKnock = true;
            var abiInfo = SpriteMan.abiSpriteLib.indexes[o.knockback.hit.ability];
            var abiFrame = o.knockback.player.attacking.frame;
            if(!(o.knockback.fxStage > -1)) { // Initialize fx and knock stages
                o.knockback.fxStage = 0;
                o.knockback.knockStage = 0;
            }
            var flip = knockDir.x < 0 || knockDir.y > 0 ? -1 : 1;
            var knockStageDir = (knockDir.x < 0 || knockDir.y > 0) && abiInfo.knockDown ? 'knockDown' : 'knock';
            if(abiInfo[knockStageDir][o.knockback.knockStage] // Check if knock stage is ready
                && abiFrame >= abiInfo.delay + abiInfo[knockStageDir][o.knockback.knockStage].frame) {
                var knockStage = abiInfo[knockStageDir][o.knockback.knockStage];
                var knockX = (knockStage.paraMag || 0) * knockDir.x + (knockStage.latMag || 0)*flip * knockDir.y;
                var knockY = (knockStage.paraMag || 0) * knockDir.y + (knockStage.latMag || 0)*flip * knockDir.x;
                var knockZ = knockStage.vertMag || 0;
                var healthFactor = 1-o.realHealth/o.health[1] + (o.knockback.hit.dmg / o.health[1]) * 10;
                knockX *= healthFactor;
                knockY *= healthFactor;
                knockZ *= healthFactor;
                knock = Util.isoToScreenRel(knockX,knockY);
                knock.x = Math.round(knock.x); knock.y = Math.round(knock.y - knockZ*pix);
                o.knocked.x += knock.x; o.knocked.y += knock.y;
                o.knockback.knockStage++;
            }
            var fxStageDir = (knockDir.x < 0 || knockDir.y > 0) && abiInfo.fxDown ? 'fxDown' : 'fx';
            if(abiInfo[fxStageDir][o.knockback.fxStage] // Check if fx stage is ready
                && abiFrame >= abiInfo.delay + abiInfo[fxStageDir][o.knockback.fxStage].frame) {
                var fxStage = abiInfo[fxStageDir][o.knockback.fxStage];
                // Spark count based on damage % dealt
                var sparkCount = Math.min(20,Math.ceil(
                    (o.knockback.hit.dmg / o.health[1]) * Util.randomIntRange(40,60)));
                sparkCount += fxStage.count;
                var sparkVel = 0, sparkTime = 1;
                if(o.realHealth == 0) { sparkCount = 20; sparkVel = 0.07; sparkTime = 2; }
                for(var pe = 0; pe < sparkCount; pe++) {
                    var size = Util.randomIntRange(1,2);
                    var pixel = Util.pickInArray(containerSprite.colors);
                    Effects.add({ type:'spark', color: 'rgba('+pixel[0]+','+pixel[1]+','+pixel[2]+',1)',
                        ox: o.x - knockDir.x/5 + knockDir.x*(fxStage.paraOff || 0) + knockDir.y*(fxStage.latOff || 0)*flip
                        /*+ knockDir.y*Util.randomIntRange(-15,15)/100*/,
                        oy: o.y - knockDir.y/5 + knockDir.y*(fxStage.paraOff || 0) + knockDir.x*(fxStage.latOff || 0)*flip
                        /*+ knockDir.x*Util.randomIntRange(-15,15)/100*/,
                        oz: 0.3 + (fxStage.vertOff || 0) /*+ Util.randomIntRange(-15,15)/100*/,
                        vx: (Util.randomIntRange(-10,10)
                        + (fxStage.latMag || 0)*flip*knockDir.y*Util.randomIntRange(1,30) // Lateral
                        + (fxStage.paraMag || 0)*knockDir.x*Util.randomIntRange(1,30))/600, // Parallel
                        vy: (Util.randomIntRange(-10,10)
                        + (fxStage.latMag || 0)*flip*knockDir.x*Util.randomIntRange(1,30) // Lateral
                        + (fxStage.paraMag || 0)*knockDir.y*Util.randomIntRange(1,30))/600, // Parallel
                        vz: (1 - o.realHealth/o.health[1])/16 * Util.randomIntRange(0,20)/10+sparkVel
                        + (fxStage.vertMag || 0)/10,
                        time: Util.randomIntRange(20,80) * sparkTime,
                        width: size, height: size > 1 ? Util.randomIntRange(1,2) : 1 });
                }
                o.knockback.fxStage++;
            }
        }
        var quality = Util.objectQuality(o);
        // TODO: Create shadow sprites for various object shapes/sizes
        if(SpriteMan.thingSpriteLib.indexes.hasOwnProperty(o.id)) { // If this thing has a sprite
            if(o.quality >= Util.qualityLevels[2].min) { // Uncommon or greater
                buffer.shadowColor = qualityShadow(o);
                buffer.shadowBlur = 1 + glowRamp; 
                buffer.shadowOffsetX = 0; buffer.shadowOffsetY = 0;
                var xd = Util.randomIntRange(-6,6)/15, yd = Util.randomIntRange(-6,6)/15;
                if(o.quality >= Util.qualityLevels[4].min && !(game.ticks & 3)) {
                    Effects.add({type:'sparkle', style: 'evaporate', color: '#'+quality.hex,
                        ox: o.x + xd, oy: o.y + yd, oz: 0, time: 120, xd: xd, yd: yd
                    });
                }
                if(o.quality < Util.qualityLevels[4].min && !(game.ticks & 3)) {
                    Effects.add({type:'sparkle', style: 'fireflies', color: '#'+quality.hex,
                        ox: o.x + xd, oy: o.y + yd, oz: Math.random()/2 +0.1, time: 120, xd: xd, yd: yd
                    });
                }
            }
            //buffer.shadowColor = 'rgba(0,0,0,0.3)'; buffer.shadowBlur = 4;
            //buffer.shadowOffsetX = 2; buffer.shadowOffsetY = 1;
            buffer.drawImage(SpriteMan.getThingSprite(o), 0, 0, pix, pix,
                draw.x, draw.y, pix, pix);
            disableShadow(buffer);
        } else if(containerSprite) { // If this container has a sprite
            buffer.shadowColor = 'rgba(0,0,0,0.3)'; buffer.shadowBlur = 4;
            buffer.shadowOffsetX = 2; buffer.shadowOffsetY = 1;
            var cState = o.open ? o.broke ? 'spriteBroken' : 'spriteOpen' : 'sprite';
            buffer.drawImage(containerSprite[cState], 0, 0, 36, 36,
                draw.x+o.knocked.x-6, draw.y+o.knocked.y-6, 36, 36);
            disableShadow(buffer);
        } else { // No sprite, draw letter box
            buffer.drawImage(SpriteMan.genericSprite,draw.x+o.knocked.x, draw.y+o.knocked.y);
            disableShadow(buffer);
            buffer.fillStyle = '#112244';
            buffer.font = 'bold 14px Arial';buffer.textAlign = 'center';
            var kerning = jQuery.inArray(o.name[0],['A','B','C','D','G','H','R','M']) >= 0 ? 1 : 0;
            buffer.fillText(o.name[0],draw.x+11+kerning+o.knocked.x,draw.y+20+o.knocked.y);
        }
        if(o.newHit) { // If hit and haven't created fx yet
            Math.seedrandom();
            Effects.add({type:'damage', amt: o.knockback.hit.dmg,
                ox: o.x + knockDir.x * 0.8 + 0.1, oy: o.y + knockDir.y * 0.8,
                oz: knockDir.x < 0 || knockDir.y > 0 ? 1.5 : 0.5, time: 40,
                vx: knockDir.x/48 + Math.random()*0.01-0.005, vy: knockDir.y/48 + Math.random()*0.01-0.005, vz: 0.06 });
            if(o.knockback.hit.combo) {
                Effects.add({type:'combo',
                    text: Util.capitalize(o.knockback.hit.ability) + ' ' + o.knockback.hit.combo+'x!',
                    ox: o.x + knockDir.x/4, oy: o.y + knockDir.y/4, oz: 1.5, time: 60,
                    vx: knockDir.x/48 + Math.random()*0.01-0.005, vy: knockDir.y/48 + Math.random()*0.01-0.005,
                    vz: 0.09 });
            }
            o.newHit = false;
        }
        if(doKnock && !abiInfo[knockStageDir][o.knockback.knockStage] && !abiInfo[fxStageDir][o.knockback.fxStage]) {
            delete o.knockback; // Delete knockback info if complete
        }
        var showHealth = o.health && o.realHealth < o.health[1];
        // Draw container health
        if(showHealth) {
            disableShadow(buffer);
            buffer.fillStyle = 'rgba(0,0,0,0.7)';
            buffer.fillRect(draw.x+o.knocked.x,draw.y-5+o.knocked.y,pix+2,5);
            buffer.fillStyle = 'white';
            buffer.fillRect(draw.x-1+o.knocked.x,draw.y-6+o.knocked.y,pix+2,5);
            var hp = o.realHealth/ o.health[1];
            buffer.fillStyle = 'rgba(0,0,0,0.9)';
            buffer.fillRect(draw.x+pix+o.knocked.x,draw.y-5+o.knocked.y,Math.floor((pix)*(1-hp))*-1,3);
        }
        // Draw hover info
        if(cursor.hover.hasOwnProperty(o.guid)) {
            buffer.fillStyle = 'rgba('+quality.r+','+quality.g+','+quality.b+',1)';
            var grid = o.x+':'+o.y;
            var healthSpacing = showHealth ? 10 : 0;
            TextDraw.drawText(quality.name+' '+o.name, o.health ? 'white' : quality.name, buffer,
                'normal','med',draw.x+12,draw.y-8-healthSpacing-(12*(hoverCount[grid] || 0)),'center',1);
            hoverCount[grid] = hoverCount[grid] ? hoverCount[grid] + 1 : 1;
        }
        // Draw select box
        if(!game.selected || game.selected.guid != o.guid) return;
        buffer.lineWidth = 2; buffer.strokeStyle = 'rgba(200,230,255,0.5)';
        buffer.beginPath();
        buffer.moveTo(draw.x,draw.y); buffer.lineTo(draw.x + pix,draw.y);
        buffer.lineTo(draw.x + pix,draw.y + pix); buffer.lineTo(draw.x,draw.y + pix);
        buffer.closePath(); buffer.stroke();
    };
    var renderPlayer = function(p) {
        var pdx = (p.osx - game.player.osx)*(game.arena.width) + p.ox,
            pdy = (p.osy - game.player.osy)*(game.arena.height) + p.oy;
        var pddx = (p.osx - game.player.osx)*(game.arena.width) + (p.path ? p.path[0].x : pdx),
            pddy = (p.osy - game.player.osy)*(game.arena.height) + (p.path ? p.path[0].y : pdy);
        pdx += p.moveProgress ? (pddx - pdx) * p.moveProgress : 0;
        pdy += p.moveProgress ? (pddy - pdy) * p.moveProgress : 0;
        // TODO: Make player turns smooth like the path sprites
        var drawP = Util.isoToScreen(pdx,pdy);
        drawP.x += so.x + 11; drawP.y += so.y;
        if(drawP.x < pix*-1 || drawP.x > mWidth
            || drawP.y < pix*-1 || drawP.y > mHeight) return;
        buffer.shadowColor = 'rgba(0,0,0,0.5)';
        buffer.shadowBlur = 5; buffer.shadowOffsetX = 1; buffer.shadowOffsetY = 1;
        buffer.fillStyle = '#'+p.color.hex;
        buffer.beginPath(); buffer.arc(drawP.x+pix/2, drawP.y+pix/4, 9, 0, 2 * Math.PI, false); buffer.fill();
        disableShadow(buffer);
        // Render other player's names
        if(game.player.guid != p.guid) {
            TextDraw.drawText(p.name,'white', buffer, 'normal','med',drawP.x + 12, drawP.y - 14,'center',1);
        }
        // Render player attack
        if(p.attacking && p.attacking.dir) {
            if(p.attacking.dir.y == 0 && p.attacking.dir.x == 0) {
                var attackProgress = 1 - Math.pow((25-p.attacking.frame),5)/Math.pow(25,5);
                var attack = Util.isoToScreenRel(p.attacking.dir.x,p.attacking.dir.y);
                attack.x *= attackProgress + 1; attack.y *= attackProgress + 1;
                attack.y += -7 + attackProgress*25;
                buffer.fillStyle = 'rgba(255,255,255,'+(1-attackProgress)+')';
                buffer.fillRect(drawP.x+Math.floor(attack.x/2)+9,drawP.y+Math.floor(attack.y/2)+5,6,6);
            } else if(p.attacking.frame < 78) {
                var attackSpriteX = Math.floor((p.attacking.frame-1)/2)*59;
                var attackSpriteY = (p.attacking.dir.x > 0 || p.attacking.dir.y < 0 ? 43 : 0) +
                    86 * jQuery.inArray(p.attacking.type,SpriteMan.abiSpriteLib.names);
                var attackOffsetX = p.attacking.dir.x + p.attacking.dir.y < 0 ? -33 : -2;
                var attackOffsetY = p.attacking.dir.x > 0 || p.attacking.dir.y < 0 ? -32 : -8;
                var attackDir = p.attacking.dir.x + p.attacking.dir.y < 0 ? 'left' : 'right';
                buffer.drawImage(SpriteMan.attacksImg[attackDir], attackSpriteX, attackSpriteY, 59,43,
                    drawP.x+attackOffsetX, drawP.y+attackOffsetY, 59, 43);
            }
        }
    };
    var renderEffect = function(f) {
        var drawFX = Util.isoToScreen(f.x,f.y);
        drawFX.x = Math.floor(drawFX.x) + 22; drawFX.y = Math.floor(drawFX.y-f.z*pix)+11;
        if(drawFX.x > mWidth + pix*4 || drawFX.y > mHeight + pix*4 || drawFX.x < pix*-4 || drawFX.y < pix*-6) return;
        if(f.type == 'damage') {
            var fontSize = f.amt >= 100 ? 'large' : f.amt >= 50 ? 'med' : 'small';
            buffer.save();
            buffer.globalAlpha = f.frame >= (f.time - 20) ? (f.time - f.frame) / 20 : 1; // Fade out
            TextDraw.drawText(''+f.amt, 'yellow', buffer, 'dmg',fontSize,drawFX.x-1,drawFX.y,'center',1);
            buffer.restore();
        } else if(f.type == 'combo') {
            buffer.save();
            buffer.globalAlpha = f.frame >= (f.time - 20) ? (f.time - f.frame) / 20 : 1; // Fade out
            TextDraw.drawText(f.text, 'white', buffer,
                'normal','med',drawFX.x,drawFX.y,'center',1);
            buffer.restore();
        } else if(f.type == 'spark') {
            buffer.save();
            buffer.globalAlpha = f.frame >= (f.time - 20) ? (f.time - f.frame) / 20 : 1; // Fade out
            buffer.fillStyle = 'rgba(0,0,0,0.7)';
            buffer.fillRect(drawFX.x+1,drawFX.y+1,f.width,f.height);
            buffer.fillStyle = f.color;
            buffer.fillRect(drawFX.x,drawFX.y,f.width,f.height);
            buffer.restore();
        } else if(f.type == 'rain') {
            // TODO: Gradient trail
            buffer.save();
            buffer.globalAlpha = f.frame >= (f.time - 10) ? (f.time - f.frame) / 10 : // Fade out
                f.frame < 30 && !f.splash ? f.frame/30 : 1; // Fade in
            buffer.fillStyle = f.color;
            buffer.fillRect(drawFX.x-10,drawFX.y-5,1,f.splash ? 1 : f.vz*pix*2);
            buffer.restore();
        } else if(f.type == 'snow') {
            buffer.save();
            buffer.globalAlpha = f.frame >= (f.time - 300) ? (f.time - f.frame) / 300 : // Fade out
                f.frame < 60 ? f.frame/60 : 1; // Fade in
            buffer.fillStyle = f.color;
            buffer.fillRect(drawFX.x-10,drawFX.y+15,1,1);
            buffer.restore();
        } else if(f.type == 'sparkle') {
            buffer.save();
            if(f.style == 'fireflies') {
                buffer.globalAlpha = f.frame < 60 ? f.frame/60 : (f.time - f.frame) / 60; // Fade in & out
            } else if(f.style == 'evaporate') {
                buffer.globalAlpha = f.frame < 20 ? f.frame/20 : (f.time - f.frame) / 100; // Fade in & out
            }
            buffer.globalAlpha *= (0.35 - (Math.pow(f.xd, 2) + Math.pow(f.yd, 2))) / 0.35;
            buffer.fillStyle = f.color;
            buffer.fillRect(drawFX.x,drawFX.y,1,1);
            buffer.restore();
        }
    };
    
    return {
        init: function(g) { game = g; pix = game.arena.pixels; },
        initMainCanvas: function(canvas,ctx,curse) { 
            cm = ctx; cvm = canvas; mWidth = canvas.width; mHeight = canvas.height;
            bufferCanvas.width = mWidth; bufferCanvas.height = mHeight;
            cursor = curse;
        },
        initMinimap: function(canvas,ctx) { cmm = ctx; mmWidth = canvas.width; mmHeight = canvas.height; },
        initZoomCanvas: function(canvas,ctx) { cz = ctx; cvz = canvas; zWidth = canvas.width; zHeight = canvas.height; },
        drawFrame: function(rt,step,tick) {
            if(!buffer || !mWidth || !pix) return;
            buffer.clearRect(0,0,mWidth,mHeight);
            if(SpriteMan.getLoadProgress() < 1) { // Show loading screen
                buffer.fillStyle = '#777777';
                buffer.font = 'bold 24px Arial';buffer.textAlign = 'center';
                buffer.fillText('Loading Sprites '+Math.round(SpriteMan.getLoadProgress()*100)+'%', 
                    bufferCanvas.width/2, bufferCanvas.height/2 - 12);
                buffer.fillRect(200, bufferCanvas.height/2+6, bufferCanvas.width-400,20);
                buffer.clearRect(bufferCanvas.width-202, bufferCanvas.height/2+8, 
                    (1-SpriteMan.getLoadProgress())*(-bufferCanvas.width+404),16);
                cm.clearRect(0,0,mWidth,mHeight);
                cm.drawImage(bufferCanvas,0,0);
                return;
            }
            so = { x: Math.floor(game.player.sectorMove.x * mWidth), 
                y: Math.floor(game.player.sectorMove.y * mHeight) };
            
            // Render background
            lastSO.x = game.player.sectorMove.x; lastSO.y = game.player.sectorMove.y;
            for(var sw = -1; sw < 2; sw++) { for(var sh = -1; sh < 2; sh++) {
                if(Math.abs(sw) + Math.abs(sh) > 1) continue; // Don't include diagonals
                for(var w = 0; w < game.arena.width; w++) { for(var h = 0; h < game.arena.height; h++) {
                    if((sw != 0 || sh != 0) && !Util.validOffSectorTiles[w+':'+h]) continue;
                    var tileX = sw*game.arena.width + w, tileY = sh*game.arena.height + h;
                    var bgDraw = Util.isoToScreen(tileX,tileY);
                    bgDraw.x += so.x; bgDraw.y += so.y;
                    if(bgDraw.x < pix*-2 || bgDraw.x >= mWidth ||
                        bgDraw.y < pix*-2 || bgDraw.y >= mHeight) continue;
                    buffer.drawImage(SpriteMan.bgTileImg,sw != 0 || sh != 0 ? 46 : 0,0,46,24,
                        bgDraw.x,bgDraw.y,46,24);
                    //buffer.fillStyle = 'rgba(255,255,255,0.5)';
                    //buffer.fillText(w+','+h,bgDraw.x+13,bgDraw.y+15);
                } }
            } }
            if(so.x == 0 && so.y == 0) game.player.sectorMove.rendered = true;
            
            if(game.weather.now.temp < 36) {
                buffer.globalCompositeOperation = 'source-atop';
                buffer.fillStyle = 'rgba(255,255,255,'+((12-game.weather.now.temp/3)/100)+')';
                buffer.fillRect(0,0, bufferCanvas.width, bufferCanvas.height);
                buffer.globalCompositeOperation = 'source-over';
            }
            // Render cursor highlight
            if(cursor.iso && ((cursor.iso.x >= 0 && cursor.iso.x < 15 && cursor.iso.y >= 0 && cursor.iso.y < 15)
                || (Util.validOffSectorTiles[cursor.iso.x+':'+cursor.iso.y]))) {
                var cursorDraw = Util.isoToScreen(cursor.iso.x, cursor.iso.y);
                buffer.drawImage(SpriteMan.bgTileImg, 92, 0, 50, 25, cursorDraw.x-2, cursorDraw.y-1, 50, 25);
            }
            // Render minimap
            if(!mmWidth) return;
            cmm.clearRect(0,0,mmWidth,mmHeight);
            //cmm.fillStyle = 'rgba(47,56,60,0.7)';
            //cmm.fillRect(0,0,mmWidth,mmHeight);
            var mmDiv = game.options.minimapZoom > 1 ? game.options.minimapZoom > 2 ? game.options.minimapZoom > 3 ? 
                15 : 25 : 45 : 75;
            var mmReach = (mmDiv - 1) / 2;
            var mmw = mmWidth / mmDiv, mmh = mmHeight / mmDiv;
            cmm.fillStyle = '#41535a';
            for(var mmsx = -mmReach; mmsx <= mmReach; mmsx++) {
                for(var mmsy = -mmReach; mmsy <= mmReach; mmsy++) {
                    var thingCount = game.player.explored[(+game.player.osx+mmsx)+','+(+game.player.osy+mmsy)];
                    if(thingCount >= 0) {
                        cmm.clearRect(mmw*(mmReach+mmsx)+game.player.sectorMove.x*mmw,
                            mmh*(mmReach+mmsy)+game.player.sectorMove.y*mmh,mmw,mmh);
                        if(thingCount > 30) thingCount = 7;
                        else if(thingCount > 20) thingCount = 6;
                        else if(thingCount > 14) thingCount = 5;
                        else if(thingCount > 9) thingCount = 4;
                        else if(thingCount > 5) thingCount = 3;
                        else if(thingCount > 2) thingCount = 2;
                        else if(thingCount > 0) thingCount = 1;
                        else thingCount = 0;
                        if(game.options.minimapZoom == 4) {
                            cmm.drawImage(SpriteMan.sectorSpriteImg,(thingCount+1)*mmw,0,mmw,mmh,
                                mmw*(mmReach+mmsx)+game.player.sectorMove.x*mmw,
                                mmh*(mmReach+mmsy)+game.player.sectorMove.y*mmh,mmw,mmh);
                        } else {
                            cmm.fillRect(mmw*(mmReach+mmsx)+game.player.sectorMove.x*mmw,
                                mmh*(mmReach+mmsy)+game.player.sectorMove.y*mmh,mmw,mmh);
                        }
                    }
                }
            }
            cmm.drawImage(SpriteMan.sectorSpriteImg,0,0,mmw,mmh,mmw*mmReach,mmh*mmReach,mmw,mmh);
            // Render player move path
            if(game.player.path) {
                for(var pn = 0; pn < game.player.path.length; pn++) {
                    var node = Util.isoToScreen(game.player.path[pn].x, game.player.path[pn].y);
                    var prev = pn == 0 ? {x:game.player.ox,y:game.player.oy} : game.player.path[pn-1];
                    var cur = game.player.path[pn];
                    var next = pn+1 == game.player.path.length ? cur : game.player.path[pn+1];
                    var dPrev = {x:prev.x - cur.x,y:prev.y - cur.y};
                    var dNext = {x:next.x - cur.x,y:next.y - cur.y};
                    var pathTile = jQuery.inArray(dPrev.x+':'+dPrev.y+'|'+dNext.x+':'+dNext.y,SpriteMan.pathTileLib);
                    if(pathTile < 0) pathTile = jQuery.inArray(dNext.x+':'+dNext.y+'|'+dPrev.x+':'+dPrev.y,
                        SpriteMan.pathTileLib);
                    if(pathTile < 0) pathTile = jQuery.inArray('0:0|'+dNext.x+':'+dNext.y,SpriteMan.pathTileLib);
                    if(pathTile < 0) continue;
                    buffer.globalAlpha = pn == 0 ? 1 - game.player.moveProgress : 1;
                    buffer.drawImage(SpriteMan.pathTileImg,pathTile % 8 * 48,Math.floor(pathTile/8)*24,48,24,
                        node.x,node.y,48,24);
                }
                buffer.globalAlpha = 1;
            }
            cycle = game.ticks % 240;
            glowRamp = (cycle > 120 ? 120 - (cycle - 120) : cycle) / 30;
            
            // Build render array
            renderArray = [];
            var objects = world.things.concat(world.containers);
            for(var j = objects.length-1; j >= 0; j--) {
                var o = objects[j];
                if(o.removed && !o.dropped) continue; // Skip if object removed and not dropped
                var tdx = (o.sx - game.player.osx)*(game.arena.width) + o.x,
                    tdy = (o.sy - game.player.osy)*(game.arena.height) + o.y;
                if((so.x == 0 && so.y == 0) && (tdx > 14 || tdx < 0 || tdy > 14 || tdy < 0)) continue;
                addToRender(o,tdx,tdy+0.3,'object');
            }
            for(var pKey in world.players) { if (!world.players.hasOwnProperty(pKey)) continue;
                var p = world.players[pKey];
                var pdx = (p.osx - game.player.osx) * (game.arena.width) + p.ox,
                    pdy = (p.osy - game.player.osy) * (game.arena.height) + p.oy;
                if (!((pdx < 15 && pdx >= 0 && pdy < 15 && pdy >= 0) ||
                    (Util.validOffSectorTiles[pdx + ':' + pdy]))) continue;
                var pddx = (p.osx - game.player.osx) * (game.arena.width) + (p.path ? p.path[0].x : pdx),
                    pddy = (p.osy - game.player.osy) * (game.arena.height) + (p.path ? p.path[0].y : pdy);
                pdx += p.moveProgress ? (pddx - pdx) * p.moveProgress : 0;
                pdy += p.moveProgress ? (pddy - pdy) * p.moveProgress : 0;
                addToRender(p,pdx,pdy+0.3,'player');
            }
            Effects.prepareRender(addToRender);
            hoverCount = {};
            for(var r = 0; r < renderArray.length; r++) { if(!renderArray[r]) continue;
                var subArray = renderArray[r];
                for(var ri = 0; ri < subArray.length; ri++) {
                    switch(subArray[ri].renderType) {
                        case 'object': renderObject(subArray[ri]); break;
                        case 'player': renderPlayer(subArray[ri]); break;
                        case 'effect': renderEffect(subArray[ri]); break;
                    }
                }
            }

            // Render players on minimap
            for(var pmmKey in world.players) { if (!world.players.hasOwnProperty(pmmKey)) continue;
                var pmm = world.players[pmmKey];
                var pmmdx = (pmm.osx - game.player.osx) * (game.arena.width) + pmm.ox,
                    pmmdy = (pmm.osy - game.player.osy) * (game.arena.height) + pmm.oy;
                cmm.fillStyle = '#' + pmm.color.hex; // Draw player on minimap
                if (game.options.minimapZoom == 4) {
                    cmm.fillRect(pmmdx + mmw * mmReach - 1, pmmdy + mmh * mmReach, 3, 1);
                    cmm.fillRect(pmmdx + mmw * mmReach, pmmdy + mmh * mmReach - 1, 1, 3);
                } else cmm.fillRect(Math.floor(pmmdx * 15 / mmDiv + mmw * mmReach - 1), 
                    Math.floor(pmmdy * 15 / mmDiv + mmh * mmReach - 1), 1, 1);
            }
            var quality;
            // Render inventory
            game.drawInventory = true;
            // TODO: Create inventory canvas?
            if(game.drawInventory) {
                //for(var tb1 = 0; tb1 < 5; tb1++) {
                //    buffer.drawImage(inventorySpriteImg,0,0,46,24,194 + 28*tb1, 316 + 14*tb1, 46, 24);
                //}
                var tbX = 376, tbY = 367, tbXS = 34, tbYS = 17;
                for(var tb = 0; tb < game.player.toolbelt.length; tb++) { // Draw toolbelt
                    var tbItem = game.player.toolbelt[tb];
                    if(tbItem) {
                        if(tbItem.cooldown) {
                            buffer.save(); buffer.globalAlpha = 0.5;
                        }
                        buffer.fillStyle = '#525252';
                        buffer.fillRect(tbX+28 + tbXS*tb,tbY+14 - tbYS*tb,28,14);
                        var abilityPos = 0;
                        for(var a in tbItem.abilities) { if(!tbItem.abilities.hasOwnProperty(a)) continue;
                            buffer.fillStyle = tbItem.cooldown && tbItem.cooldown[0] == a ? '#292b2a' : '#525252';
                            buffer.fillRect(tbX+56 + tbXS*tb+59*abilityPos,tbY+14 - tbYS*tb,55,14);
                            if(tbItem.cooldown && tbItem.cooldown[0] == a) {
                                buffer.fillStyle = '#565656';
                                var totalCool = Math.max(1,Things.abilities[a].cooldown-tbItem.handling)*10;
                                buffer.fillRect(tbX+56 + tbXS*tb+59*abilityPos,tbY+14 - tbYS*tb,
                                    /*Math.floor*/(55*((totalCool-tbItem.cooldown[1])/totalCool)),14);
                            }
                            buffer.drawImage(SpriteMan.inventorySpriteImg,
                                (jQuery.inArray(a,SpriteMan.abiSpriteLib.names)-1)*14,28,14,14,
                                tbX+57 + tbXS*tb+59*abilityPos,tbY+14 - tbYS*tb,14,14);
                            TextDraw.drawText(Util.capitalize(a), 'white', buffer,
                                'normal','med',tbX+90 + tbXS*tb+59*abilityPos,tbY+17 - tbYS*tb,'center',1);
                            abilityPos++;
                        }
                        if(tbItem.cooldown) buffer.restore();
                    }
                    if(tbItem && game.selected && game.selected.guid == tbItem.guid) {
                        buffer.drawImage(SpriteMan.inventorySpriteImg,108,0,54,28,tbX + tbXS*tb, tbY - tbYS*tb, 54, 28);
                    } else if(cursor.onTBslot == tb) {
                        buffer.drawImage(SpriteMan.inventorySpriteImg,54,0,54,28,tbX + tbXS*tb, tbY - tbYS*tb, 54, 28);
                    } else {
                        buffer.drawImage(SpriteMan.inventorySpriteImg,0,0,54,28,tbX + tbXS*tb, tbY - tbYS*tb, 54, 28);
                    }
                    if(!tbItem) continue;
                    if(game.dragging && game.dragging.guid == tbItem.guid) {
                        buffer.save(); buffer.globalAlpha = 0.5;
                    }
                    quality = Util.objectQuality(tbItem);
                    if(tbItem.quality >= 860) {
                        buffer.shadowColor = qualityShadow(tbItem);
                        buffer.shadowBlur = 5; buffer.shadowOffsetX = 0; buffer.shadowOffsetY = 0;
                    }
                    buffer.drawImage(SpriteMan.getThingSprite(tbItem),0, 0, pix, pix,
                        tbX+15 + tbXS*tb,tbY-3 - tbYS*tb,pix,pix);
                    disableShadow(buffer);
                    if(game.dragging && game.dragging.guid == tbItem.guid) buffer.restore();
                }
                buffer.fillStyle = '#424242';
                buffer.fillRect(609,261,108,52);
                // TODO: Isometric backpack?
                for(var bp = 0; bp < game.player.backpack.length; bp++) { // Draw backpack
                    var bpItem = game.player.backpack[bp];
                    if(bpItem && game.selected && game.selected.guid == bpItem.guid) {
                        buffer.fillStyle = '#b5b5b5';
                        buffer.fillRect(608+(bp%4)*28-1,260+Math.floor(bp/4)*28-1,28,28);
                    } else if(cursor.onBPslot == bp) {
                        buffer.fillStyle = '#6e6e6e';
                        buffer.fillRect(608+(bp%4)*28-1,260+Math.floor(bp/4)*28-1,28,28);
                    }
                    buffer.fillStyle = '#4a4a4a';
                    buffer.fillRect(608+(bp%4)*28,260+Math.floor(bp/4)*28,26,26);
                    if(!bpItem) continue;
                    if(game.dragging && game.dragging.guid == bpItem.guid) {
                        buffer.save(); buffer.globalAlpha = 0.5;
                    }
                    quality = Util.objectQuality(bpItem);
                    if(bpItem.quality >= 860) {
                        buffer.shadowColor = qualityShadow(bpItem);
                        buffer.shadowBlur = 5; buffer.shadowOffsetX = 0; buffer.shadowOffsetY = 0;
                    }
                    buffer.drawImage(SpriteMan.getThingSprite(bpItem),0, 0, pix, pix,
                        609+(bp%4)*28,261+Math.floor(bp/4)*28,pix,pix);
                    disableShadow(buffer);
                    if(game.dragging && game.dragging.guid == bpItem.guid) {
                        buffer.restore();
                    }
                }
                game.drawInventory = false;
            }
            if(game.dragging && cursor.x != '-') {
                quality = Util.objectQuality(game.dragging);
                if(game.dragging.quality >= 860) {
                    buffer.shadowColor = qualityShadow(game.dragging);
                    buffer.shadowBlur = 5; buffer.shadowOffsetX = 0; buffer.shadowOffsetY = 0;
                }
                buffer.drawImage(SpriteMan.getThingSprite(game.dragging),0, 0, pix, pix,
                    +cursor.x-pix/2,+cursor.y-pix/2,pix,pix);
                disableShadow(buffer);
            }
            // Draw thrown items
            // TODO; Move to render array
            for(var throwKey in world.thrown) { if(!world.thrown.hasOwnProperty(throwKey)) continue;
                if(!world.thrown[throwKey].physics) continue;
                var throwDraw = Util.isoToScreen(world.thrown[throwKey].physics.x,world.thrown[throwKey].physics.y);
                throwDraw.x += 11; throwDraw.y += -7 - world.thrown[throwKey].physics.z * pix;
                quality = Util.objectQuality(world.thrown[throwKey]);
                if(world.thrown[throwKey].quality >= 860) {
                    buffer.shadowColor = qualityShadow(world.thrown[throwKey]);
                    buffer.shadowBlur = 5; buffer.shadowOffsetX = 0; buffer.shadowOffsetY = 0;
                }
                buffer.drawImage(SpriteMan.getThingSprite(world.thrown[throwKey]),0, 0, pix, pix,
                    throwDraw.x,throwDraw.y,pix,pix);
                disableShadow(buffer);
            }
            // Draw zoom canvas
            if(game.player.attacking && game.player.attacking.type != 'punch' || zoomFrame > 0) {
                zoomOff = game.player.attacking ? game.player.attacking.dir : zoomOff;
                if(!zoomed) {
                    zoomed = true;
                    cz.fillStyle = '#343635';
                    zoomFrame = 1;
                } else { prevZoomed = true; }
                cvz.style.opacity = Math.min(1,zoomFrame/8);
                var zoomPosition = Util.isoToScreen(game.player.ox+0.1+zoomOff.x/2,game.player.oy-0.1+1+zoomOff.y/2);
                var zx = Math.round(zoomPosition.x - zWidth / 2), zy = Math.round(zoomPosition.y - zHeight / 2);
                cz.fillRect(0,0,zWidth,zHeight);
                cz.drawImage(bufferCanvas,zx,zy,zWidth,zHeight,0,0,zWidth,zHeight);
                if(!game.player.attacking || game.player.attacking.type == 'punch') {
                    zoomFrame--;
                    if(zoomFrame < 9) cvz.style.opacity = zoomFrame/8;
                } else {
                    zoomFrame++;
                }
            } else {
                if(zoomFrame <= 0) {
                    zoomed = false;
                    prevZoomed = false;
                }
            }
            cm.clearRect(0,0,mWidth,mHeight);
            cm.drawImage(bufferCanvas,0,0);
        }
    };
});