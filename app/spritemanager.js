'use strict';
Application.Services.factory('SpriteMan',function(Util,TextDraw) {
    
    var thingSpriteImg, thingColorImg, thingSpriteLib, containerSpriteImg, containerSpriteLib,
        dmgNumbersImg, bgTileImg, pathTileImg, pathTileLib, genericSprite, inventorySpriteImg,
        abiSpriteLib, sectorSpriteImg, attacksImg = {},
        imagesLoaded = 0, totalImages = 0, 
        graphicsRevision = 33;
    var pix = 24;
    
    // TODO: Create a saturation filter for lower quality items, and other effects for higher quality items
    thingSpriteLib = {
        indexes: {}, names: [
            ['pencil','chewed|scratched','broken|cut','broken|cut+chewed|scratched'],
            ['pen','scratched'],
            ['paper','folded','cut','torn','written-on','folded+written-on','cut+written-on','torn+written-on'],
            ['rock','scratched'],
            ['stone','scratched'],
            ['shovel','scratched','cut','cut+scratched'],
            ['hammer','scratched','cut','cut+scratched'],
            ['scissors','scratched','broken','broken+scratched'],
            ['paperSnowflake','cut','torn'],
            ['banana','cut','smashed','peeled','cut+peeled','peeled+smashed'],
            ['bananaPeel','cut','smashed'],
            ['guitar','scratched','broken','broken+scratched','cut','cut+scratched','written-on','scratched+written-on','broken+written-on','broken+scratched+written-on','cut+written-on','cut+scratched+written-on'],
            ['stick','cut|broken'],
            ['television','scratched','broken','broken+scratched'],
            ['cellphone','scratched','broken','broken+scratched'],
            ['chewingGum','cut','chewed','chewed+cut'],
            ['eraser','cut','written-on','cut+written-on'],
            ['coin','scratched'],
            ['cookie','broken'],
            ['bubbleWrap','cut','folded','popped','cut+popped','folded+popped'],
            ['mirror','scratched','broken','broken+scratched'],
            ['saw','scratched'],
            ['axe','scratched']
        ],
        colors: { // Green           Blue    Purple            Pink              Red          Orange  Black
            pencil: [{h:44,s:6,v:-9},{h:145},{h:215,s:-13,v:5},{h:263,s:-30,v:6},{h:311,s:-5},{h:330},{s:-100,v:-60}],
            //    Purple Pink         Red     Gold              Green              Black
            pen: [{h:38},{h:80,s:-17},{h:127},{h:175,s:-10,v:1},{h:251,s:-8,v:-17},{s:-100,v:-66}],
            //         Purple Pink         Red     Orange  Gold              Green              Black          White
            scissors: [{h:38},{h:80,s:-17},{h:127},{h:258},{h:175,s:-10,v:1},{h:251,s:-8,v:-17},{s:-100,v:-66},{s:-100}],
            //          White         Grey          Purple Pink             Red              Green
            cellphone: [{s:-100,v:12},{s:-100,v:12},{h:43},{h:78,s:-20,v:6},{h:130,s:4,v:-3},{h:257,s:-23,v:-22}],
            //       Green   Blue    Purple        Pink               White
            mirror: [{h:131},{h:228},{h:290,s:-14},{h:327,s:-31,v:20},{s:-100,v:19}]
        }
    };
    // Load thing sprite sheet
    thingSpriteImg = new Image();
    thingSpriteImg.src = 'img/thing-sprites.png?'+graphicsRevision;
    totalImages++;
    thingColorImg = new Image();
    totalImages++;
    thingColorImg.src = 'img/thing-color-zones.png?'+graphicsRevision;
    var thingImgsLoaded = 0;
    var thingImgLoaded = function(){
        thingImgsLoaded++; imagesLoaded++;
        if(thingImgsLoaded < 2) return;
        var position = 0; // Build thing sprite name and position index list
        for(var n = 0; n < thingSpriteLib.names.length; n++) {
            var spriteCanvases = [], colorCanvases = [];
            for(var m = 0; m < thingSpriteLib.names[n].length; m++) {
                var spriteCanvas = document.createElement('canvas');
                spriteCanvas.width = 24; spriteCanvas.height = 24;
                var ctx = spriteCanvas.getContext('2d');
                var spriteX = 24 * ((position+m) % 16),
                    spriteY = 24 * Math.floor((position+m) / 16);
                ctx.drawImage(thingSpriteImg, spriteX, spriteY, pix, pix, 0, 0, pix, pix);
                spriteCanvases.push(spriteCanvas);
                if(thingSpriteLib.colors[thingSpriteLib.names[n][0]]) {
                    var colorVariations = thingSpriteLib.colors[thingSpriteLib.names[n][0]];
                    var colorCanvas = document.createElement('canvas');
                    colorCanvas.width = 24; colorCanvas.height = 24;
                    var colorCtx = colorCanvas.getContext('2d');
                    colorCtx.drawImage(thingColorImg, spriteX, spriteY, pix, pix, 0, 0, pix, pix);
                    var colorData = colorCtx.getImageData(0,0,pix,pix);
                    var spriteData = ctx.getImageData(0,0,pix,pix);
                    var colorVariationCanvases = [];
                    var colorVariationContexts = [];
                    var colorVariationImageDatas = [];
                    for(var cvc = 0; cvc < colorVariations.length; cvc++) {
                        var colorVarCanvas = document.createElement('canvas');
                        colorVarCanvas.width = 24; colorVarCanvas.height = 24;
                        var colorVarCtx = colorVarCanvas.getContext('2d');
                        colorVariationCanvases.push(colorVarCanvas);
                        colorVariationContexts.push(colorVarCtx);
                    }
                    for(var cp = 0; cp < colorData.data.length; cp += 4) {
                        if(colorData.data[cp+3]) {
                            var pixelRGB = {r:spriteData.data[cp],g:spriteData.data[cp+1],b:spriteData.data[cp+2]};
                            var pixelHSV = Util.rgbToHSV(pixelRGB.r,pixelRGB.g,pixelRGB.b);
                            for(var cv = 0; cv < colorVariations.length; cv++) {
                                var newHSV = {h:pixelHSV.h,s:pixelHSV.s,v:pixelHSV.v};
                                if(colorVariations[cv].h) {
                                    newHSV.h += colorVariations[cv].h/360;
                                    newHSV.h = newHSV.h < 0 ? 1 + (newHSV.h % 1) : newHSV.h % 1;
                                }
                                newHSV.s = Math.min(1,Math.max(0,newHSV.s + (colorVariations[cv].s/100 || 0)));
                                newHSV.v = Math.min(1,Math.max(0,newHSV.v + (colorVariations[cv].v/100 || 0)));
                                var newRGB = Util.hsvToRGB(newHSV.h,newHSV.s,newHSV.v);
                                var newSpriteData = colorVariationImageDatas.length > cv ?
                                    colorVariationImageDatas[cv] : ctx.getImageData(0,0,pix,pix);
                                newSpriteData.data[cp] = newRGB.r;
                                newSpriteData.data[cp+1] = newRGB.g;
                                newSpriteData.data[cp+2] = newRGB.b;
                                if(colorVariationImageDatas.length <= cv) colorVariationImageDatas.push(newSpriteData);
                            }
                        }
                    }
                    for(var cvd = 0; cvd < colorVariations.length; cvd++) {
                        colorVariationContexts[cvd].putImageData(colorVariationImageDatas[cvd],0,0);
                    }
                    colorCanvases.push(colorVariationCanvases);
                }
            }
            thingSpriteLib.indexes[thingSpriteLib.names[n][0]] = [n,spriteCanvases,colorCanvases];
            position += thingSpriteLib.names[n].length
        }
    };
    thingSpriteImg.onload = thingImgLoaded;
    thingColorImg.onload =  thingImgLoaded;
    // Load container sprite sheet
    containerSpriteImg = new Image();
    containerSpriteImg.src = 'img/container-sprites.png?'+graphicsRevision;
    totalImages++;
    containerSpriteLib = { indexes: {}, names: [
        'paper_bag', 'plastic_bag', 'cloth_sack', 'velvet_pouch',
        'plain_present', 'cute_present', 'pretty_present', 'elegant_present',
        'dirt_mound', 'gravel_mound', 'clay_mound', 'plastic_chest', 'ceramic_chest', 'wooden_chest'
    ]};
    containerSpriteImg.onload = function(){
        imagesLoaded++;
        for(var cs = 0; cs < containerSpriteLib.names.length; cs++) {
            var spriteCanvas = document.createElement('canvas');
            spriteCanvas.width = 36; spriteCanvas.height = 36;
            var spriteCtx = spriteCanvas.getContext('2d');
            spriteCtx.drawImage(containerSpriteImg,0,cs*36,36,36,0,0,36,36);
            var spriteData = spriteCtx.getImageData(1,1,34,34);
            var colors = []; // Get list of all non-black colors
            for(var cp = 0; cp < spriteData.data.length; cp += 8) { // Every other pixel
                if(spriteData.data[cp+3] > 0 &&
                    (spriteData.data[cp] + spriteData.data[cp+1] + spriteData.data[cp+2] > 0)) {
                    colors.push([spriteData.data[cp],spriteData.data[cp+1],spriteData.data[cp+2]])
                }
            }
            var spriteOpenCanvas = document.createElement('canvas');
            spriteOpenCanvas.width = 36; spriteOpenCanvas.height = 36;
            var spriteOpenCtx = spriteOpenCanvas.getContext('2d');
            spriteOpenCtx.drawImage(containerSpriteImg,36,cs*36,36,36,0,0,36,36);
            var spriteBrokenCanvas = document.createElement('canvas');
            spriteBrokenCanvas.width = 36; spriteBrokenCanvas.height = 36;
            var spriteBrokenCtx = spriteBrokenCanvas.getContext('2d');
            spriteBrokenCtx.drawImage(containerSpriteImg,72,cs*36,36,36,0,0,36,36);
            containerSpriteLib.indexes[containerSpriteLib.names[cs]] = {
                sprite:spriteCanvas, spriteOpen:spriteOpenCanvas, spriteBroken:spriteBrokenCanvas, colors:colors
            };
        }
    };
    // Load sector sprite sheet
    sectorSpriteImg = new Image();
    sectorSpriteImg.src = 'img/sector-sprites.png?'+graphicsRevision;
    totalImages++;
    sectorSpriteImg.onload = function(){imagesLoaded++;};
    // Load BG tiles
    bgTileImg = new Image();
    bgTileImg.src = 'img/bg-tiles.png?'+graphicsRevision;
    totalImages++;
    bgTileImg.onload = function(){imagesLoaded++;};
    // Load path tiles
    pathTileImg = new Image();
    pathTileImg.src = 'img/path-tiles.png?'+graphicsRevision;
    totalImages++;
    pathTileImg.onload = function(){imagesLoaded++;};
    pathTileLib = [
        '0:0|1:0', '0:0|1:1', '0:0|0:1', '0:0|-1:1', '0:0|-1:0', '0:0|-1:-1', '0:0|0:-1', '0:0|1:-1',
        '1:0|0:1', '1:1|-1:1', '0:1|-1:0', '-1:1|-1:-1', '-1:0|0:-1', '-1:-1|1:-1', '0:-1|1:0', '1:-1|1:1',
        '1:0|-1:1', '1:1|-1:0', '0:1|-1:-1', '-1:1|0:-1', '-1:0|1:-1', '-1:-1|1:0', '0:-1|1:1', '1:-1|0:1',
        '1:0|-1:0', '1:1|-1:-1', '0:1|0:-1', '-1:1|1:-1'
    ];
    // Load inventory sprite sheet
    inventorySpriteImg = new Image();
    inventorySpriteImg.src = 'img/inventory-sprites.png?'+graphicsRevision;
    totalImages++;
    abiSpriteLib = {
        indexes: {}, names: [
            'punch', 'bash', 'snip', 'stab', 'pry', 'slice', 'saw', 'chop', 'dig', 'swat', 'wipe', 'vibrate', 'poke',
            'bonk', 'reflect', 'stick', 'erase', 'write', 'pay', 'charm'
        ]
    };
    for(var a = 0; a < abiSpriteLib.names.length; a++) {
        abiSpriteLib.indexes[abiSpriteLib.names[a]] = a;
    }
    // FX: paraOff, latOff, vertOff, paraMag, latMag, vertMag
    // Knock: paraMag, latMag, vertMag
    abiSpriteLib.indexes['punch'] = { delay: 14, 
        fx: [{ frame: 0, count: 3, paraOff: -0.01, vertOff: -0.07, paraMag: -1 }],
        knock: [{ frame: 0, paraMag: 0.1 }] 
    };
    abiSpriteLib.indexes['bash'] = { delay: 25,
        fx: [{ frame: 0, count: 5, paraOff: -0.02, vertOff: -0.05, paraMag: -1 }],
        knock: [{ frame: 0, paraMag: 0.2, vertMag: -0.1 }]
    };
    abiSpriteLib.indexes['snip'] = { delay: 24,
        fx: [{ frame: 0, count: 2, paraOff: 0.1, vertOff: -0.02, paraMag: -0.2, vertMag: 0.2 },
            { frame: 1, count: 2, paraOff: 0.16, vertOff: 0.02, paraMag: -0.2, vertMag: 0.3 },
            { frame: 2, count: 2, paraOff: 0.22, vertOff: 0.04, paraMag: -0.2, vertMag: 0.5 },
            { frame: 3, count: 2, paraOff: 0.28, vertOff: 0.06, paraMag: -0.2, vertMag: 0.6 },
            { frame: 19, count: 2, paraOff: 0.12, vertOff: 0.04, paraMag: 0.2, vertMag: 0.2 },
            { frame: 20, count: 2, paraOff: 0.20, vertOff: 0.02, paraMag: 0.2, vertMag: 0.3 },
            { frame: 21, count: 2, paraOff: 0.26, vertOff: 0, paraMag: 0.2, vertMag: 0.5 },
            { frame: 22, count: 2, paraOff: 0.32, vertOff: -0.02, paraMag: 0.2, vertMag: 0.6 }],
        fxDown: [{ frame: 0, count: 2, paraOff: -0.06, vertOff: -0.1, paraMag: -0.2, vertMag: 0.2 },
            { frame: 1, count: 2, paraOff: 0.00, vertOff: -0.1, paraMag: -0.2, vertMag: 0.3 },
            { frame: 2, count: 2, paraOff: 0.02, vertOff: -0.1, paraMag: -0.2, vertMag: 0.5 },
            { frame: 3, count: 2, paraOff: 0.06, vertOff: -0.1, paraMag: -0.2, vertMag: 0.6 },
            { frame: 19, count: 2, paraOff: 0.0, vertOff: 0.02, paraMag: 0.2, vertMag: 0.2 },
            { frame: 20, count: 2, paraOff: 0.03, vertOff: -0.06, paraMag: 0.2, vertMag: 0.3 },
            { frame: 21, count: 2, paraOff: 0.06, vertOff: -0.14, paraMag: 0.2, vertMag: 0.5 },
            { frame: 22, count: 2, paraOff: 0.09, vertOff: -0.22, paraMag: 0.2, vertMag: 0.6 }],
        knock: [{ frame: 2, paraMag: 0.1 },{ frame: 21, paraMag: 0.1 }]
    };
    abiSpriteLib.indexes['stab'] = { delay: 24,
        fx: [{ frame: 23, count: 1, paraOff: 0.12, vertOff: -0.05, paraMag: -0.1, vertMag: 0.5 },
            { frame: 24, count: 3, paraOff: 0.12, vertOff: -0.05, paraMag: -0.2, vertMag: 0.8 },
            { frame: 25, count: 3, paraOff: 0.12, vertOff: -0.05, paraMag: -0.1, vertMag: 0.6 },
            { frame: 26, count: 2, paraOff: 0.12, vertOff: -0.05, paraMag: -0.1, vertMag: 0.5 },
            { frame: 27, count: 2, paraOff: 0.12, vertOff: -0.05, paraMag: -0.1, vertMag: 0.2 },
            { frame: 29, count: 1, paraOff: 0.12, vertOff: -0.05, paraMag: -0.1, vertMag: 0.1 }],
        fxDown: [{ frame: 21, count: 1, paraOff: 0.02, vertOff: 0.15, paraMag: -0.1, vertMag: 0.5 },
            { frame: 22, count: 3, paraOff: 0.02, vertOff: 0.15, paraMag: -0.2, vertMag: 0.8 },
            { frame: 23, count: 3, paraOff: 0.02, vertOff: 0.15, paraMag: -0.1, vertMag: 0.6 },
            { frame: 24, count: 2, paraOff: 0.02, vertOff: 0.15, paraMag: -0.1, vertMag: 0.5 },
            { frame: 25, count: 2, paraOff: 0.02, vertOff: 0.15, paraMag: -0.1, vertMag: 0.2 },
            { frame: 27, count: 1, paraOff: 0.02, vertOff: 0.15, paraMag: -0.1, vertMag: 0.1 }],
        knock: [{ frame: 0, paraMag: 0.1, vertMag: -0.3 },
            { frame: 10, paraMag: -0.1 },
            { frame: 11, paraMag: -0.1 },
            { frame: 12, paraMag: -0.1 },
            { frame: 17, paraMag: 0.1 },
            { frame: 18, paraMag: 0.1 }],
        knockDown: [{ frame: 0, paraMag: 0.1, vertMag: -0.3 },
            { frame: 10, paraMag: 0.1 },
            { frame: 11, paraMag: 0.1 },
            { frame: 12, paraMag: 0.1 },
            { frame: 13, paraMag: 0.1 },
            { frame: 18, paraMag: -0.1 },
            { frame: 19, paraMag: -0.1 }]
    };
    abiSpriteLib.indexes['pry'] = { delay: 29,
        fx: [{ frame: 0, count: 3, paraOff: -0.01, latOff: 0.2, vertOff: -0.07, paraMag: -1 },
            { frame: 17, count: 3, paraOff: -0.01, latOff: 0.2, vertOff: -0.07, paraMag: -1 }],
        fxDown: [{ frame: 0, count: 3, paraOff: 0, latOff: 0.1, vertOff: -0.07, paraMag: -1 },
            { frame: 17, count: 3, paraOff: 0, latOff: 0.1, vertOff: -0.07, paraMag: -1 }],
        knock: [{ frame: 0, paraMag: 0.1 },{ frame: 18, paraMag: 0.15 }]
    };
    abiSpriteLib.indexes['slice'] = { delay: 18,
        fx: [{ frame: 0, count: 1, paraOff: -0.03, vertOff: 0.2, paraMag: -0.2, latMag: 1 },
            { frame: 1, count: 2, paraOff: -0.03, latOff: 0.1, vertOff: 0.2, paraMag: -0.2, latMag: 1 },
            { frame: 2, count: 2, paraOff: -0.03, latOff: 0.2, vertOff: 0.2, paraMag: -0.2, latMag: 1 },
            { frame: 3, count: 3, paraOff: -0.03, latOff: 0.3, vertOff: 0.2, paraMag: -0.2, latMag: 1 },
            { frame: 4, count: 2, paraOff: -0.03, latOff: 0.4, vertOff: 0.2, paraMag: -0.2, latMag: 1 }],
        fxDown: [{ frame: 0, count: 1, paraOff: 0.1, vertOff: 0.2, paraMag: -0.2, latMag: 1 },
            { frame: 1, count: 2, paraOff: 0.1, latOff: 0.1, vertOff: 0.15, paraMag: -0.2, latMag: 1 },
            { frame: 2, count: 2, paraOff: 0.1, latOff: 0.2, vertOff: 0.1, paraMag: -0.2, latMag: 1 },
            { frame: 3, count: 3, paraOff: 0.1, latOff: 0.3, vertOff: 0.05, paraMag: -0.2, latMag: 1 },
            { frame: 4, count: 2, paraOff: 0.1, latOff: 0.4, vertOff: 0.0, paraMag: -0.2, latMag: 1 }],
        knock: [{ frame: 2, paraMag: 0.05, latMag: 0.2 }]
    };
    abiSpriteLib.indexes['saw'] = { delay: 23,
        fx: [{ frame: 3, count: 1, paraOff: 0.1, vertOff: 0.10, paraMag: -1 },
            { frame: 4, count: 2, paraOff: 0.08, vertOff: 0.08, paraMag: -1 },
            { frame: 5, count: 2, paraOff: 0.06, vertOff: 0.06, paraMag: -1 },
            { frame: 12, count: 1, paraOff: 0.08, vertOff: 0.08, paraMag: -1, vertMag: 0.2 },
            { frame: 13, count: 2, paraOff: 0.1, vertOff: 0.12, paraMag: -1, vertMag: 0.4 },
            { frame: 14, count: 2, paraOff: 0.12, vertOff: 0.16, paraMag: -1, vertMag: 0.6 },
            { frame: 23, count: 1, paraOff: 0.1, vertOff: 0.16, paraMag: -1 },
            { frame: 24, count: 2, paraOff: 0.08, vertOff: 0.12, paraMag: -1 },
            { frame: 25, count: 2, paraOff: 0.06, vertOff: 0.08, paraMag: -1 }],
        fxDown: [{ frame: 0, count: 1, paraOff: 0.04, vertOff: 0.12, paraMag: -1 },
            { frame: 1, count: 2, paraOff: 0.02, vertOff: 0.02, paraMag: -1 },
            { frame: 2, count: 2, paraOff: 0, vertOff: -0.04, paraMag: -1 },
            { frame: 9, count: 1, paraOff: 0, vertOff: -0.1, paraMag: -0.5, vertMag: 0.2 },
            { frame: 10, count: 2, paraOff: 0.02, vertOff: 0.0, paraMag: -0.5, vertMag: 0.4 },
            { frame: 11, count: 2, paraOff: 0.04, vertOff: 0.1, paraMag: -0.5, vertMag: 0.6 },
            { frame: 20, count: 1, paraOff: 0.04, vertOff: 0.12, paraMag: -1 },
            { frame: 21, count: 2, paraOff: 0.02, vertOff: 0.02, paraMag: -1 },
            { frame: 22, count: 2, paraOff: 0, vertOff: -0.08, paraMag: -1 }],
        knock: [{ frame: 6, paraMag: -0.05, vertMag: -0.05 },
            { frame: 7, paraMag: -0.05, vertMag: -0.05 },
            { frame: 8, paraMag: -0.03, vertMag: -0.03 },
            { frame: 14, paraMag: 0.05, vertMag: 0.05 },
            { frame: 15, paraMag: 0.05, vertMag: 0.05 },
            { frame: 16, paraMag: 0.03, vertMag: 0.03 },
            { frame: 25, paraMag: -0.05, vertMag: -0.05 },
            { frame: 26, paraMag: -0.05, vertMag: -0.05 },
            { frame: 27, paraMag: -0.03, vertMag: -0.03 }]
    };
    abiSpriteLib.indexes['chop'] = { delay: 27,
        fx: [{ frame: 0, count: 7, paraOff: 0.18, paraMag: -0.8, vertMag: 0.3 }],
        fxDown: [{ frame: 0, count: 7, paraOff: -0.1, vertOff: -0.3, paraMag: -0.8, vertMag: 0.3 }],
        knock: [{ frame: 0, paraMag: 0.1, vertMag: -0.2 }]
    };
    abiSpriteLib.indexes['dig'] = { delay: 38,
        fx: [{ frame: 0, count: 3, paraOff: -0.01, latOff: 0.1, vertOff: -0.2, latMag: -1, vertMag: 0.2 },
            { frame: 1, count: 4, paraOff: -0.01, latOff: 0.0, vertOff: -0.1, latMag: -1.2, vertMag: 0.3 },
            { frame: 2, count: 4, paraOff: -0.01, latOff: -0.1, latMag: -1.2, vertMag: 0.3 },
            { frame: 3, count: 2, paraOff: -0.01, latOff: -0.2, vertOff: 0.1, latMag: -1.2, vertMag: 0.4 }],
        knock: [{ frame: 0, latMag: -0.02, vertMag: 0.02 },
            { frame: 1, latMag: -0.03, vertMag: 0.03 },
            { frame: 2, latMag: -0.04, vertMag: 0.04 },
            { frame: 3, latMag: -0.05, vertMag: 0.05 }]
    };
    abiSpriteLib.indexes['swat'] = { delay: 20,
        fx: [{ frame: 0, count: 4, latOff: 0.2, vertOff: 0.2, paraMag: 0.04, vertMag: 0.1 }],
        fxDown: [{ frame: 0, count: 4, vertOff: -0.2, paraMag: 0.04, vertMag: 0.1 }],
        knock: [{ frame: 0, paraMag: 0.05, vertMag: -0.05 }]
    };
    abiSpriteLib.indexes['wipe'] = { delay: 27,
        fx: [{ frame: 0, count: 4, latOff: 0.2, vertOff: 0.1, latMag: 1, vertMag: -0.1 },
            { frame: 16, count: 6, vertOff: 0.2, latMag: -1, vertMag: 0.1 }],
        fxDown: [{ frame: 0, count: 4, latOff: 0.2, latMag: 1, vertMag: -0.1 },
            { frame: 16, count: 6, latOff: -0.2, vertOff: 0.1, latMag: -1, vertMag: 0.1 }],
        knock: [{ frame: 0, latMag: 0.03, vertMag: -0.02 },
            { frame: 16, latMag: -0.04, vertMag: 0.02 },
            { frame: 17, latMag: -0.07, vertMag: 0.05 }]
    };
    abiSpriteLib.indexes['vibrate'] = { delay: 32,
        fx: [{ frame: 0, count: 4, paraOff: -0.02, vertOff: -0.2, paraMag: 0.5, vertMag: 0.1 },
            { frame: 8, count: 4, paraOff: -0.02, vertOff: -0.2, paraMag: 0.5, vertMag: 0.1 },
            { frame: 16, count: 4, paraOff: -0.02, vertOff: -0.2, paraMag: 0.5, vertMag: -0.1 },
            { frame: 24, count: 4, paraOff: -0.02, vertOff: -0.2, paraMag: -0.5, vertMag: -0.1 }],
        knock: [{ frame: 0, paraMag: 0.01, vertMag: -0.01 },
            { frame: 4, paraMag: 0.02, vertMag: 0.02 },
            { frame: 8, paraMag: -0.02, vertMag: 0.02 },
            { frame: 12, paraMag: -0.03, vertMag: -0.03 },
            { frame: 16, paraMag: 0.03, vertMag: -0.03 },
            { frame: 20, paraMag: 0.04, vertMag: 0.04 },
            { frame: 24, paraMag: -0.05, vertMag: 0.05 },
            { frame: 28, paraMag: -0.03, vertMag: -0.03 }]
    };
    abiSpriteLib.indexes['poke'] = { delay: 45,
        fx: [{ frame: 0, count: 3, paraOff: 0.04, vertOff: 0.1, paraMag: 0.4 }],
        fxDown: [{ frame: 0, count: 3, paraOff: -0.1, vertOff: -0.2, paraMag: 0.4 }],
        knock: [{ frame: 0, paraMag: 0.05 }]
    };
    abiSpriteLib.indexes['bonk'] = { delay: 32,
        fx: [{ frame: 0, count: 3, paraMag: 0.4 }],
        fxDown: [{ frame: 0, count: 3, vertOff: -0.1, paraMag: 0.4 }],
        knock: [{ frame: 0, paraMag: 0.05 }]
    };
    abiSpriteLib.indexes['reflect'] = { delay: 21,
        fx: [{ frame: 0, count: 1, paraOff: -0.2, latOff: 0.4, paraMag: -0.1, latMag: 0.4 },
            { frame: 10, count: 1, paraOff: -0.2, latOff: 0.4, paraMag: -0.1, latMag: 0.4 },
            { frame: 15, count: 1, paraOff: -0.2, latOff: 0.4, paraMag: -0.1, latMag: 0.4 },
            { frame: 20, count: 1, paraOff: -0.2, latOff: 0.4, paraMag: -0.1, latMag: 0.4 },
            { frame: 25, count: 1, paraOff: -0.2, latOff: 0.4, paraMag: -0.1, latMag: 0.4 }],
        fxDown: [{ frame: 0, count: 1, paraOff: -0.08, vertOff: -0.1, paraMag: -0.1, latMag: -0.4 },
            { frame: 10, count: 1, paraOff: -0.08, vertOff: -0.1, paraMag: -0.1, latMag: -0.4 },
            { frame: 15, count: 1, paraOff: -0.08, vertOff: -0.1, paraMag: -0.1, latMag: -0.4 },
            { frame: 20, count: 1, paraOff: -0.08, vertOff: -0.1, paraMag: -0.1, latMag: -0.4 },
            { frame: 25, count: 1, paraOff: -0.08, vertOff: -0.1, paraMag: -0.1, latMag: -0.4 }],
        knock: [{ frame: 0, paraMag: 0.05, latMag: 0.05 },
            { frame: 10, paraMag: 0.05, latMag: 0.05 },
            { frame: 15, paraMag: 0.05, latMag: 0.05 },
            { frame: 20, paraMag: 0.05, latMag: 0.05 },
            { frame: 25, paraMag: 0.05, latMag: 0.05 }],
        knockDown: [{ frame: 0, paraMag: 0.05, latMag: -0.05 },
            { frame: 10, paraMag: 0.05, latMag: -0.05 },
            { frame: 15, paraMag: 0.05, latMag: -0.05 },
            { frame: 20, paraMag: 0.05, latMag: -0.05 },
            { frame: 25, paraMag: 0.05, latMag: -0.05 }]
    };
    abiSpriteLib.indexes['stick'] = { delay: 36,
        fx: [{ frame: 4, count: 3, paraMag: -0.6, vertMag: -0.1 }],
        knock: [{ frame: 0, paraMag: -0.06, vertMag: 0.06 },
            { frame: 1, paraMag: -0.08, vertMag: 0.08 },
            { frame: 2, paraMag: -0.1, vertMag: 0.1 },
            { frame: 3, paraMag: -0.12, vertMag: 0.08 }]
    };
    abiSpriteLib.indexes['erase'] = { delay: 24,
        fx: [{ frame: 0, count: 1, paraOff: -0.1, vertMag: -0.3 },
            { frame: 5, count: 1, paraOff: 0.1, vertOff: 0.2, vertMag: 0.3 },
            { frame: 11, count: 1, paraOff: -0.1, latOff: 0.1, vertOff: -0.1, vertMag: -0.3 },
            { frame: 17, count: 1, paraOff: -0.1, latOff: 0.2, vertOff: 0.3, vertMag: 0.3 },
            { frame: 25, count: 1, paraOff: -0.1, latOff: 0.2, vertMag: -0.3 },
            { frame: 30, count: 1, paraOff: 0.1, vertOff: 0.2, vertMag: 0.3 },
            { frame: 35, count: 1, paraOff: -0.1, vertOff: -0.1, vertMag: -0.3 }],
        fxDown: [{ frame: 0, count: 1, paraOff: -0.1, latOff: -0.2, vertOff: -0.25, vertMag: -0.3 },
            { frame: 5, count: 1, paraOff: -0.1, latOff: -0.1, vertOff: 0.1, vertMag: 0.3 },
            { frame: 11, count: 1, paraOff: -0.1, latOff: -0.1, vertOff: -0.3, vertMag: -0.3 },
            { frame: 16, count: 1, paraOff: -0.1, vertOff: 0.1, vertMag: 0.3 },
            { frame: 22, count: 1, paraOff: -0.1, latOff: 0.02, vertOff: -0.3, vertMag: -0.3 },
            { frame: 28, count: 1, paraOff: -0.1, latOff: -0.05, vertOff: 0.1, vertMag: 0.3 },
            { frame: 35, count: 1, paraOff: -0.1, latOff: -0.2, vertOff: -0.25, vertMag: -0.3 }],
        knock: [{ frame: 0, vertMag: -0.08 },
            { frame: 5, vertMag: 0.08 },
            { frame: 11, vertMag: -0.08 },
            { frame: 17, vertMag: 0.08 },
            { frame: 25, vertMag: -0.06 },
            { frame: 30, vertMag: 0.08 },
            { frame: 35, vertMag: -0.08 }],
        knockDown: [{ frame: 0, vertMag: -0.08 },
            { frame: 5, vertMag: 0.08 },
            { frame: 11, vertMag: -0.08 },
            { frame: 17, vertMag: 0.08 },
            { frame: 22, vertMag: -0.08 },
            { frame: 28, vertMag: 0.08 },
            { frame: 34, vertMag: -0.08 }]
    };
    abiSpriteLib.indexes['write'] = { delay: 30,
        fx: [{ frame: 0, count: 1, vertOff: -0.1, paraMag: -0.1, vertMag: -0.1 },
            { frame: 7, count: 1, vertOff: 0.1, paraMag: -0.1, vertMag: 0.1 },
            { frame: 14, count: 1, latOff: 0.14, paraMag: -0.1, latMag: 0.1 },
            { frame: 25, count: 1, paraOff: -0.1, latOff: 0.2, paraMag: -0.1, vertMag: -0.1 },
            { frame: 33, count: 1, paraOff: -0.1, latOff: 0.24, vertOff: 0.2, paraMag: -0.1, vertMag: 0.1 }],
        fxDown: [{ frame: 1, count: 1, paraOff: 0.1, vertOff: -0.2, paraMag: -0.1, vertMag: -0.1 },
            { frame: 9, count: 1, paraOff: 0.1, latOff: -0.1, vertOff: -0.1, paraMag: -0.1, latMag: -0.1 },
            { frame: 17, count: 1, paraOff: 0.1, latOff: 0.16, vertOff: -0.1, paraMag: -0.1, latMag: 0.1 },
            { frame: 25, count: 1, paraOff: 0.1, latOff: 0.16, vertOff: -0.1, paraMag: -0.1, vertMag: 0.1 },
            { frame: 33, count: 1, paraOff: 0.1, latOff: 0.1, vertOff: -0.14, paraMag: -0.1, vertMag: -0.1 }],
        knock: [{ frame: 1, vertMag: -0.08 },
            { frame: 8, vertMag: 0.08 },
            { frame: 15, latMag: 0.08 },
            { frame: 26, vertMag: -0.08 },
            { frame: 34, vertMag: 0.08 }],
        knockDown: [{ frame: 2, vertMag: -0.08 },
            { frame: 10, vertMag: 0.05, latMag: -0.05 },
            { frame: 18, latMag: 0.08 },
            { frame: 26, vertMag: 0.08 },
            { frame: 34, vertMag: -0.08 }]
    };
    abiSpriteLib.indexes['pay'] = { delay: 52,
        fx: [{ frame: 0, count: 3, paraOff: -0.14, latOff: 0.3, vertOff: 0.2, paraMag: -0.1, latMag: -0.6 },
            { frame: 3, count: 2, paraOff: -0.14, latOff: 0.3, vertOff: 0.2, paraMag: -0.1, latMag: -0.7 },
            { frame: 8, count: 1, paraOff: -0.14, latOff: 0.3, vertOff: 0.2, paraMag: -0.1, latMag: -0.8 }],
        fxDown: [{ frame: 0, count: 3, paraOff: -0.14, latOff: -0.04, vertOff: -0.2, paraMag: -0.1, latMag: 0.6 },
            { frame: 3, count: 2, paraOff: -0.14, latOff: -0.04, vertOff: -0.2, paraMag: -0.1, latMag: 0.7 },
            { frame: 8, count: 1, paraOff: -0.14, latOff: -0.04, vertOff: -0.2, paraMag: -0.1, latMag: 0.8 }],
        knock: [{ frame: 0, paraMag: 0.06, latMag: 0.06 }], 
        knockDown: [{ frame: 0, paraMag: 0.06, latMag: -0.06 }]
    };
    abiSpriteLib.indexes['charm'] = { delay: 26,
        fx: [{ frame: 0, count: 2, paraOff: 0.1, latOff: 0.3, vertOff: 0.2, latMag: 0.8, vertMag: 0.8 },
            { frame: 7, count: 2, paraOff: 0.1, latOff: -0.02, vertOff: 0.4, latMag: -0.8, vertMag: 0.8 },
            { frame: 18, count: 2, paraOff: 0.1, latOff: -0.02, latMag: -0.8, vertMag: 0.8 },
            { frame: 26, count: 2, paraOff: 0.1, latOff: -0.1, vertOff: 0.1, latMag: 0.8, vertMag: 0.8 }],
        fxDown: [{ frame: 0, count: 2, paraOff: 0.4, vertOff: 0.2, latMag: -0.8, vertMag: 0.8 },
            { frame: 7, count: 2, paraOff: 0.1, latOff: -0.02, vertOff: 0.4, latMag: 0.8, vertMag: 0.8 },
            { frame: 18, count: 2, paraOff: 0.1, latOff: -0.02, latMag: 0.8, vertMag: 0.8 },
            { frame: 26, count: 2, paraOff: 0.1, vertOff: 0.1, latMag: -0.8, vertMag: 0.8 }],
        knock: [{ frame: 0, paraMag: 0.06 },
            { frame: 7, paraMag: 0.06 },
            { frame: 18, paraMag: 0.06 },
            { frame: 26, paraMag: 0.06 }]
    };
    var debugAbi = 'charm';
    window[debugAbi] = abiSpriteLib.indexes[debugAbi];
    window.ao = function(prop,val) {
        abiSpriteLib.indexes[debugAbi].fx[0][prop] = val;
        return angular.copy(abiSpriteLib.indexes[debugAbi].fx[0]);
    };
    window.sd = function(val) {
        abiSpriteLib.indexes[debugAbi].delay = val;
        return angular.copy(abiSpriteLib.indexes[debugAbi]);
    };
    
    inventorySpriteImg.onload = function(){imagesLoaded++;};
    // Load attack animation sprite sheet
    attacksImg.right = new Image();
    attacksImg.right.src = 'img/attack-anims.png';
    totalImages++;
    attacksImg.right.onload = function(){
        attacksImg.left = document.createElement('canvas');
        attacksImg.left.width = attacksImg.right.width; attacksImg.left.height = attacksImg.right.height;
        var alCtx = attacksImg.left.getContext('2d');
        var aFrames = attacksImg.left.width / 59;
        alCtx.save(); alCtx.translate(attacksImg.left.width, 0); alCtx.scale(-1,1);
        for(var af = 0; af < aFrames; af++) {
            alCtx.drawImage(attacksImg.right,af*59,0,59,attacksImg.left.height,
                (aFrames-af-1)*59,0,59,attacksImg.left.height);
        }
        alCtx.restore();
        imagesLoaded++;
    };
    //Load and initialize fonts
    var fontNormalImg = new Image();
    fontNormalImg.src = 'img/font-normal.png';
    totalImages++;
    dmgNumbersImg = new Image();
    dmgNumbersImg.src = 'img/dmg-numbers.png?'+graphicsRevision; // Tiny numbers font
    totalImages++;
    var fontsLoaded = 0;
    var fontLoaded = function() {
        imagesLoaded++; fontsLoaded++;
        if(fontsLoaded == 2) TextDraw.loadFont(fontNormalImg,dmgNumbersImg);
    };
    fontNormalImg.onload = fontLoaded;
    dmgNumbersImg.onload = fontLoaded;
    // Create generic sprite for missing image
    genericSprite = document.createElement('canvas');
    genericSprite.width = 24; genericSprite.height = 24;
    var spriteThingContext = genericSprite.getContext('2d');
    spriteThingContext.shadowColor = 'rgba(0,0,0,0.3)';
    spriteThingContext.shadowBlur = 4;
    spriteThingContext.shadowOffsetX = 2;
    spriteThingContext.shadowOffsetY = 1;
    spriteThingContext.fillStyle = 'rgba(0,0,0,0.3)';
    spriteThingContext.fillRect(4,7,16,16);
    spriteThingContext.fillStyle = '#6699aa';
    spriteThingContext.fillRect(5,8,14,14);
    
    return {
        getLoadProgress: function() { return imagesLoaded/totalImages; },
        thingSpriteLib: thingSpriteLib, containerSpriteLib: containerSpriteLib, genericSprite: genericSprite,
        sectorSpriteImg: sectorSpriteImg, pathTileLib: pathTileLib, pathTileImg: pathTileImg, bgTileImg: bgTileImg,
        abiSpriteLib: abiSpriteLib, attacksImg: attacksImg, inventorySpriteImg: inventorySpriteImg,
        getThingSprite: function(thing) {
            if(!thing.id)console.log(angular.copy(thing));
            //var list = thingSpriteLib.names[thingSpriteLib.indexes[thing.id][0]]; // List of sprite mods
            var canvasPosition = 0;
            var canvases = thingSpriteLib.indexes[thing.id][1];
            var colorCanvases = thingSpriteLib.indexes[thing.id][2];
            //for(var m = 1; m < list.length; m++) { // Loop through mods (not counting base)
            //    var modProps = list[m].split('+'); // Required props for this mod
            //    var modAccepted = true;
            //    for(var p = 0; p < modProps.length; p++) { // Loop through required props
            //        var propVariants = modProps[p].split('|'); // Interchangeable properties (broken|cut)
            //        var variantFound = false;
            //        for(var v = 0; v < propVariants.length; v++) { // Loop through variants until one found
            //            if(jQuery.inArray(propVariants[v],thing.allProps) >= 0) {
            //                variantFound = true; break;
            //            }
            //        }
            //        if(!variantFound) { modAccepted = false; break; }
            //    }
            //    canvasPosition = modAccepted ? m : canvasPosition;
            //}
            if(thing.hasOwnProperty('color')) return colorCanvases[canvasPosition][thing.color];
            return canvases[canvasPosition];
        }
    };
});