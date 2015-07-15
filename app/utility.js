'use strict';

Application.Services.service('Util', function() {
    
    var pickInArray = function(array) { return array[Math.floor(Math.random()*array.length)]; };
    var hsvToHex = function(hsv) {
        var h = hsv.hue, s = hsv.sat, v = hsv.val, rgb, i, data = [];
        if (s === 0) { rgb = [v,v,v]; }
        else {
            h = h / 60; i = Math.floor(h);
            data = [v*(1-s), v*(1-s*(h-i)), v*(1-s*(1-(h-i)))];
            switch(i) {
                case 0: rgb = [v, data[2], data[0]]; break;
                case 1: rgb = [data[1], v, data[0]]; break;
                case 2: rgb = [data[0], v, data[2]]; break;
                case 3: rgb = [data[0], data[1], v]; break;
                case 4: rgb = [data[2], data[0], v]; break;
                default: rgb = [v, data[0], data[1]]; break;
            }
        }
        return rgb.map(function(x){ return ("0" + Math.round(x*255).toString(16)).slice(-2); }).join('');
    };
    var hexToRGB = function(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };
    
    return {
        randomIntRange: function(min,max) { return Math.floor(Math.random() * (+max - +min + 1)) + +min ; },
        pickInArray: pickInArray,
        hsvToHex: hsvToHex, hexToRGB: hexToRGB,
        capitalize: function(s) { return s.substring(0,1).toUpperCase()+s.substring(1); },
        randomColor: function(/* maxMins (object has 'maxSat') OR object type (string) */) {
            //    var palette = jQuery.isArray(arguments[0]) ? arguments[0] : undefined;
            if (arguments[0]) {
                var maxMins = arguments[0].hasOwnProperty('maxSat') ? arguments[0] : undefined;
                var objectType = typeof arguments[0] == 'string' ? arguments[0] : undefined;
            }
            //    var averages = getAverages(palette);
            var hsv = {};
            if (maxMins) {
                var hueRange = maxMins.maxHue - maxMins.minHue;
                var satRange = maxMins.maxSat - maxMins.minSat;
                var valRange = maxMins.maxVal - maxMins.minVal;
                hsv = {
                    hue: Math.floor(Math.random() * hueRange + maxMins.minHue),
                    sat: Math.round(Math.random() * satRange + maxMins.minSat) / 100,
                    val: Math.round(Math.random() * valRange + maxMins.minVal) / 100
                };
            } else if (objectType) {
                switch (objectType) {
                    case 'vibrant':
                        hsv = {
                            hue: Math.floor(Math.random() * 360),
                            sat: Math.round(Math.random() * 30 + 70) / 100,
                            val: Math.round(Math.random() * 40 + 60) / 100
                        };
                        break;
                }
            } else {
                hsv = {
                    hue: Math.floor(Math.random() * 360),
                    sat: Math.round(Math.random() * 100) / 100,
                    val: Math.round(Math.random() * 100) / 100
                };
            }
            if (hsv.hue >= 360) { // Fix hue wraparound
                hsv.hue = hsv.hue % 360;
            } else if (hsv.hue < 0) {
                hsv.hue = 360 + (hsv.hue % 360);
            }
            return {hex: hsvToHex(hsv), hsv: hsv, rgb: hexToRGB(hsvToHex(hsv))};
        },
        countProperties: function(obj,exception) { // Return number of properties an object has
            if(!obj) { return 0; } var count = 0; 
            for(var key in obj) { if(!obj.hasOwnProperty(key) || key == exception) { continue; } count++; } 
            return count;
        },
        getSortedKeys: function(obj,descending) { // Return array of sorted keys from an object
            var keys = [];
            for(var key in obj) { if(!obj.hasOwnProperty(key)) continue;
                keys.push(key);                
            }
            return descending ? keys.sort().reverse() : keys.sort();
        },
        pickInObject: function(object) { // Return a random property name from input object
            var array = [];
            for(var key in object) { if(object.hasOwnProperty(key)) array.push(key); }
            return pickInArray(array);
        },
        flip: function() { return Math.random() > 0.5; }, // Flip a coin
        isInt: function(input) { return parseInt(input) === input; },
        restrictNumber: function(input,min,max) {
            input = input.replace(/[^\d.-]/g, '').replace('..','.').replace('..','.').replace('-','');
            return input > max ? max : input < min ? min : input;
        },
        positionSeed: function(sx,sy,x,y) {
            return ("0000" + (+sx+5000)).slice(-4)+("0000" + (+sy+5000)).slice(-4) +
                ("00" + (+x)).slice(-2)+("00" + (+y)).slice(-2);
        },
        positionFromSeed: function(seed) {
            return { sx: +seed.substr(0,4)-5000, sy: +seed.substr(4,4)-5000,
                x: +seed.substr(8,2), y: +seed.substr(10,2) };
        },
        isInArea: function(x1,y1,x2,y2,w,h) { // Is XY1 within a rectangular area WxH centered on XY2
            return Math.abs(+x1 - +x2) <= w/2 && Math.abs(+y1 - +y2) <= h/2;
        },
        getXYdiff: function(x1,y1,x2,y2) { return { x: +x2 - +x1, y: +y2 - +y1 }; }, // XY diff between 2 points
        getDistance: function(x1,y1,x2,y2) { // Get distance between 2 points
            return Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2));
        },
        getFastDistance: function(x1,y1,x2,y2) { // Get distance squared between 2 points
            return Math.pow(x2-x1,2) + Math.pow(y2-y1,2);
        },
        thingInArray: function(thing,array) {
            if(!thing || !array) return -1;
            for(var i = 0; i < array.length; i++) { if(array[i].guid == thing.guid) return i; }
            return -1;
        },
        subtractArrays: function(source,subtractor) { // Subtract members of first array from subtractor array
            if(!source || !subtractor || source.length == 0 || subtractor.length == 0) return source;
            var result = angular.copy(source);
            for(var i = result.length-1; i >= 0; i--) {
                if(jQuery.inArray(result[i],subtractor) >= 0) result.splice(i,1);
            }
            return result;
        },
        propertyNamesToArray: function(object) { // Return an array containing all property names
            var array = [];
            for(var key in object) { if(object.hasOwnProperty(key)) array.push(key); }
            return array;
        }
    }
});

Application.Filters
    .filter('capitalize', function() {
        return function(input) { if(!input) { return ''; }
            var words = input.split(' '), result = '';
            for(var i = 0; i < words.length; i++) {
                result += words[i].substring(0,1).toUpperCase()+words[i].substring(1);
                result += i == words.length - 1 ? '' : ' ';
            }
            return result;
        }
    }).filter('timeUnits', function() {
        return function(input,exact) { if(!input) { return 0; }
            var now = new Date().getTime();
            var seconds = Math.floor((now-input)/1000);
            if(seconds < 60 && exact) { return seconds; } // seconds
            if(seconds < 60) { return 0; } // less than a min
            if(seconds < 3600) { return Math.floor(seconds/60); } // minutes
            if(seconds < 86400) { return Math.floor(seconds/3600); } // hours
            else { return Math.floor(seconds/86400); } // days
        }
    })
    .filter('timeUnitsLabel', function() {
        return function(input,exact) { if(!input) { return ''; }
            var now = new Date().getTime();
            var seconds = Math.floor((now-input)/1000);
            if(seconds < 60 && exact) { return seconds > 1 ? 'seconds' : 'second'; } // seconds
            if(seconds < 60) { return 'minutes'; } // less than a min
            if(seconds < 3600) { return seconds > 119 ? 'minutes' : 'minute'; } // minutes
            if(seconds < 86400) { return seconds > 7199 ? 'hours' : 'hour'; } // hours
            else { return seconds > 172799 ? 'days' : 'day'; } // days
        }
    }).filter('reverse', function() {
        return function(items) { if(!items) return items;
            return items.slice().reverse();
        }
    }).filter('thingActions', function(Util) {
        return function(thing) { if(!thing) return thing;
            var actions = (angular.copy(thing.actions) || []).concat(thing.actionsExtra || []);
            actions = Util.subtractArrays(actions,thing.actionsLost || []);
            return actions.sort();
        }
    })
    .filter('properVowelConsonant', function() {
        return function(input) { if(!input) { return ''; }
            return jQuery.inArray(input[0],['a','e','i','o','u']) >= 0 ? 'an' : 'a';
        }
    });