'use strict';
Application.Services.factory('Renderer',function(TextDraw,Effects,World,Things,Util,SpriteMan,UIMan) {

    var cm, cvm, cz, cvz; // Canvas, minimap, and zoom objects
    var cursor;
    var renderArray, pix, mWidth, mHeight,
        mmWidth = 105, mmHeight = 105, zWidth, zHeight;
    var game, world = World.world, map = {};
    var zoomed, prevZoomed, zoomFrame, zoomOff;
    var cycle, glowRamp;
    var hoverCount = {};
    var bfCanvas = document.createElement('canvas');
    var bf = bfCanvas.getContext('2d');
    
    var disableShadow = function() {
        bf.shadowColor = 'transparent'; bf.shadowBlur = 0; bf.shadowOffsetX = 0; bf.shadowOffsetY = 0;
    };
    
    var qualityShadow = function(object) {
        var quality = Util.objectQuality(object);
        return 'rgba('+quality.r+','+quality.g+','+quality.b+','
            + (object.quality-700) / 300+')'
    };

    var updateMap = function(data) {
        map.data = data; map.renderArray = [];
        for(var mKey in data) { if(!data.hasOwnProperty(mKey)) continue;
            Math.seedrandom(mKey);
            var tile = Util.gridToXY(mKey);
            var tileVariant = Util.randomIntRange(0,4);
            if(!game.player.inContainer) tileVariant = Math.random() < 0.04 ? Util.randomIntRange(1,4) : 0;
            tile.renderType = 'tile'; tile.variant = tileVariant;
            var depth = Math.round((tile.y-tile.x+20)*10);
            if(map.renderArray[depth]) { map.renderArray[depth].push(tile); } else { map.renderArray[depth] = [tile]; }
        }
    };
    
    var addToRender = function(r,x,y,rType) {
        var depth = Math.round((y-x+25)*10); r.renderType = rType;
        if(renderArray[depth]) { renderArray[depth].push(r); } else { renderArray[depth] = [r]; }
    };
    
    var renderTile = function(t) {
        var bgDraw = Util.isoToScreen(t.x,t.y);
        var tileType = t.x < 0 || t.x > 14 || t.y < 0 || t.y > 14 ? 230 : 0;
        if(tileType == 0) {
            tileType = t.variant * 46;
        }
        bf.drawImage(SpriteMan.bgTileImg,tileType,game.player.inContainer ? 24 : 0,46,24,bgDraw.x,bgDraw.y,46,24);
        // Render cursor highlight
        if(cursor.iso && cursor.iso.x == t.x && cursor.iso.y == t.y) {
            var cursorDraw = Util.isoToScreen(cursor.iso.x, cursor.iso.y);
            bf.drawImage(SpriteMan.bgTileImg, 276, 0, 50, 25, cursorDraw.x-2, cursorDraw.y-1, 50, 25);
        }
    };
    var renderPath = function(p) {
        var tileDraw = Util.isoToScreen(p.x,p.y);
        bf.save();
        bf.globalAlpha = p.opacity;
        bf.drawImage(SpriteMan.pathTileImg, p.tile % 8 * 48,Math.floor(p.tile/8)*24,48,24,tileDraw.x,tileDraw.y,48,24);
        bf.restore();
    };
    var renderObject = function(o) {
        var tdx = (o.sx - game.player.osx)*(game.arena.width) + o.x,
            tdy = (o.sy - game.player.osy)*(game.arena.height) + o.y;
        var draw = Util.isoToScreen(tdx,tdy);
        draw.x += 11; draw.y += -7;
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
                bf.shadowColor = qualityShadow(o);
                bf.shadowBlur = 1 + glowRamp; 
                bf.shadowOffsetX = 0; bf.shadowOffsetY = 0;
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
            //bf.shadowColor = 'rgba(0,0,0,0.3)'; bf.shadowBlur = 4;
            //bf.shadowOffsetX = 2; bf.shadowOffsetY = 1;
            bf.drawImage(SpriteMan.getThingSprite(o), 0, 0, pix, pix,
                draw.x, draw.y, pix, pix);
            disableShadow();
        } else if(containerSprite) { // If this container has a sprite
            bf.shadowColor = 'rgba(0,0,0,0.3)'; bf.shadowBlur = 4;
            bf.shadowOffsetX = 2; bf.shadowOffsetY = 1;
            var cState = o.open ? o.broke ? 'spriteBroken' : 'spriteOpen' : 'sprite';
            bf.drawImage(containerSprite[cState], 0, 0, 36, 36,
                draw.x+o.knocked.x-6, draw.y+o.knocked.y-6, 36, 36);
            disableShadow();
        } else { // No sprite, draw letter box
            bf.drawImage(SpriteMan.genericSprite,draw.x+o.knocked.x, draw.y+o.knocked.y);
            disableShadow();
            bf.fillStyle = '#112244';
            bf.font = 'bold 14px Arial';bf.textAlign = 'center';
            var kerning = jQuery.inArray(o.name[0],['A','B','C','D','G','H','R','M']) >= 0 ? 1 : 0;
            bf.fillText(o.name[0],draw.x+11+kerning+o.knocked.x,draw.y+20+o.knocked.y);
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
            disableShadow();
            bf.fillStyle = 'rgba(0,0,0,0.7)';
            bf.fillRect(draw.x+o.knocked.x,draw.y-5+o.knocked.y,pix+2,5);
            bf.fillStyle = 'white';
            bf.fillRect(draw.x-1+o.knocked.x,draw.y-6+o.knocked.y,pix+2,5);
            var hp = o.realHealth/ o.health[1];
            bf.fillStyle = 'rgba(0,0,0,0.9)';
            bf.fillRect(draw.x+pix+o.knocked.x,draw.y-5+o.knocked.y,Math.floor((pix)*(1-hp))*-1,3);
        }
        // Draw hover info
        if(cursor.hover.hasOwnProperty(o.guid)) {
            bf.fillStyle = 'rgba('+quality.r+','+quality.g+','+quality.b+',1)';
            var grid = o.x+':'+o.y;
            var healthSpacing = showHealth ? 10 : 0;
            TextDraw.drawText(quality.name+' '+o.name, o.health ? 'white' : quality.name, bf,
                'normal','med',draw.x+12,draw.y-8-healthSpacing-(12*(hoverCount[grid] || 0)),'center',1);
            hoverCount[grid] = hoverCount[grid] ? hoverCount[grid] + 1 : 1;
        }
        // Draw select box
        if(!game.selected || game.selected.guid != o.guid) return;
        bf.lineWidth = 2; bf.strokeStyle = 'rgba(200,230,255,0.5)';
        bf.beginPath();
        bf.moveTo(draw.x,draw.y); bf.lineTo(draw.x + pix,draw.y);
        bf.lineTo(draw.x + pix,draw.y + pix); bf.lineTo(draw.x,draw.y + pix);
        bf.closePath(); bf.stroke();
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
        drawP.x += 11;
        if(drawP.x < pix*-1 || drawP.x > mWidth
            || drawP.y < pix*-1 || drawP.y > mHeight) return;
        bf.shadowColor = 'rgba(0,0,0,0.5)';
        bf.shadowBlur = 5; bf.shadowOffsetX = 1; bf.shadowOffsetY = 1;
        bf.fillStyle = 'rgba('+ p.color.rgb.r+','+p.color.rgb.g+','+p.color.rgb.b+','+(p.containerPrompt ? 0.7 : 1)+')';
        bf.beginPath(); bf.arc(drawP.x+pix/2, drawP.y+pix/4, 9, 0, 2 * Math.PI, false); bf.fill();
        disableShadow();
        // Render other player's names
        if(game.player.guid != p.guid) {
            TextDraw.drawText(p.name,'white', bf, 'normal','med',drawP.x + 12, drawP.y - 14,'center',1);
        }
        // Render player attack
        if(p.attacking && p.attacking.dir) {
            if(p.attacking.dir.y == 0 && p.attacking.dir.x == 0) {
                var attackProgress = 1 - Math.pow((25-p.attacking.frame),5)/Math.pow(25,5);
                var attack = Util.isoToScreenRel(p.attacking.dir.x,p.attacking.dir.y);
                attack.x *= attackProgress + 1; attack.y *= attackProgress + 1;
                attack.y += -7 + attackProgress*25;
                bf.fillStyle = 'rgba(255,255,255,'+(1-attackProgress)+')';
                bf.fillRect(drawP.x+Math.floor(attack.x/2)+9,drawP.y+Math.floor(attack.y/2)+5,6,6);
            } else if(p.attacking.frame < 78) {
                var attackSpriteX = Math.floor((p.attacking.frame-1)/2)*59;
                var attackSpriteY = (p.attacking.dir.x > 0 || p.attacking.dir.y < 0 ? 43 : 0) +
                    86 * jQuery.inArray(p.attacking.type,SpriteMan.abiSpriteLib.names);
                var attackOffsetX = p.attacking.dir.x + p.attacking.dir.y < 0 ? -33 : -2;
                var attackOffsetY = p.attacking.dir.x > 0 || p.attacking.dir.y < 0 ? -32 : -8;
                var attackDir = p.attacking.dir.x + p.attacking.dir.y < 0 ? 'left' : 'right';
                bf.drawImage(SpriteMan.attacksImg[attackDir], attackSpriteX, attackSpriteY, 59,43,
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
            bf.save();
            bf.globalAlpha = f.frame >= (f.time - 20) ? (f.time - f.frame) / 20 : 1; // Fade out
            TextDraw.drawText(''+f.amt, 'yellow', bf, 'dmg',fontSize,drawFX.x-1,drawFX.y,'center',1);
            bf.restore();
        } else if(f.type == 'combo') {
            bf.save();
            bf.globalAlpha = f.frame >= (f.time - 20) ? (f.time - f.frame) / 20 : 1; // Fade out
            TextDraw.drawText(f.text, 'white', bf, 'normal','med',drawFX.x,drawFX.y,'center',1);
            bf.restore();
        } else if(f.type == 'spark') {
            bf.save();
            bf.globalAlpha = f.frame >= (f.time - 20) ? (f.time - f.frame) / 20 : 1; // Fade out
            bf.fillStyle = 'rgba(0,0,0,0.7)';
            bf.fillRect(drawFX.x+1,drawFX.y+1,f.width,f.height);
            bf.fillStyle = f.color;
            bf.fillRect(drawFX.x,drawFX.y,f.width,f.height);
            bf.restore();
        } else if(f.type == 'rain') {
            // TODO: Gradient trail
            bf.save();
            bf.globalAlpha = f.frame >= (f.time - 10) ? (f.time - f.frame) / 10 : // Fade out
                f.frame < 30 && !f.splash ? f.frame/30 : 1; // Fade in
            bf.fillStyle = f.color;
            bf.fillRect(drawFX.x-10,drawFX.y-5,1,f.splash ? 1 : f.vz*pix*2);
            bf.restore();
        } else if(f.type == 'snow') {
            bf.save();
            bf.globalAlpha = f.frame >= (f.time - 300) ? (f.time - f.frame) / 300 : // Fade out
                f.frame < 60 ? f.frame/60 : 1; // Fade in
            bf.fillStyle = f.color;
            bf.fillRect(drawFX.x-10,drawFX.y+15,1,1);
            bf.restore();
        } else if(f.type == 'sparkle') {
            bf.save();
            bf.shadowColor = f.color; bf.shadowBlur = 2;
            bf.shadowOffsetX = 0; bf.shadowOffsetY = 0;
            if(f.style == 'fireflies') {
                bf.globalAlpha = f.frame < 60 ? f.frame/60 : (f.time - f.frame) / 60; // Fade in & out
            } else if(f.style == 'evaporate') {
                bf.globalAlpha = f.frame < 20 ? f.frame/20 : (f.time - f.frame) / 100; // Fade in & out
            }
            bf.globalAlpha *= (0.35 - (Math.pow(f.xd, 2) + Math.pow(f.yd, 2))) / 0.35;
            bf.fillStyle = f.color;
            bf.fillRect(drawFX.x,drawFX.y,1,1);
            bf.restore();
        }
    };
    
    return {
        init: function(g) { game = g; pix = game.arena.pixels; UIMan.initGame(g); },
        initMainCanvas: function(canvas,ctx,curse) { 
            cm = ctx; cvm = canvas; mWidth = canvas.width; mHeight = canvas.height;
            bfCanvas.width = mWidth; bfCanvas.height = mHeight;
            bf.mozImageSmoothingEnabled = false;
            bf.msImageSmoothingEnabled = false;
            bf.imageSmoothingEnabled = false;
            cursor = curse;
            UIMan.init(cursor,bf,mWidth,mHeight);
        },
        initZoomCanvas: function(canvas,ctx) { cz = ctx; cvz = canvas; zWidth = canvas.width; zHeight = canvas.height; },
        drawFrame: function(rt,step,tick) {
            if(!cvm || !mWidth || !pix) return;
            bf.clearRect(0,0,mWidth,mHeight);
            if(SpriteMan.getLoadProgress() < 1) { // Show loading screen
                bf.fillStyle = '#777777';
                bf.font = 'bold 24px Arial';bf.textAlign = 'center';
                bf.fillText('Loading Sprites '+Math.round(SpriteMan.getLoadProgress()*100)+'%',
                    mWidth/2, mHeight/2 - 12);
                bf.fillRect(200, mHeight/2+6, mWidth-400,20);
                bf.clearRect(cvm.width-202, mHeight/2+8, 
                    (1-SpriteMan.getLoadProgress())*(-mWidth+404),16);
                return;
            }

            // Apply cold filter
            //if(!game.player.inContainer && game.weather.now.temp < 36) {
            //    bf.globalCompositeOperation = 'source-atop';
            //    bf.fillStyle = 'rgba(255,255,255,'+((12-game.weather.now.temp/3)/100)+')';
            //    bf.fillRect(0,0, mWidth, mHeight);
            //    bf.globalCompositeOperation = 'source-over';
            //}
            
            cycle = game.ticks % 240; // Every 4 seconds
            glowRamp = (cycle > 120 ? 120 - (cycle - 120) : cycle) / 30;
            
            // Build render array
            var curMap = World.getMap(game.player);
            if(map.data != curMap) updateMap(curMap);
            renderArray = angular.copy(map.renderArray);
            if(game.player.path) {
                for(var pn = 0; pn < game.player.path.length; pn++) {
                    var node = game.player.path[pn];
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
                    addToRender({ opacity: pn == 0 ? 1 - game.player.moveProgress : 1,
                        tile: pathTile, x: node.x, y: node.y }, node.x, node.y-2, 'path');
                }
                bf.globalAlpha = 1;
            }
            var objects = world.things.concat(world.containers);
            for(var j = objects.length-1; j >= 0; j--) {
                var o = objects[j];
                if(o.removed && !o.dropped) continue; // Skip if object removed and not dropped
                var tdx = (o.sx - game.player.osx)*(game.arena.width) + o.x,
                    tdy = (o.sy - game.player.osy)*(game.arena.height) + o.y;
                if(tdx > 14 || tdx < 0 || tdy > 14 || tdy < 0) continue;
                addToRender(o,tdx,tdy+0.3,'object');
            }
            var pdx = game.player.ox, pdy = game.player.oy;
            var pddx = (game.player.path ? game.player.path[0].x : pdx),
                pddy = (game.player.path ? game.player.path[0].y : pdy);
            pdx += game.player.moveProgress ? (pddx - pdx) * game.player.moveProgress : 0;
            pdy += game.player.moveProgress ? (pddy - pdy) * game.player.moveProgress : 0;
            addToRender(game.player,pdx,pdy+0.3,'player');
            Effects.prepareRender(addToRender);
            hoverCount = {};
            Math.seedrandom();
            for(var r = 0; r < renderArray.length; r++) { if(!renderArray[r]) continue;
                var subArray = renderArray[r];
                for(var ri = 0; ri < subArray.length; ri++) {
                    switch(subArray[ri].renderType) {
                        case 'tile': renderTile(subArray[ri]); break;
                        case 'path': renderPath(subArray[ri]); break;
                        case 'object': renderObject(subArray[ri]); break;
                        case 'player': renderPlayer(subArray[ri]); break;
                        case 'effect': renderEffect(subArray[ri]); break;
                    }
                }
            }
            
            var quality;
            // Render inventory
            game.drawInventory = true;
            // TODO: Move to UI manager
            if(game.drawInventory) {
                //for(var tb1 = 0; tb1 < 5; tb1++) {
                //    bf.drawImage(inventorySpriteImg,0,0,46,24,194 + 28*tb1, 316 + 14*tb1, 46, 24);
                //}
                var tbX = 376, tbY = 367, tbXS = 34, tbYS = 17;
                for(var tb = 0; tb < game.player.toolbelt.length; tb++) { // Draw toolbelt
                    var tbItem = game.player.toolbelt[tb];
                    if(tbItem) {
                        if(tbItem.cooldown) {
                            bf.save(); bf.globalAlpha = 0.5;
                        }
                        bf.fillStyle = '#525252';
                        bf.fillRect(tbX+28 + tbXS*tb,tbY+14 - tbYS*tb,28,14);
                        var abilityPos = 0;
                        for(var a in tbItem.abilities) { if(!tbItem.abilities.hasOwnProperty(a)) continue;
                            bf.fillStyle = tbItem.cooldown && tbItem.cooldown[0] == a ? '#292b2a' : '#525252';
                            bf.fillRect(tbX+56 + tbXS*tb+59*abilityPos,tbY+14 - tbYS*tb,55,14);
                            if(tbItem.cooldown && tbItem.cooldown[0] == a) {
                                bf.fillStyle = '#565656';
                                var totalCool = Math.max(1,Things.abilities[a].cooldown-tbItem.handling)*1;
                                bf.fillRect(tbX+56 + tbXS*tb+59*abilityPos,tbY+14 - tbYS*tb,
                                    /*Math.floor*/(55*((totalCool-tbItem.cooldown[1])/totalCool)),14);
                            }
                            bf.drawImage(SpriteMan.inventorySpriteImg,
                                (jQuery.inArray(a,SpriteMan.abiSpriteLib.names)-1)*14,28,14,14,
                                tbX+57 + tbXS*tb+59*abilityPos,tbY+14 - tbYS*tb,14,14);
                            TextDraw.drawText(Util.capitalize(a), 'white', bf,
                                'normal','med',tbX+90 + tbXS*tb+59*abilityPos,tbY+17 - tbYS*tb,'center',1);
                            abilityPos++;
                        }
                        if(tbItem.cooldown) bf.restore();
                    }
                    if(tbItem && game.selected && game.selected.guid == tbItem.guid) {
                        bf.drawImage(SpriteMan.inventorySpriteImg,108,0,54,28,tbX + tbXS*tb, tbY - tbYS*tb, 54, 28);
                    } else if(cursor.onTBslot == tb) {
                        bf.drawImage(SpriteMan.inventorySpriteImg,54,0,54,28,tbX + tbXS*tb, tbY - tbYS*tb, 54, 28);
                    } else {
                        bf.drawImage(SpriteMan.inventorySpriteImg,0,0,54,28,tbX + tbXS*tb, tbY - tbYS*tb, 54, 28);
                    }
                    if(!tbItem) continue;
                    if(game.dragging && game.dragging.guid == tbItem.guid) {
                        bf.save(); bf.globalAlpha = 0.5;
                    }
                    quality = Util.objectQuality(tbItem);
                    if(tbItem.quality >= 860) {
                        bf.shadowColor = qualityShadow(tbItem);
                        bf.shadowBlur = 5; bf.shadowOffsetX = 0; bf.shadowOffsetY = 0;
                    }
                    bf.drawImage(SpriteMan.getThingSprite(tbItem),0, 0, pix, pix,
                        tbX+15 + tbXS*tb,tbY-3 - tbYS*tb,pix,pix);
                    disableShadow();
                    if(game.dragging && game.dragging.guid == tbItem.guid) bf.restore();
                }
                bf.fillStyle = '#424242';
                bf.fillRect(609,266,108,52);
                // TODO: Isometric backpack?
                for(var bp = 0; bp < game.player.backpack.length; bp++) { // Draw backpack
                    var bpItem = game.player.backpack[bp];
                    if(bpItem && game.selected && game.selected.guid == bpItem.guid) {
                        bf.fillStyle = '#b5b5b5';
                        bf.fillRect(608+(bp%4)*28-1,265+Math.floor(bp/4)*28-1,28,28);
                    } else if(cursor.onBPslot == bp) {
                        bf.fillStyle = '#6e6e6e';
                        bf.fillRect(608+(bp%4)*28-1,265+Math.floor(bp/4)*28-1,28,28);
                    }
                    bf.fillStyle = '#4a4a4a';
                    bf.fillRect(608+(bp%4)*28,265+Math.floor(bp/4)*28,26,26);
                    if(!bpItem) continue;
                    if(game.dragging && game.dragging.guid == bpItem.guid) {
                        bf.save(); bf.globalAlpha = 0.5;
                    }
                    quality = Util.objectQuality(bpItem);
                    if(bpItem.quality >= 860) {
                        bf.shadowColor = qualityShadow(bpItem);
                        bf.shadowBlur = 5; bf.shadowOffsetX = 0; bf.shadowOffsetY = 0;
                    }
                    bf.drawImage(SpriteMan.getThingSprite(bpItem),0, 0, pix, pix,
                        609+(bp%4)*28,266+Math.floor(bp/4)*28,pix,pix);
                    disableShadow();
                    if(game.dragging && game.dragging.guid == bpItem.guid) {
                        bf.restore();
                    }
                }
                game.drawInventory = false;
            }
            if(game.dragging && cursor.x != '-') {
                quality = Util.objectQuality(game.dragging);
                if(game.dragging.quality >= 860) {
                    bf.shadowColor = qualityShadow(game.dragging);
                    bf.shadowBlur = 5; bf.shadowOffsetX = 0; bf.shadowOffsetY = 0;
                }
                bf.drawImage(SpriteMan.getThingSprite(game.dragging),0, 0, pix, pix,
                    +cursor.x-pix/2,+cursor.y-pix/2,pix,pix);
                disableShadow();
            }
            // Draw thrown items
            // TODO; Move to render array
            for(var throwKey in world.thrown) { if(!world.thrown.hasOwnProperty(throwKey)) continue;
                if(!world.thrown[throwKey].physics) continue;
                var throwDraw = Util.isoToScreen(world.thrown[throwKey].physics.x,world.thrown[throwKey].physics.y);
                throwDraw.x += 11; throwDraw.y += -7 - world.thrown[throwKey].physics.z * pix;
                quality = Util.objectQuality(world.thrown[throwKey]);
                if(world.thrown[throwKey].quality >= 860) {
                    bf.shadowColor = qualityShadow(world.thrown[throwKey]);
                    bf.shadowBlur = 5; bf.shadowOffsetX = 0; bf.shadowOffsetY = 0;
                }
                bf.drawImage(SpriteMan.getThingSprite(world.thrown[throwKey]),0, 0, pix, pix,
                    throwDraw.x,throwDraw.y,pix,pix);
                disableShadow();
            }
            // Render minimap
            bf.fillStyle = '#666666';
            bf.fillRect(0,30,mmWidth+2,mmHeight+2);
            bf.fillStyle = 'rgba(44,46,45,0.9)';
            bf.fillRect(1,31,mmWidth,mmHeight);
            var mmDiv = game.options.minimapZoom > 1 ? game.options.minimapZoom > 2 ? 15 : 35 : 105;
            var mmReach = (mmDiv - 1) / 2;
            var mmw = mmWidth / mmDiv, mmh = mmHeight / mmDiv;
            bf.fillStyle = game.player.inContainer ? '#474957' : '#41535a';
            for(var mmsx = -mmReach; mmsx <= mmReach; mmsx++) {
                for(var mmsy = -mmReach; mmsy <= mmReach; mmsy++) {
                    var thingCount = game.player.explored[(+game.player.osx+mmsx)+','+(+game.player.osy+mmsy)];
                    if(thingCount >= 0) {
                        bf.fillRect(1+mmw*(mmReach+mmsx),31+mmh*(mmReach+mmsy),mmw,mmh);
                    }
                }
            }
            bf.fillStyle = '#60889f'; bf.fillRect(1+mmw*mmReach,31+mmw*mmReach,mmw,mmh);
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
                cz.drawImage(cvm,zx,zy,zWidth,zHeight,0,0,zWidth,zHeight);
                if(!game.player.attacking || game.player.attacking.type == 'punch') {
                    zoomFrame--;
                    if(zoomFrame < 9) cvz.style.opacity = zoomFrame/8;
                } else {
                    zoomFrame++;
                }
            } else { if(zoomFrame <= 0) { zoomed = false; prevZoomed = false; } }
            // Render UI
            UIMan.render();
            
            // Render buffer to canvas
            cm.clearRect(0,0,mWidth,mHeight);
            cm.drawImage(bfCanvas,0,0);
        }
    };
});