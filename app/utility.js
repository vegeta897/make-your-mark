'use strict';

Application.Services.service('Util', function() {

    var tw = 24, th = tw/2;
    var qualityLevels = [
        {r:176, g:176, b:176, hex:'b0b0b0', name:'Poor', min:0},
        {r:220, g:220, b:220, hex:'fbfbfb', name:'Average', min:400},
        {r:88, g:193, b:111, hex:'58c16f', name:'Uncommon', min:860},
        {r:59, g:126, b:249, hex:'3b7ef9', name:'Rare', min:910},
        {r:193, g:75, b:243, hex:'c14bf3', name:'Unique', min:950},
        {r:255, g:65, b:168, hex:'ff41a8', name:'Perfect', min:980},
        {r:255, g:251, b:0, hex:'fffb00', name:'Legendary', min:993},
        {r:255, g:215, b:54, hex:'ffd736', name:'Mythical', min:998}];
    
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
        return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
    };
    
    return {
        randomIntRange: function(min,max) { return Math.floor(Math.random() * (+max - +min + 1)) + +min ; },
        randomSlide: function(input,min,max) { // Randomly pick between upper/lower values based on the input value
            if(input >= max || input <= min) return input;
            return Math.random() * (max-min) + +min > input ? +min : +max;
        },
        pickInArray: pickInArray,
        hsvToHex: hsvToHex, hexToRGB: hexToRGB,
        rgbToHSV: function(r, g, b) {
            r = r/255; g = g/255; b = b/255;
            var max = Math.max(r, g, b), min = Math.min(r, g, b);
            var h, s, v = max, d = max - min;
            s = max == 0 ? 0 : d / max;
            if(max == min){  h = 0; } else { // achromatic
                switch(max){
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            return {h:h,s:s,v:v};
        },
        hsvToRGB: function(h, s, v) {
            var r, g, b, i = Math.floor(h * 6);
            var f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
            switch (i % 6) {
                case 0: r = v; g = t; b = p; break; case 1: r = q; g = v; b = p; break;
                case 2: r = p; g = v; b = t; break; case 3: r = p; g = q; b = v; break;
                case 4: r = t; g = p; b = v; break; case 5: r = v; g = p; b = q; break;
            }
            return {r:Math.round(r*255),g:Math.round(g*255),b:Math.round(b*255)};
        },
        capitalize: function(s) { return s[0].toUpperCase()+s.substring(1); },
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
        isInt: function(input) { return Math.floor(input) === input; },
        restrictNumber: function(input,min,max) {
            input = input.replace(/[^\d.-]/g, '').replace('..','.').replace('..','.').replace('-','');
            return input > max ? max : input < min ? min : input;
        },
        positionSeed: function(sx,sy,x,y) {
            return ("0000" + (+sx+5000)).slice(-4)+("0000" + (+sy+5000)).slice(-4) +
                ("00" + (+x)).slice(-2)+("00" + (+y)).slice(-2);
        },
        positionFromSeed: function(seed) {
            seed = seed[1] == 'c' ? seed.substr(2,12) : seed.substr(1,12);
            return { sx: +seed.substr(0,4)-5000, sy: +seed.substr(4,4)-5000,
                x: +seed.substr(8,2), y: +seed.substr(10,2) };
        },
        isInArea: function(x1,y1,x2,y2,w,h,center) { // Is XY1 within a rectangular area WxH at XY2
            return center ? Math.abs(+x1 - +x2) <= w/2 && Math.abs(+y1 - +y2) <= h/2
                : +x1 >= +x2 && +x1 < +x2 + +w && +y1 >= +y2 && +y1 < +y2 + +h ;
        },
        getXYdiff: function(x1,y1,x2,y2) { return { x: +x2 - +x1, y: +y2 - +y1 }; }, // XY diff between 2 points
        getDistance: function(x1,y1,x2,y2) { // Get distance between 2 points
            return Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2));
        },
        getFastDistance: function(x1,y1,x2,y2) { // Get distance squared between 2 points
            return Math.pow(x2-x1,2) + Math.pow(y2-y1,2);
        },
        objectInArray: function(object,array) { // Return object position in array based on GUID
            if(!object || !array) return -1;
            for(var i = 0; i < array.length; i++) { if(array[i].guid == object.guid) return i; }
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
        },
        objectQuality: function(object) {
            if(!object) return false;
            if(object.health) { // If container
                return { name:'', r:240, g:240, b:240, hex:'f0f0f0' };
            } else { // If thing
                for(var q = qualityLevels.length-1; q >= 0; q--) {
                    if(object.quality >= qualityLevels[q].min) return qualityLevels[q];
                }
            }
        },
        xyInBounds: function(x,y,bx,by,w,h) { return x >= bx && x < bx+w && y >= by && y < by+h; },
        // Convert isometric grid to screen space
        isoToScreen: function(x,y) { return { x: (+x + +y) * tw + 2, y: (+y - x) * th + 188 }; },
        // Convert screen space to isometric grid
        screenToIso: function(x,y) { 
            return { x: ((x-2) / tw - (y-188) / th)/2, y: ((y-188) / th + (x-2) / tw)/2 }; },  
        // Convert isometric grid to relative screen space
        isoToScreenRel: function(x,y) { return { x: (+x + +y) * tw, y: (+y - x) * th }; },
        // Convert relative screen space to isometric grid
        screenToIsoRel: function(x,y) {
            return { x: (x / tw - (y) / th)/2, y: ((y) / th + x / tw)/2 }; },
        validOffSectorTiles: { '0:6':1,'0:7':1,'0:8':1,'14:6':1,'14:7':1,'14:8':1,
            '6:0':1,'7:0':1,'8:0':1,'6:14':1,'7:14':1,'8:14':1,
            '15:6':1,'15:7':1,'15:8':1,'-1:6':1,'-1:7':1,'-1:8':1,
            '6:15':1,'7:15':1,'8:15':1,'6:-1':1,'7:-1':1,'8:-1':1 },
        qualityLevels: qualityLevels
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
    })
    .filter('properVowelConsonant', function() {
        return function(input) { if(!input) { return ''; }
            return jQuery.inArray(input[0],['a','e','i','o','u']) >= 0 ? 'an' : 'a';
        }
    }).filter('reverse', function() {
        return function(items) {
            return items.slice().reverse();
        };
    });


/*

EASING FUNCTIONS

 linear: function(t) {
 return t
 },
 inQuad: function(t) {
 return t * t
 },
 outQuad: function(t) {
 return t * (2 - t)
 },
 inOutQuad: function(t) {
 return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
 },
 inCubic: function(t) {
 return t * t * t
 },
 outCubic: function(t) {
 return (--t) * t * t + 1
 },
 inOutCubic: function(t) {
 return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
 },
 inQuart: function(t) {
 return t * t * t * t
 },
 outQuart: function(t) {
 return 1 - (--t) * t * t * t
 },
 inOutQuart: function(t) {
 return t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t
 },
 inQuint: function(t) {
 return t * t * t * t * t
 },
 outQuint: function(t) {
 return 1 + (--t) * t * t * t * t
 },
 inOutQuint: function(t) {
 return t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t
 },
 inSine: function(t) {
 return -1 * Math.cos(t / 1 * (Math.PI * 0.5)) + 1;
 },
 outSine: function(t) {
 return Math.sin(t / 1 * (Math.PI * 0.5));
 },
 inOutSine: function(t) {
 return -1 / 2 * (Math.cos(Math.PI * t) - 1);
 },
 inExpo: function(t) {
 return (t == 0) ? 0 : Math.pow(2, 10 * (t - 1));
 },
 outExpo: function(t) {
 return (t == 1) ? 1 : (-Math.pow(2, -10 * t) + 1);
 },
 inOutExpo: function(t) {
 if (t == 0) return 0;
 if (t == 1) return 1;
 if ((t /= 1 / 2) < 1) return 1 / 2 * Math.pow(2, 10 * (t - 1));
 return 1 / 2 * (-Math.pow(2, -10 * --t) + 2);
 },
 inCirc: function(t) {
 return -1 * (Math.sqrt(1 - t * t) - 1);
 },
 outCirc: function(t) {
 return Math.sqrt(1 - (t = t - 1) * t);
 },
 inOutCirc: function(t) {
 if ((t /= 1 / 2) < 1) return -1 / 2 * (Math.sqrt(1 - t * t) - 1);
 return 1 / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1);
 },
 inElastic: function(t) {
 var s = 1.70158;
 var p = 0;
 var a = 1;
 if (t == 0) return 0;
 if (t == 1) return 1;
 if (!p) p = 0.3;
 if (a < 1) {
 a = 1;
 var s = p / 4;
 } else var s = p / (2 * Math.PI) * Math.asin(1 / a);
 return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p));
 },
 outElastic: function(t) {
 var s = 1.70158;
 var p = 0;
 var a = 1;
 if (t == 0) return 0;
 if (t == 1) return 1;
 if (!p) p = 0.3;
 if (a < 1) {
 a = 1;
 var s = p / 4;
 } else var s = p / (2 * Math.PI) * Math.asin(1 / a);
 return a * Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
 },
 inOutElastic: function(t) {
 var s = 1.70158;
 var p = 0;
 var a = 1;
 if (t == 0) return 0;
 if ((t /= 1 / 2) == 2) return 1;
 if (!p) p = (0.3 * 1.5);
 if (a < 1) {
 a = 1;
 var s = p / 4;
 } else var s = p / (2 * Math.PI) * Math.asin(1 / a);
 if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p));
 return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p) * 0.5 + 1;
 },
 inBounce: function(t) {
 return 1 - this.outBounce(1 - t);
 },
 outBounce: function(t) {
 if ((t /= 1) < (1 / 2.75)) {
 return (7.5625 * t * t);
 } else if (t < (2 / 2.75)) {
 return (7.5625 * (t -= (1.5 / 2.75)) * t + .75);
 } else if (t < (2.5 / 2.75)) {
 return (7.5625 * (t -= (2.25 / 2.75)) * t + .9375);
 } else {
 return (7.5625 * (t -= (2.625 / 2.75)) * t + .984375);
 }
 },
 inOutBounce: function(t) {
 if (t < 1 / 2) return this.inBounce(t * 2) * 0.5;
 return this.outBounce(t * 2 - 1) * 0.5 + 0.5;
 }

 */