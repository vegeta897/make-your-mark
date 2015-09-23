'use strict';
Application.Services.factory('Containers',function(Things,Util) {
    
    var CONTAINERS = {
        plastic_chest: { name:'Plastic Chest', common:30, maxContent:1, health:40, value:100,
            bash: 3, pry: 8, saw: 2, chop: 2
        },
        ceramic_chest: { name:'Ceramic Chest', common:25, maxContent:1, health:80, value:150,
            bash: 5, pry: 7, chop: 2
        },
        wooden_chest: { name:'Wooden Chest', common:20, maxContent:1, health:120, value:200,
            bash: 2, pry: 6, saw: 5, chop: 4
        },
        aluminum_chest: { name:'Aluminum Chest', common:15, maxContent:2, health:300, value:300,
            bash: 2, pry: 5, chop: 2
        },
        iron_chest: { name:'Iron Chest', common:12, maxContent:2, health:400, value:400,
            bash: 2, pry: 5
        },
        steel_chest: { name:'Steel Chest', common:10, maxContent:2, health:500, value:500,
            pry: 5
        },
        silver_chest: { name:'Silver Chest', common:8, maxContent:2, health:600, value:800,
            bash: 2, pry: 3
        },
        gold_chest: { name:'Gold Chest', common:5, maxContent:2, health:700, value: 1200,
            bash: 2, pry: 3
        },
        jeweled_chest: { name:'Jeweled Chest', common:3, maxContent:2, health:1000, value:2000,
            pry: 2
        },
        diamond_chest: { name:'Diamond Chest', common:1, maxContent:2, health:2000, value:4000,
            pry: 2
        },
        plain_present: { name:'Plain Present', common:60, maxContent:1, health:20, value:50,
            snip: 3, pry: 2, slice: 2, saw: 2
        },
        cute_present: { name:'Cute Present', common:40, maxContent:1, health:25, value:75,
            snip: 2, pry: 3, slice: 2, saw: 2
        },
        pretty_present: { name:'Pretty Present', common:30, maxContent:1, health:30, value:120,
            snip: 2, pry: 3, slice: 2, saw: 2
        },
        elegant_present: { name:'Elegant Present', common:15, maxContent:1, health:40, value:200,
            snip: 2, pry: 2, slice: 2
        },
        paper_bag: { name:'Paper Bag', common:100, maxContent:1, health:10, value:10,
            snip: 6, stab: 2, slice: 3
        },
        plastic_bag: { name:'Plastic Bag', common:80, maxContent:1, health:15, value:15,
            snip: 5, stab: 3, slice: 3
        },
        cloth_sack: { name:'Cloth Sack', common:50, maxContent:2, health:30, value:35,
            snip: 3, stab: 2
        },
        velvet_pouch: { name:'Velvet Pouch', common:15, maxContent:1, health:25, value:100,
            snip: 2
        },
        dirt_mound: { name:'Dirt Mound', common:30, maxContent:1, health:40, value:50,
            dig: 10, bash: 1, stab: 2, pry: 2, chop: 2
        },
        gravel_mound: { name:'Gravel Mound', common:25, maxContent:1, health:70, value:60,
            dig: 10, bash: 2, pry: 3, chop: 3
        },
        clay_mound: { name:'Clay Mound', common:20, maxContent:1, health:100, value:70,
            dig: 10, stab: 2, pry: 3, chop: 4
        },
        wooden_crate: { name:'Wooden Crate', common:25, maxContent:3, health:60, value:80,
            bash: 2, pry: 8, saw: 10, chop: 6
        },
        metal_crate: { name:'Metal Crate', common:15, maxContent:3, health:200, value:200,
            pry: 6, chop: 2
        },
        armored_crate: { name:'Armored Crate', common:10, maxContent:3, health:450, value:450,
            pry: 2
        },
        wooden_barrel: { name:'Wooden Barrel', common:20, maxContent:2, health:80, value:100,
            bash: 2, pry: 8, saw: 5, chop: 6
        },
        steel_drum: { name:'Steel Drum', common:10, maxContent:2, health:250, value:25,
            pry: 5, chop: 2
        }
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
            var health = Math.floor(newContainer.health * 30 * (Util.randomIntRange(80,120)/100));
            newContainer.health = [health,health];
            newContainer.realHealth = health;
            newContainer.value = newContainer.value*2 / newContainer.maxContent;
            newContainer.knocked = {x:0,y:0};
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