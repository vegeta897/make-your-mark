'use strict';
Application.Services.factory('Game',function($timeout,FireService,Renderer,Player,Controls,World) {

    var game = {
        arena: {width: 37, height: 25, pixels: 24}, fps: 60,
        objects: {}, player: Player.player
    };
    
    game.frames = game.frameCount = game.localServerOffset = game.framesPerSecond = game.tickCount = 0;
    
    var now, dt = 0, last = 0, rendered = false, step = 1000/game.fps; // 60 FPS

    var tick = function() {
        if(game.crashed) { return; }
        now = performance.now(); dt += (now - last);
        if(dt > 60000) { console.log('too many updates missed! game crash'); game.crashed = game.paused = true; }
        if(dt > step) {
            while(dt >= step) {
                dt -= step; if(game.paused && !game.oneFrame) { continue; } else { rendered = false; }
                game.ticks++; update(step,dt,now);
                game.oneFrame = false;
            }
        }
        last = now;
    };
    var frame = function() {
        var rt = performance.now() - last;
        game.frames++; game.frameCount++;
        if(!rendered) {
            $timeout(function(){});
            var cursor = Controls.getCursor();
            cursor.onThing = World.getThingsAt(cursor.x,cursor.y).length > 0;
            Renderer.drawFrame(rt,step,game.ticks);
            rendered = true;
        }
        requestAnimationFrame(frame);
    };
    
    var update = function(step,dt,now) {
        Controls.processInput(game,Player);
        Player.update(step,game.ticks);
        if(game.ticks % game.fps == 0) { // Every game second
            game.framesPerSecond = game.frameCount;
            game.tickCount = game.frameCount = 0;
        }
    };
    
    // Initialize game
    FireService.initServerTime(function(offset){
        game.localServerOffset = offset;
        game.ticks = Math.floor(((Date.now() + game.localServerOffset) - 1421585000000) / step);
        last = performance.now();
        Renderer.init(game);
        World.initGame(game);
        World.setPosition(game.player.x,game.player.y);
        setInterval(tick,step);
        requestAnimationFrame(frame);
    });
    
    return {
        game: game
    };
});