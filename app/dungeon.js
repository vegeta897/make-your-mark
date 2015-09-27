'use strict';
Application.Services.factory('Dungeon',function(Util) {

    var allTiles = function(){
        var tiles = {};
        for(var x = 0; x < 15; x++) { for(var y = 0; y < 15; y++) { tiles[x+':'+y] = true; } }
        return tiles;
    }(); // Build on load
    
    var doors = {
        n: { dir: {x:0,y:-1}, tiles: {'6:-1':1, '7:-1':1, '8:-1':1} },
        e: { dir: {x:1,y:0}, tiles: {'15:6':1, '15:7':1, '15:8':1} },
        s: { dir: {x:0,y:1}, tiles: {'6:15':1, '7:15':1, '8:15':1} },
        w: { dir: {x:-1,y:0}, tiles: {'-1:6':1, '-1:7':1, '-1:8':1} }
    };
    
    var flipDir = function(dir) { switch(dir) {
        case 'e': return 'w'; break; case 'w': return 'e';break; 
        case 'n': return 's'; break; case 's': return 'n'; break;
    }};
    
    var buildRoom = function(ctr,coords) {
        return { doors: {}, tiles: angular.copy(allTiles) };
    };
    
    return {
        buildDungeon: function(ctr) {
            Math.seedrandom('d'+ctr.guid);
            var rooms = 0;
            var maxRooms = 10;
            var map = { rooms: {} };
            var coords = {x:0,y:0};
            var prevDir;
            console.log('building dungeon');
            while(rooms < maxRooms) {
                var newRoom = buildRoom(ctr,coords);
                var newDir = prevDir && Util.flip() ? prevDir : Util.pickInObject(doors);
                if(rooms < maxRooms-1) {
                    while(prevDir && newDir == flipDir(prevDir)) {
                        newDir = Util.pickInObject(doors);
                    }
                    newRoom.doors[newDir] = doors[newDir];
                    Util.addProps(newRoom.tiles,newRoom.doors[newDir].tiles);
                }
                if(prevDir) {
                    newRoom.doors[flipDir(prevDir)] = doors[flipDir(prevDir)];
                    Util.addProps(newRoom.tiles,newRoom.doors[flipDir(prevDir)].tiles);
                }
                map.rooms[coords.x+':'+coords.y] = newRoom;
                console.log('Building room:',coords.x,coords.y,angular.copy(newRoom));
                coords.x += doors[newDir].dir.x;
                coords.y += doors[newDir].dir.y;
                prevDir = newDir;
                rooms++;
            }
            console.log(angular.copy(map));
            return map;
        }
    }
});