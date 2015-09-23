'use strict';
Application.Services.factory('Pathfinder',function() {
    
    var calcH = function(a,b) { 
        // return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y))*10*1.006; // Manhattan method, not good enough!
        var x = Math.abs(a.x - b.x), y = Math.abs(a.y - b.y);
        if(x > y) return 8*y+5*x; else return 8*x+5*y;
    };
    
    var getBest = function(list) {
        var best;
        for(var key in list) { if(!list.hasOwnProperty(key)) continue;
            if(!best || best.f > list[key].f) best = list[key];
        }
        return best;
    };
    
    var constructPath = function(start,current,closed) {
        var path = []; var cur = current;
        while(true) {
            if(cur.x == start.x && cur.y == start.y) break;
            path.push({x:cur.x,y:cur.y});
            cur = closed[cur.parent];
        }
        return path.reverse();
    };
    
    return {
        pathfind: function(map,start,end) {
            if(!map) return [start];
            var startH = calcH(end,start);
            var current = {x:start.x,y:start.y,g:0,h:startH,f:startH};
            var openCount = 0, open = {}, closed = {};
            // Add starting square to open list
            open[current.x+':'+current.y] = current; openCount++;
            while(openCount > 0) {
                closed[current.x+':'+current.y] = current;
                delete open[current.x+':'+current.y]; openCount--;
                // Check if ending reached
                if(current.x == end.x && current.y == end.y) { return constructPath(start,current,closed); }
                // Add neighbors
                for(var nx = -1; nx < 2; nx++) { for(var ny = -1; ny < 2; ny++) {
                    if(nx == 0 && ny == 0) continue; // Don't check current
                    var neighbor = {parent: current.x+':'+current.y, 
                        key:(+current.x+nx) +':'+ (+current.y+ny), x:+current.x+nx, y:+current.y+ny};
                    if(map[neighbor.key] && !closed[neighbor.key]) { // If square empty and not closed
                        neighbor.g = current.g + (Math.abs(nx) + Math.abs(ny) > 1 ? 14 : 10);
                        neighbor.h = calcH(end,neighbor); neighbor.f = neighbor.g + neighbor.h;
                        var existing = open[neighbor.key];
                        if(existing) { // If neighbor was already checked
                            if(existing.g > neighbor.g) { // If this G is better
                                existing.g = neighbor.g; existing.f = existing.g + existing.h;
                                existing.parent = current.x+':'+current.y;
                            }
                        } else { // Neighbor is a new square
                            open[neighbor.key] = neighbor; openCount++;
                        }
                    }
                }}
                current = getBest(open);
            }
            return [start];
        }
    }
});