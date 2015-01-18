'use strict';
Application.Services.factory('Renderer',function(Canvas,Util) {

    var c; // Canvas object
    var game;
    var renderArray = [];

    return {
        init: function(g) { c = Canvas.getCanvases(); game = g; },
        drawFrame: function(rt,step,tick) {
            Canvas.clear();
            if(!c.main) return;
            for(var bgw = 0; bgw < game.arena.width; bgw++) {
                for(var bgh = 0; bgh < game.arena.height; bgh++) {
                    Math.seedrandom(Util.positionSeed(+game.player.x + +bgw, +game.player.y + +bgh));
                    var tileChance = Math.random();
                    if(tileChance > 0.5) { continue; }
                    else if(tileChance < 0.03) {c.main.fillStyle = 'rgba(0,0,0,0.15)'; }
                    else if(tileChance < 0.1) {c.main.fillStyle = 'rgba(0,0,0,0.1)'; }
                    else if(tileChance < 0.3) {c.main.fillStyle = 'rgba(0,0,0,0.06)'; }
                    else {c.main.fillStyle = 'rgba(0,0,0,0.02)'; }
                    c.main.fillRect(bgw*game.arena.pixels,bgh*game.arena.pixels,game.arena.pixels,game.arena.pixels);
                }
            }
            for(var i = 0; i < renderArray.length; i++) {
                renderArray[i](c);
            }
        },
        addRender: function(r) { renderArray.push(r); console.log('render added to array'); }
    };
});