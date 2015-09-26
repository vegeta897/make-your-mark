'use strict';
Application.Services.factory('UIMan',function(Util,TextDraw,SpriteMan) {
    var game;
    var cursor, bf, cw, ch;
    var elements = [], prompt, mmZoomOut, mmZoomIn;
    
    var Window = function(x,y,w,h) {
        this.x = x; this.y = y; this.w = w; this.h = h; this.children = [];
        this.draw = function() {
            bf.fillStyle = '#282828'; bf.fillRect(x,y,w,h);
            bf.fillStyle = '#333333'; bf.fillRect(x+1,y+1,w-2,h-2);
            for(var i = 0; i < this.children.length; i++) {
                this.children[i].draw();
            }
        };
        this.update = function(){
            for(var i = 0; i < this.children.length; i++) {
                this.children[i].update();
            }
        };
    };
    
    var Label = function(x,y,text,align) {
        this.x = x; this.y = y; this.text = text; this.align = align;
        this.draw = function() {
            TextDraw.drawText(this.text, 'white', bf,'normal','med',this.x, this.y,this.align,1);
        };
        this.update = function(){};
    };
    
    var Button = function(x,y,w,h,text) {
        this.x = x; this.y = y; this.w = w; this.h = h;
        this.text = text; this.onClick = []; this.disabled = false;
        this.hover = false;
        this.addOnClick = function(cb) { this.onClick.push(cb); };
        this.update = function() {
            this.hover = Util.isInArea(cursor.x, cursor.y, this.x, this.y, this.w, this.h, false);
            this.pressed = this.hover && cursor.lmb;
            // TODO: Don't allow clicking by dragging a clicked cursor into button and releasing
            if(this.hover && cursor.click) { // Fire onClick events
                for(var i = 0; i < this.onClick.length; i++) this.onClick[i]();
            }
        };
        this.draw = function() {
            if(!this.disabled && this.hover && !this.pressed) { // Border
                bf.fillStyle = '#888888'; // Hover
            } else { bf.fillStyle = '#666666'; } // Normal/disabled/pressed
            bf.fillRect(this.x, this.y, this.w, this.h);
            if(!this.disabled) { // Fill
                if(this.hover) bf.fillStyle = '#404040'; // Hover
                else if(this.pressed) bf.fillStyle = '#222222'; // Pressed
                else bf.fillStyle = '#282828'; // Normal
            } else bf.fillStyle = '#404040'; // Disabled
            bf.fillRect(this.x+1, this.y+1, this.w-2, this.h-2);
            var fontColor;
            if(!this.disabled) { // Text
                if(this.hover) fontColor = 'Legendary'; // Hover
                else fontColor = 'white'; // Normal/pressed
            } else fontColor = 'Poor'; // Disabled
            TextDraw.drawText(this.text,fontColor,bf,'normal','med',this.x+this.w/2,this.y+this.h/2-4,'center',1);
        };
    };

    var Graphic = function(x,y,w,h,sprite) {
        this.x = x; this.y = y; this.w = w; this.h = h; this.sprite = sprite;
        this.draw = function() {
            bf.drawImage(this.sprite,0,0,this.sprite.width,this.sprite.height,x,y,w,h);
        };
        this.update = function(){};
    };
    
    var deleteElement = function(element) {
        for(var i = 0; i < elements.length; i++) {
            if(elements[i] == element) { 
                elements.splice(i,1); break; 
            }
        }
    };
    
    return {
        init: function(c,buffer,w,h) {
            cursor = c; bf = buffer; cw = w; ch = h;
        },
        initGame: function(g) { 
            game = g;
            mmZoomOut = new Button(0,139,17,16,'-');
            mmZoomOut.addOnClick(function(){
                game.options.minimapZoom = Math.max(1,game.options.minimapZoom-1); 
                mmZoomOut.disabled = game.options.minimapZoom == 1;
                mmZoomIn.disabled = game.options.minimapZoom == 3;
            });
            mmZoomIn = new Button(20,139,17,16,'+');
            mmZoomIn.addOnClick(function(){
                game.options.minimapZoom = Math.min(3,game.options.minimapZoom+1);
                mmZoomOut.disabled = game.options.minimapZoom == 1;
                mmZoomIn.disabled = game.options.minimapZoom == 3;
                
            });
            mmZoomIn.disabled = true;
            elements.push(mmZoomOut); elements.push(mmZoomIn);
        },
        update: function() { for(var i = 0; i < elements.length; i++) { elements[i].update(); } },
        render: function() { for(var i = 0; i < elements.length; i++) { elements[i].draw(); } },
        createPrompt: function(type,onClick,data) {
            switch(type) {
                case 'enterContainer':
                    var playerPos = Util.isoToScreen(data.player.ox+0.5,data.player.oy+0.5);
                    var windowX = Math.max(0,Math.min(cw-180,playerPos.x - 90));
                    var windowY = playerPos.y - 94 < 2 ? playerPos.y + 28 : playerPos.y - 94;
                    prompt = new Window(windowX,windowY,180,76); elements.push(prompt);
                    prompt.children.push(new Label(prompt.x + 125,prompt.y + 13,data.container.name,'center'));
                    // TODO: Show open sprite when hovering on "Enter" button
                    prompt.children.push(new Graphic(prompt.x+2,prompt.y+2,72,72,
                        SpriteMan.containerSpriteLib.indexes[data.container.id]['sprite']));
                    var newButton = new Button(prompt.x + 95,prompt.y + 34,60,30,'Enter');
                    newButton.addOnClick(onClick);
                    newButton.addOnClick(function(){deleteElement(prompt);});
                    prompt.children.push(newButton);
                    break;
            }
        },
        removePrompt: function(){ deleteElement(prompt); }
    };
});