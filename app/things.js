'use strict';
Application.Services.factory('Things',function(Util) {
    
    var SIZE = { MICRO: 1, TINY: 2, SMALL: 3, MEDIUM: 4, LARGE: 5, HUGE: 6 };
    
    var things = {
        pencil: { name: 'Pencil', size: SIZE.TINY, common: 100,
            desc: 'A fine writing utensil.', actions: ['break'], 
            properties: ['hard','sharp'] },
        paper: { name: 'Paper', size: SIZE.TINY, common: 200,
            desc: 'Flat, white, rectangular, flimsy.', actions: ['tear'], 
            properties: ['flat','cuttable'] },
        rock: { name: 'Rock', size: SIZE.SMALL, common: 150, 
            desc: 'About the size of your fist, it could do some damage.', 
            properties: ['hard'] },
        scissors: { name: 'Scissors', size: SIZE.SMALL, common: 40,
            desc: 'One pair of one scissors.', actions: ['break','cut'], 
            properties: ['hard','sharp'] }
    };
    
    var actions = { // S = Self, T = Target
        'break': function(s) { Util.addThingMod(s,'broken'); },
        'tear': function(s) { Util.addThingMod(s,'torn'); },
        'cut': function(t) { Util.addThingMod(t,'cut'); }
        // TODO: Cutting folded paper makes a paper snowflake
    };
    
    //var guid = 0;
    var thingsArray = [];
    
    var totalCommon = function() {
        var total = 0;
        for(var key in things) { if(!things.hasOwnProperty(key)) continue;
            total += things[key].common;
            things[key].key = key;
            thingsArray.push(things[key]);
        }
        return total;
    }();
    
    var spawnThing = function(x,y) {
        Math.seedrandom('thing'+Util.positionSeed(x,y));
        var target = Util.randomIntRange(1,totalCommon);
        var total = 0;
        for(var i = 0; i < thingsArray.length; i++) {
            total += thingsArray[i].common;
            if(total < target) continue;
            var newThing = angular.copy(thingsArray[i]);
            newThing.x = x; newThing.y = y; newThing.guid = Util.positionSeed(x,y)/*+':'+(guid++)*/;
            return newThing;
        }
    };
    
    return {
        spawnThing: spawnThing,
        expandThings: function(th) {
            if(!th || th.length == 0) return [];
            th = angular.copy(th);
            for(var i = 0; i < th.length; i++) {
                var guid = th[i].split(':')[0];
                var mods = th[i].split(':')[1];
                mods = mods ? mods.split(',') : mods;
                var pos = Util.positionFromSeed(guid);
                th[i] = spawnThing(pos.x,pos.y);
                if(mods) th[i].mods = mods;
            }
            return th;
        },
        shrinkThings: function(th) {
            if(!th || th.length == 0) return [];
            th = angular.copy(th);
            for(var i = 0; i < th.length; i++) {
                var guidMod = th[i].guid;
                if(th[i].hasOwnProperty('mods')) { // If has mods, build comma delimited list
                    guidMod = guidMod + ':';
                    for(var m = 0; m < th[i].mods.length; m++) {
                        guidMod += m == th[i].mods.length - 1 ? th[i].mods[m] : th[i].mods[m] + ',';
                    }
                }
                th[i] = guidMod;
            }
            return th;
        },
        doAction: function(s,a) {
            if(!s.hasOwnProperty('actions') || jQuery.inArray(a,s.actions) < 0) {
                return false; // Cancel if this object "s" can't do this action "a"
            }
            actions[a](s); return true;
        }
    };
});