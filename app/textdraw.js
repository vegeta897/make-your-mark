'use strict';
Application.Services.factory('TextDraw',function(Util) {
    
    var fontNormal, fontDmg;
    var metrics = {
        normal: {
            med: [
                ['A',5], ['B',5], ['C',5], ['D',5], ['E',4], ['F',4], ['G',5], ['H',5], ['I',3], ['J',5],
                ['K',5], ['L',4], ['M',5], ['N',5], ['O',5], ['P',5], ['Q',5], ['R',5], ['S',5], ['T',5],
                ['U',5], ['V',5], ['W',5], ['X',5], ['Y',5], ['Z',5],
                ['a',5], ['b',4], ['c',4], ['d',4], ['e',4], ['f',4], ['g',4], ['h',4], ['i',1], ['j',2],
                ['k',4], ['l',1], ['m',5], ['n',4], ['o',4], ['p',4], ['q',4], ['r',4], ['s',4], ['t',4],
                ['u',4], ['v',5], ['w',5], ['x',4], ['y',4], ['z',4],
                ['0',4], ['1',3], ['2',4], ['3',4], ['4',4], ['5',4], ['6',4], ['7',4], ['8',4], ['9',4], ['!',1], [' ',4]
            ]
        },
        dmg: {
            small: [
                ['0',3], ['1',2],['2',3],['3',3],['4',3],['5',3],['6',3],['7',3],['8',3],['9',3],[' ',3]
            ],
            med: [
                ['0',4], ['1',3],['2',4],['3',4],['4',4],['5',4],['6',4],['7',4],['8',4],['9',4],[' ',4]
            ],
            large: [
                ['0',6], ['1',4],['2',6],['3',6],['4',6],['5',6],['6',6],['7',6],['8',6],['9',6],[' ',6]
            ]
        }
    };
    var rx = 0;
    var normalObj = { med: {} };
    for(var ns in metrics.normal) { if(!metrics.normal.hasOwnProperty(ns)) continue;
        for(var m = 0; m < metrics.normal.med.length; m++) {
            normalObj[ns][metrics.normal.med[m][0]] = { x: rx, y: (m < 26 ? 0 : m > 51 ? 19 : 8), 
                w: metrics.normal.med[m][1]+1, h: m < 26 ? 8 : m > 51 ? 8 : 11 };
            rx += metrics.normal.med[m][1]+1;
            if(m == 25 || m == 51) rx = 0;
        }
    }
    metrics.normal = normalObj;
    rx = 0;
    var dmgObj = { small: {}, med: {}, large: {} };
    for(var ds in metrics.dmg) { if(!metrics.dmg.hasOwnProperty(ds)) continue;
        for(var d = 0; d < metrics.dmg[ds].length; d++) {
            dmgObj[ds][metrics.dmg[ds][d][0]] = { x: rx, y: ds == 'small' ? 0 : ds == 'med' ? 6 : 14, 
                w: metrics.dmg[ds][d][1]+1, h: ds == 'small' ? 6 : ds == 'med' ? 8 : 10 };
            rx += metrics.dmg[ds][d][1]+1;
            if(d == 10 || d == 20) rx = 0;
        }
    }
    metrics.dmg = dmgObj;
    
    return {
        loadFont: function(imgN,imgD) { 
            fontNormal = { white: imgN };
            fontDmg = { yellow: imgD };
            // Generate quality level colors
            for(var ql in Util.qualityLevels) { if(!Util.qualityLevels.hasOwnProperty(ql)) continue;
                var quality = Util.qualityLevels[ql];
                var colorCanvas = document.createElement('canvas');
                colorCanvas.width = imgN.width; colorCanvas.height = imgN.height;
                var ctx = colorCanvas.getContext('2d');
                ctx.drawImage(imgN,0,0);
                var imgData = ctx.getImageData(0,0,colorCanvas.width,colorCanvas.height);
                for(var p = 0; p < imgData.data.length; p += 4) {
                    if(imgData.data[p] == 255) {
                        imgData.data[p] = quality.r;
                        imgData.data[p+1] = quality.g;
                        imgData.data[p+2] = quality.b;
                    }
                }
                ctx.putImageData(imgData,0,0);
                fontNormal[quality.name] = colorCanvas;
            }
        },
        drawText: function(text,color,canvas,font,size,x,y,alignment,scale) {
            var xPos = 0, totalWidth = 0, fontImg = font == 'normal' ? fontNormal : fontDmg;
            if(alignment == 'center') { for(var a = 0; a < text.length; a++) {
                totalWidth += (metrics[font][size][text[a]] ? metrics[font][size][text[a]].w : metrics[font][size][' '].w)*scale;
            } }
            totalWidth = Math.floor((totalWidth-1)/2);
            for(var l = 0; l < text.length; l++) {
                var letter = metrics[font][size][text[l]] ? metrics[font][size][text[l]] : metrics[font][size][' '];
                canvas.drawImage(fontImg[color],letter.x,letter.y,letter.w,letter.h,
                    x+xPos-totalWidth,y,letter.w*scale,letter.h*scale);
                xPos += letter.w*scale;
            }
        }
    }
});