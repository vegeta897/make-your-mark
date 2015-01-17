'use strict';
Application.Services.factory('Game',function($timeout,FireService) {

    var game = {
        arena: {width: 200, height: 100, pixels: 6}, fps: 60,
        objects: {},
        player: {
            input: {}, score: 0
        }
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
            //Canvas.render(rt,game,step,game.ticks);
            rendered = true;
        }
        requestAnimationFrame(frame);
    };
    
    var update = function(step,dt,now) {
        if(game.ticks % game.fps == 0) { // Every game second
            game.framesPerSecond = game.frameCount;
            game.tickCount = game.frameCount = 0;
        }
    };
    
    FireService.initServerTime(function(offset){
        game.localServerOffset = offset;
        game.ticks = Math.floor(((Date.now() + game.localServerOffset) - 1408150000000) / step);
        last = performance.now();
        setInterval(tick,step);
        requestAnimationFrame(frame);
    });
    
    return {
        game: game
    };
});