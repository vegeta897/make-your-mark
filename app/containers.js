'use strict';
Application.Services.factory('Containers',function(Things,Util) {
    
    var CONTAINERS = {
        chest: { name:'Chest', common:10, maxContent:2,
            tiers:[['plastic',40,100],['wooden',80,150],['ceramic',120,200],['aluminum',300,300],['steel',500,500],
                ['silver',600,800],['gold',700,1200],['jeweled',1000,2000],['diamond',2000,4000]] },
        present: { name:'Present', common:30, maxContent:1, 
            tiers:[['plain',20,50],['cute',25,75],['pretty',30,12],['elegant',40,20]] },
        bag: { name:'Bag', common:50, maxContent:2, 
            tiers:[['paper',10,10],['plastic',15,15],['cloth',30,35],['velvet',35,100]] },
        buried: { name:'Mound', common:20, maxContent:1, tiers:[['dirt',40,50],['gravel',70,60],['clay',100,70]] },
        crate: { name:'Crate', common:50, maxContent:4, tiers:[['wooden',60,80],['metal',200,200],['armored',450,450]] }
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
                    var tierData = newContainer.tiers[t];
                    newContainer.tier = tierData[0];
                    newContainer.tierNum = newContainer.tiers.length - 1 - t;
                    var health = parseInt(+tierData[1] * 3 * (Util.randomIntRange(8,12)/10));
                    newContainer.health = [health,health];
                    newContainer.realHealth = health;
                    newContainer.value = Math.ceil(tierData[2]*2 / newContainer.maxContent);
                    break;
                }
            }
            return newContainer;
        }
    };
    
    var spawnContainerThing = function(container,i) {
        return Things.spawnThing({
            seed:container.guid+'|'+i, anyItem:true, containerValue: container.value
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
                if(totalValue > container.value) break;
            }
            return contents;
        },
        spawnContainer: spawnContainer, spawnContainerThing: spawnContainerThing
    };
});