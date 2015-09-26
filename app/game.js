'use strict';
Application.Services.factory('Game',function($timeout,FireService,Renderer,Players,Controls,World,Things,Effects,Util,Interface,UIMan) {

    var game = {
        arena: {width: 15, height: 15, pixels: 24}, fps: 60, rendered: false,
        objects: {}, player: Players.player, effects: [], 
        weather: { interval: 120, rain: 0, temp: 0, forecast: {rain: 0, temp: 0}, now: {rain: 0, temp: 50} },
        options: { minimapZoom: 4 },
        eventLog: []
    };
    
    game.localServerOffset = 0; game.tickCount = 0;
    game.frames = 0; game.frameCount = 0; game.framesPerSecond = 0;
    
    var now, dt = 0, last = 0, step = 1000/game.fps; // 60 FPS
    var rainCheck;
    
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
        if(game.rendered) requestAnimationFrame(frame);
    };
    
    var updateWeather = function() {
        Math.seedrandom('weather-'+Math.floor(game.globalSecond/game.weather.interval));
        game.weather.rain = Math.max(0,Util.randomIntRange(-1900,100));
        game.weather.temp = Util.randomIntRange(20,80);
        Math.seedrandom('weather-'+Math.floor(game.globalSecond/game.weather.interval+1));
        game.weather.forecast.rain = Math.max(0,Util.randomIntRange(-1900,100));
        game.weather.forecast.temp = Util.randomIntRange(20,80);
        rainCheck = game.globalSecond;
    };
    
    var update = function(step,dt,now) {
        if(!World.worldReady()) return;
        Controls.processInput(game,Players);
        Players.update(step,game.ticks);
        World.update(game.ticks);
        UIMan.update();
        Effects.update();
        if(game.weather.now) {
            var drops = Util.randomSlide(game.weather.now.rain/10,Math.floor(game.weather.now.rain/10),
                Math.ceil(game.weather.now.rain/10));
            // TODO: Rain brings bad luck? But maybe makes certain container types easier? (paper bags, mounds)
            drops /= game.weather.now.temp <= 32 ? 3 : 1;
            for(var i = 0; i < drops; i++) {
                var snow = Util.randomSlide(game.weather.now.temp,32,33) <= 32;
                var brightness = snow ? 1 - Math.random() * 0.05 : Math.random();
                Effects.add({
                    type: snow ? 'snow' : 'rain', 
                    color: 'rgba('+Math.floor(162+brightness*93)+','+Math.floor(186+brightness*69)+','+255+','
                        +(snow ? Math.random()*0.4 + 0.45 : Math.random()*0.2 + 0.1)+')',
                    ox: Math.random()*15, oy: Math.random()*15, oz: 14,
                    vx: (Math.random()*0.04 - 0.020) * (snow ? 0.3 : 1), 
                    vy: (Math.random()*0.04 - 0.020) * (snow ? 0.3 : 1), 
                    vz: snow ? -0.01 : -0.05, time: snow ? 900 : 90
                });
            }
        }
        if(game.ticks % game.fps == 0) { // Every game second
            if(game.globalSecond % game.weather.interval == 0) { // Every 3 minutes
                if(game.globalSecond > rainCheck) updateWeather();
            }
            var weatherProgress = (game.globalSecond % game.weather.interval) / game.weather.interval;
            game.weather.now = {
                rain: game.weather.rain + weatherProgress*(game.weather.forecast.rain - game.weather.rain),
                temp: game.weather.temp + weatherProgress*(game.weather.forecast.temp - game.weather.temp)
            };
            game.globalSecond++;
            game.framesPerSecond = game.frameCount;
            game.tickCount = 0; game.frameCount = 0;
        }
    };
    
    game.addEvent = function(e) {
        var verb = '', toolQuality = '', toolName = '', combo = '';
        if(e.hit.tool) {
            verb = Things.abilities[e.hit.ability].past;
            toolQuality = Util.objectQuality(e.hit.tool);
            toolName = '<span class="'+toolQuality.name+'">' +
                (e.hit.tool.buff ? (Util.capitalize(e.hit.tool.buff) + ' ') : '')
                + toolQuality.name + ' ' + e.hit.tool.name + '</span>';
            combo = e.hit.combo ? (' <strong>('+e.hit.combo+'x '+e.hit.ability+' combo)</strong>') : '';
        } else {
            verb = 'Punched';
            toolName = ' <strong>your fist</strong>'
        }
        game.eventLog.unshift({text: verb + ' <strong>' + e.target.name + 
        '</strong> with '+ toolName+' for <strong>' + e.hit.dmg + '</strong> dmg' + combo});
        game.eventLog.splice(8,1);
    };
    
    window.letItSnow = function() {
        game.weather.rain = 80; game.weather.temp = 20;
        game.weather.forecast.rain = 80; game.weather.forecast.temp = 20;
    };
    window.makeItRain = function() {
        game.weather.rain = 80; game.weather.temp = 70;
        game.weather.forecast.rain = 80; game.weather.forecast.temp = 70;
    };
    window.sunnyDay = function() {
        game.weather.rain = 0; game.weather.temp = 70;
        game.weather.forecast.rain = 0; game.weather.forecast.temp = 70;
    };
    
    return {
        game: game,
        init: function() { // Initialize game
            FireService.initServerTime(function(offset){
                game.localServerOffset = offset;
                game.ticks = Math.floor(((Date.now() + game.localServerOffset) - 1437800000000) / step);
                game.globalSecond = Math.floor(game.ticks / 60);
                updateWeather();
                last = performance.now();
                Renderer.init(game);
                World.initGame(game);
                //World.setPosition(game.player.x,game.player.y);
                Interface.initGame(game);
                Players.initGame(game);
                setInterval(tick,step);
                requestAnimationFrame(frame);
            });
        },
        minimapZoom: function(z) { game.options.minimapZoom = Math.max(1,Math.min(4,game.options.minimapZoom+z)); }
    };
});