'use strict';
Application.Services.factory('Things',function(Util) {
    
    var abilities = {
        bash: { past: 'Bashed', cooldown: 20, time: 32, buffs: ['mighty','forceful','weighty'], nerfs: ['weak','frail'] },
        snip: { past: 'Snip', cooldown: 100, time: 50, buffs: ['razor','sharpened'], nerfs: ['dull','blunted','rusty'] },
        stab: { past: 'Stabbed', cooldown: 60, time: 58, buffs: ['sharpened','stinging'], nerfs: ['dull','blunted'] },
        pry: { past: 'Pried', cooldown: 200, time: 68, buffs: ['sturdy','robust'], nerfs: ['bent','crooked'] },
        slice: { past: 'Sliced', cooldown: 60, time: 32, buffs: ['razor','sharpened','stinging'], nerfs: ['dull','blunted','rusty'] },
        saw: { past: 'Sawed', cooldown: 500, time: 62, buffs: ['razor','sharpened','biting'], nerfs: ['dull','rusty'] },
        chop: { past: 'Chopped', cooldown: 100, time: 32, buffs: ['razor','sharpened','biting','forceful'], nerfs: ['dull','blunted'] },
        dig: { past: 'Dug', cooldown: 200, time: 52, buffs: ['sturdy','robust'], nerfs: ['bent','crooked'] },
        swat: { past: 'Swatted', cooldown: 40, time: 38, buffs: ['swift','nimble'], nerfs: [] },
        wipe: { past: 'Wiped', cooldown: 200, time: 50, buffs: ['absorbent'], nerfs: [] },
        vibrate: { past: 'Vibrated', cooldown: 400, time: 74, buffs: [], nerfs: [] },
        poke: { past: 'Poked', cooldown: 60, time: 72, buffs: [], nerfs: [] },
        bonk: { past: 'Bonked', cooldown: 60, time: 54, buffs: ['goofy'], nerfs: [] },
        reflect: { past: 'Reflected', cooldown: 300, time: 52, buffs: ['polished'], nerfs: ['cloudy'] },
        stick: { past: 'Stuck', cooldown: 400, time: 50, buffs: ['tacky'], nerfs: ['dry'] },
        erase: { past: 'Erased', cooldown: 100, time: 64, buffs: ['fresh'], nerfs: [] },
        write: { past: 'Wrote', cooldown: 300, time: 78, buffs: [], nerfs: [] },
        pay: { past: 'Paid', cooldown: 1000, time: 58, buffs: ['valuable'], nerfs: ['cheap'] },
        charm: { past: 'Charmed', cooldown: 1000, time: 76, buffs: ['alluring','captivating'], nerfs: ['repulsive'] }
    };
    
    var THINGS = {
        pencil: { name: 'Pencil', desc: 'A fine writing utensil.',
            common: 500, size: [1,1,12], weight: 5, hands: 1, handling: 2, colors: [8,6,5,2,8,4,1],
            abilities: { write: 1, stab: 1, erase: 1 }, material: { wood:90,aluminum:1,rubber:4,graphite:5 }
        },
        pen: { name: 'Pen', desc: 'A finer writing utensil.',
            common: 350, size: [1,1,14], weight: 8, hands: 1, handling: 2, colors: [7,2,6,1,6,30],
            abilities: { write: 2, stab: 1 }, material: { plastic:87,aluminum:5,ink:8 }
        },
        paper: { name: 'Paper', desc: 'Flat, white, rectangular, flimsy.',
            common: 500, size: [0,22,28], weight: 1, hands: 1, handling: 1,
            abilities: { wipe: 1, swat: 2 }, material: { paper:100 }
        },
        rock: { name: 'Rock', desc: 'About the size of your fist.',
            common: 400, size: [9,11,10], weight: 80, hands: 1, handling: 1,
            abilities: { bash: 2 }, material: { rock:100 }
        },
        shovel: { name: 'Shovel', desc: 'Great for digging.',
            common: 200, size: [105,20,4], weight: 1000, hands: 2, handling: 3,
            abilities: { bash: 3, dig: 2 }, material: { wood:70,steel:30 }
        },
        hammer: { name: 'Hammer', desc: 'THWACK!',
            common: 250, size: [30,11,4], weight: 160, hands: 1, handling: 4,
            abilities: { bash: 3, pry: 1 }, material: { wood:70,steel:30 }
        },
        scissors: { name: 'Scissors', desc: 'One pair of one scissors.',
            common: 400, size: [14,7,1], weight: 25, hands: 1, handling: 2, colors: [10,2,12,10,1,8,8,2],
            abilities: { snip: 1, stab: 1, slice: 1 }, material: { plastic:25,steel:75 }
        },
        banana: { name: 'Banana', desc: 'Just like the monkeys eat!',
            common: 250, size: [4,17,5], weight: 40, hands: 1, handling: 2,
            abilities: { bonk: 1 }, material: { banana:100 }
        },
        guitar: { name: 'Guitar', desc: '6-string acoustic.',
            common: 30, size: [35,16,95], weight: 300, hands: 2, handling: 2,
            abilities: { bash: 1, charm: 5 }, material: { wood:90,nylon:2,aluminum:8 }
        },
        stick: { name: 'Stick', desc: 'Like from a tree!',
            common: 450, size: [2,50,2], weight: 50, hands: 1, handling: 3,
            abilities: { swat: 1, poke: 2 }, material: { wood:100 }
        },
        cellphone: { name: 'Cellphone', desc: 'Or "mobile phone" if you\'re across the pond.',
            common: 100, size: [2,10,5], weight: 30, hands: 1, handling: 1, colors: [5,20,10,2,16,16],
            abilities: { vibrate: 1, poke: 1 }, material: { plastic:80,circuitry:10,battery:10 }
        },
        chewingGum: { name: 'Gum', desc: 'Refreshing spearmint.',
            common: 100, size: [2,7,0], weight: 2, hands: 1, handling: 1,
            abilities: { stick: 1 }, material: { paper:2,foil:3,sugar:5,rubber:90 }
        },
        eraser: { name: 'Eraser', desc: 'Of the classic pink parallelogram variety.',
            common: 300, size: [5,1,2], weight: 12, hands: 1, handling: 2,
            abilities: { erase: 3 }, material: { rubber:100 }
        },
        coin: { name: 'Coin', desc: 'A golden coin embossed with the letters "MYM".',
            common: 5, size: [4,1,4], weight: 20, hands: 1, handling: 1,
            abilities: { pay: 1 }, material: { gold:100 }
        },
        cookie: { name: 'Cookie', desc: 'Dotted with chocolate chips. Possibly stale.',
            common: 10, size: [8,1,8], weight: 15, hands: 1, handling: 1,
            abilities: { charm: 3 }, material: { sugar:15,bread:85 }
        },
        mirror: { name: 'Mirror', desc: 'A brightly colored circle stares back at you.',
            common: 80, size: [14,1,36], weight: 50, hands: 1, handling: 3, colors: [25,25,20,2,5],
            abilities: { bash: 1, reflect: 1 }, material: { plastic:80,glass:20 }
        },
        saw: { name: 'Saw', desc: 'Have you seen this saw?',
            common: 150, size: [3,15,55], weight: 150, hands: 1, handling: 3,
            abilities: { saw: 1, swat: 1 }, material: { wood:50,steel:50 }
        },
        axe: { name: 'Axe', desc: 'Heeere\'s Johnny!',
            common: 200, size: [5,25,100], weight: 1500, hands: 2, handling: 3,
            abilities: { chop: 3, bash: 1 }, material: { steel:100 }
        }
    };
    
    var thingsArray = []; // Array for RNG spawning
    var totalCommon = function() { // Self-executing function
        var total = 0;
        for(var key in THINGS) { if(!THINGS.hasOwnProperty(key)) continue;
            THINGS[key].id = key;
            if(THINGS[key].noSpawn) continue;
            thingsArray.push(THINGS[key]);
            total += THINGS[key].common;
        }
        return total;
    }();

    var changeThing = function(thing,changeTo) {
        var newThing = angular.copy(THINGS[changeTo]);
        thing.changedFrom = thing.id;
        thing.id = newThing.id; thing.name = newThing.name; thing.size = newThing.size; thing.common = newThing.common;
        thing.desc = newThing.desc; thing.weight = newThing.weight; thing.hands = newThing.hands;
        thing.handling = newThing.handling; thing.abilities = newThing.abilities; thing.material = newThing.material;
    };
    
    var spawnThing = function(params) {
        var seed = params.hasOwnProperty('sx') ? Util.positionSeed(params.sx,params.sy,params.x,params.y) : params.seed;
        Math.seedrandom('thing'+seed);
        var newThing;
        if(params.anyItem) { // Don't apply weighting to choice of item
            newThing = angular.copy(THINGS[Util.pickInObject(THINGS)]);
        } else { // Choose item with weighting
            var target = Util.randomIntRange(1,totalCommon);
            var total = 0;
            for(var i = 0; i < thingsArray.length; i++) {
                total += thingsArray[i].common;
                if(total < target) continue;
                newThing = angular.copy(thingsArray[i]);
                break;
            }
        }
        newThing.sx = params.sx || 0; newThing.sy = params.sy || 0;
        newThing.x = params.x || 0; newThing.y = params.y || 0;
        newThing.guid = 't'+seed;
        if(newThing.colors) {
            var colorRoll = Util.randomIntRange(1,100);
            var cumulative = 0;
            for(var c = 0; c < newThing.colors.length; c++) {
                cumulative += newThing.colors[c];
                if(colorRoll <= cumulative) { newThing.color = c; break; }
            }
        }
        newThing.quality = Util.randomIntRange(params.containerValue ? 300 : 1, 
            params.containerValue ? 1000 : Util.randomIntRange(300,1000));
        newThing.quality = params.containerValue ? 
            Math.floor(newThing.quality + (1001 - newThing.quality) * (params.containerValue/5000)) : newThing.quality;
        newThing.value = thingValue(newThing);
        if(params.quality) newThing.quality = params.quality;
        if(newThing.quality >  860 && newThing.quality > Util.randomIntRange(860,1000)) {
            var abiBuff = Util.pickInObject(newThing.abilities);
            newThing.buff = Util.pickInArray(abilities[abiBuff].buffs);
            newThing.buffAbility = abiBuff;
            newThing.buffAmount = Util.randomIntRange(1,Math.round(1+(newThing.quality-860)/20));
        }
        newThing.handling = Math.max(1,Math.min(100,Math.round(newThing.handling * Util.randomIntRange(85,115)/100)));
        newThing.power = Math.floor(Math.max(1,Math.pow(newThing.quality/200,1.2)));
        return newThing;
    };
    
    var thingValue = function(thing) {
        return (1000 - THINGS[thing.id].common) * thing.quality / 1000;
    };
    
    return {
        spawnThing: spawnThing, changeThing: changeThing,
        expandThings: function(th) {
            if(!th || th.length == 0) return [];
            th = angular.copy(th);
            for(var i = 0; i < th.length; i++) {
                var t = th[i];
                if(!t) { th[i] = 0; continue; }
                var guid = t.g;
                var quality = +t.q;
                var sx = +t.sx, sy = +t.sy, x = +t.x, y = +t.y;
                var changedTo = t.ct;
                var cooldown = t.cd;
                var pos = Util.positionFromSeed(guid);
                var params = {sx:pos.sx,sy:pos.sy,x:pos.x,y:pos.y};
                if(guid[1] == 'c') { // If thing from container
                    var containerGUID = guid.split('t')[1].split('|')[0];
                    var contentIndex = guid[guid.length-1];
                    params = {seed:containerGUID+'|'+contentIndex, anyItem:true, quality:quality};
                }
                t = spawnThing(params);
                t.sx = sx; t.sy = sy; t.x = x; t.y = y;
                if(changedTo) changeThing(t,changedTo);
                if(cooldown) t.cooldown = cooldown;
                th[i] = t;
            }
            return th;
        },
        shrinkThings: function(th) {
            if(!th || th.length == 0) return [];
            th = angular.copy(th);
            for(var i = 0; i < th.length; i++) {
                if(!th[i]) continue;
                var storedThing = {
                    sx: th[i].sx, sy: th[i].sy, x: th[i].x, y: th[i].y, g: th[i].guid,
                    ct: th[i].changedFrom ? th[i].id : null, q: th[i].guid[1] == 'c' ? th[i].quality : null,
                    cd: th[i].cooldown ? th[i].cooldown : null
                };
                for(var sk in storedThing) { if(!storedThing.hasOwnProperty(sk)) continue;
                    if(storedThing[sk] === null || storedThing[sk] === undefined) delete storedThing[sk];
                }
                th[i] = storedThing;
            }
            return th;
        },
        getDamage: function(th,abi) {
            var proficiency = th.abilities[abi]/100;
            
        },
        abilities: abilities
    };
});