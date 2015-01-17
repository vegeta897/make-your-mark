'use strict';
Application.Services.factory('Controls',function() {

    var cursor, grid = 1;
    
    return {
        attachCursor: function(c) { cursor = c; },
        onMouseMove: function() {
            
        },
        onMouseDown: function(e) {
            console.log('mouse down');
        },
        onMouseUp: function(e) {
            console.log('mouse up');
        },
        onMouseOut: function(e) {
            console.log('mouse out');
            cursor.x = cursor.y = '-';
        }
    };
});