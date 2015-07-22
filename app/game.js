'use strict';
Application.Services.factory('Game',function($timeout,FireService,Renderer,Players,Controls,World,Interface) {

    var game = {
        arena: {width: 37, height: 25, pixels: 24}, fps: 60, rendered: true,
        objects: {}, player: Players.player
    };
    
    game.localServerOffset = 0; game.tickCount = 0;
    game.frames = 0; game.frameCount = 0; game.framesPerSecond = 0;
    
    var now, dt = 0, last = 0, step = 1000/game.fps; // 60 FPS
    
    var tick = function() {
        if(game.crashed) { return; }
        now = performance.now(); dt += (now - last);
        if(dt > 60000) { console.log('too many updates missed! game crash'); game.crashed = true; game.paused = true; }
        if(dt > step) {
            while(dt >= step) {
                dt -= step; if(game.paused && !game.oneFrame) { continue; } else { game.rendered = false; }
                game.ticks++; update(step,dt,now); game.oneFrame = false;
            }
        }
        last = now;
    };
    
    var frame = function() {
        var rt = performance.now() - last;
        game.frames++; game.frameCount++; 
        if(!game.rendered) {
            Renderer.drawFrame(rt,step,game.ticks);
            game.rendered = true;
            $timeout(function(){});
        }
        requestAnimationFrame(frame);
    };
    
    var update = function(step,dt,now) {
        if(!World.worldReady()) return;
        Controls.processInput(game,Players);
        Players.update(step,game.ticks);
        World.update();
        if(game.ticks % game.fps == 0) { // Every game second
            game.framesPerSecond = game.frameCount;
            game.tickCount = 0; game.frameCount = 0;
        }
    };
    
    return {
        game: game,
        init: function() { // Initialize game
            FireService.initServerTime(function(offset){
                game.localServerOffset = offset;
                game.ticks = Math.floor(((Date.now() + game.localServerOffset) - 1423000000000) / step);
                last = performance.now();
                Renderer.init(game);
                World.initGame(game);
                //World.setPosition(game.player.x,game.player.y);
                Interface.initGame(game);
                Players.initGame(game);
                setInterval(tick,step);
                requestAnimationFrame(frame);
            });
        }
    };
});