'use strict';
Application.Services.factory('Containers',function(Util) {
    
    var CONTAINERS = {
        chest: { name:'Chest', common:10, 
            tiers:['plastic','wooden','ceramic','aluminum','steel','silver','gold','jeweled','diamond'] },
        present: { name:'Present', common:50, tiers:['plain','cute','pretty','elegant'] },
        bag: { name:'Bag', common:50, tiers:['paper','plastic','cloth','velvet'] },
        buried: { name:'Mound', common:30, tiers:[] },
        crate: { name:'Crate', common:50, tiers:['wooden','metal','armored'] }
    };
    
    var containersArray = [];
    var totalCommon = function() { // Self-executing function
        var total = 0;
        for(var key in CONTAINERS) { if(!CONTAINERS.hasOwnProperty(key)) continue;
            total += CONTAINERS[key].common;
            CONTAINERS[key].id = key;
            containersArray.push(CONTAINERS[key]);
        }
        return total;
    }();
    
    var spawnContainer = function(sx,sy,x,y) {
        Math.seedrandom('container'+Util.positionSeed(sx,sy,x,y));
        var target = Util.randomIntRange(1,totalCommon);
        var total = 0;
        for(var i = 0; i < containersArray.length; i++) {
            total += containersArray[i].common;
            if(total < target) continue;
            var newContainer = angular.copy(containersArray[i]);
            newContainer.sx = sx; newContainer.sy = sy; newContainer.x = x; newContainer.y = y;
            newContainer.guid = 'c'+Util.positionSeed(sx,sy,x,y);
            newContainer.tiers.reverse(); // Reverse array so lower tiers are more common
            var tier = Util.randomIntRange(1,Math.pow(newContainer.tiers.length+1,4));
            for(var t = 0; t < newContainer.tiers.length; t++) {
                if(tier <= Math.pow(t+2,4)) {
                    newContainer.tier = newContainer.tiers[t];
                    break;
                }
            }
            return newContainer;
        }
    };
    
    return {
        spawnContainer: spawnContainer
    };
});