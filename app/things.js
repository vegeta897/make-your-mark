'use strict';
Application.Services.factory('Things',function(Util) {
    
    var SIZE = { MICRO: 1, TINY: 2, SMALL: 3, MEDIUM: 4, LARGE: 5, HUGE: 6 };
    
    var things = {
        pencil: { name: 'Pencil', size: SIZE.TINY, common: 100 },
        paper: { name: 'Paper', size: SIZE.TINY, common: 200 }
    };

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
    
    return {
        spawnThing: function(seed,x,y) {
            Math.seedrandom(seed);
            var target = Util.randomIntRange(1,totalCommon);
            var total = 0;
            for(var i = 0; i < thingsArray.length; i++) {
                total += thingsArray[i].common;
                if(total < target) continue;
                var newThing = angular.copy(thingsArray[i]);
                newThing.x = x; newThing.y = y;
                return newThing;
            }
        }
    };
});