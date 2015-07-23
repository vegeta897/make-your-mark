'use strict';
Application.Services.factory('Containers',function(Things,Util) {
    
    var CONTAINERS = {
        chest: { name:'Chest', common:10, baseHealth: 50, maxContent:3,
            tiers:['plastic','wooden','ceramic','aluminum','steel','silver','gold','jeweled','diamond'] },
        present: { name:'Present', common:50, baseHealth: 10, maxContent:1, tiers:['plain','cute','pretty','elegant'] },
        bag: { name:'Bag', common:50, baseHealth: 5, maxContent:2, tiers:['paper','plastic','cloth','velvet'] },
        buried: { name:'Mound', common:30, baseHealth: 30, maxContent:1, tiers:['dirt','gravel','clay'] },
        crate: { name:'Crate', common:50, baseHealth: 25, maxContent:4, tiers:['wooden','metal','armored'] }
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
                    newContainer.tierNum = newContainer.tiers.length - 1 - t;
                    var health = parseInt(Math.pow(newContainer.tiers.length - t+1,2)
                        * newContainer.baseHealth * (Util.randomIntRange(8,12)/10));
                    newContainer.health = [health,health];
                    newContainer.realHealth = health;
                    newContainer.common = newContainer.common / (newContainer.tiers.length - t);
                    break;
                }
            }
            return newContainer;
        }
    };
    
    var spawnContainerThing = function(container,i) {
        return Things.spawnThing({
            seed:container.guid+'|'+i, anyItem:true, qualityFactor: container.common
        });
    };
    
    return {
        openContainer: function(container) {
            var contents = [];
            var totalValue = 0;
            for(var i = 0; i < container.maxContent; i++) {
                var spawned = spawnContainerThing(container,i);
                contents.push(spawned);
                totalValue += spawned.value;
                if(totalValue > container.health[1]) break;
            }
            return contents;
        },
        spawnContainer: spawnContainer, spawnContainerThing: spawnContainerThing
    };
});