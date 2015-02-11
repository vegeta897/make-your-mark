'use strict';
Application.Services.factory('Things',function(Util) {
    
    var SIZE = { MICRO: 1, TINY: 2, SMALL: 3, MEDIUM: 4, LARGE: 5, HUGE: 6 };
    
    var things = {
        pencil: { name: 'Pencil', size: SIZE.TINY, common: 100, desc: 'A fine writing utensil.' },
        paper: { name: 'Paper', size: SIZE.TINY, common: 200, desc: 'Flat, white, rectangular, flimsy.' },
        rock: { name: 'Rock', size: SIZE.SMALL, common: 150, desc: 'About the size of your fist, it could do some damage.' },
        scissors: { name: 'Scissors', size: SIZE.SMALL, common: 40, desc: 'One pair of one scissors.' }
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
                var pos = Util.positionFromSeed(th[i]);
                th[i] = spawnThing(pos.x,pos.y);
            }
            return th;
        },
        shrinkThings: function(th) {
            if(!th || th.length == 0) return [];
            th = angular.copy(th);
            for(var i = 0; i < th.length; i++) {
                th[i] = th[i].guid;
            }
            return th;
        }
    };
});