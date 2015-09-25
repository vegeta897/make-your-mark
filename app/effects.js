'use strict';
Application.Services.factory('Effects',function(Util,TextDraw) {
    var effects = [];
    
    return {
        add: function(fx) { effects.push(fx); },
        prepareRender: function(prepare) {
            for(var ef = 0; ef < effects.length; ef++) {
                var efx = effects[ef];
                prepare(efx,efx.x,efx.y + efx.z,'effect');
            }
        },
        update: function() {
            if(effects.length == 0) return;
            Math.seedrandom();
            for(var f = 0; f < effects.length; f++) {
                var efx = effects[f];
                if(efx.frame >= efx.time) { effects.splice(f,1); f--; continue; } // Delete if time expired
                if(!efx.init) {
                    efx.frame = 1; efx.x = efx.ox; efx.y = efx.oy; efx.z = efx.oz; efx.init = true;
                    efx.vx = efx.vx ? efx.vx : 0; efx.vy = efx.vy ? efx.vy : 0; efx.vz = efx.vz ? efx.vz : 0;
                } else {
                    efx.frame++;
                    efx.x += efx.vx; efx.y += efx.vy; efx.z += efx.vz; // Apply velocities
                }
                // TODO: Add wind for rain and snow
                if(efx.z <= 0) { // Bounce if hit ground
                    if(efx.type == 'rain') {
                        if(!efx.splash) {
                            for(var c = 0; c < Util.randomIntRange(1,3); c++) {
                                effects.push({
                                    type: 'rain', color: efx.color, ox: efx.x, oy: efx.y, oz: 0.01,
                                    vx: (Math.random()*0.06 - 0.03), vy: (Math.random()*0.06 - 0.03),
                                    vz: efx.vz * -0.1, time: 15, splash: true
                                });
                            }
                            effects.splice(f,1); f--; continue;
                        }
                        efx.vz *= -0.02; efx.vx *= 0.6; efx.vy *= 0.6;
                    } else if(efx.type == 'snow') {
                        efx.vz = 0; efx.vx = 0; efx.vy = 0;
                    } else {
                        efx.vz *= -0.4; efx.vx *= 0.6; efx.vy *= 0.6;
                    }
                    efx.z = Math.max(efx.z,0);
                    //if(efx.vz < 0.04) efx.vz = 0;
                }
                if(efx.type == 'damage' || efx.type == 'combo') {
                    efx.vz -= 0.003;
                } else if(efx.type == 'snow') {
                    if(efx.z > 0) {
                        efx.vx = Math.max(-0.004,Math.min(0.004,efx.vx + Math.random() / 1000 - 0.0005));
                        efx.vy = Math.max(-0.004,Math.min(0.004,efx.vy + Math.random() / 1000 - 0.0005));
                    }
                    efx.vz -= 0.0004;
                    efx.vz = Math.max(efx.vz,-0.03);
                } else if(efx.type == 'sparkle') {
                    if(efx.style == 'fireflies') {
                        efx.vx = Math.max(-0.002,Math.min(0.002,efx.vx + Math.random() / 1000 - 0.0005));
                        efx.vy = Math.max(-0.002,Math.min(0.002,efx.vy + Math.random() / 1000 - 0.0005));
                        efx.vz = Math.max(-0.002,Math.min(0.002,efx.vz + Math.random() / 1000 - 0.0005));
                    } else if(efx.style == 'evaporate') {
                        efx.vz += 0.0001;
                    }
                } else {
                    efx.vz -= 0.007;
                }
            }
        },
        effects: effects
    };
});