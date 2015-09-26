'use strict';
Application.Services.factory('UIMan',function(Util,TextDraw,SpriteMan) {
    var game;
    var cursor, bf, cw, ch;
    var elements = [], prompt;
    
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
        this.text = text; this.onClick = [];
        this.hover = false;
        this.addOnClick = function(cb) { this.onClick.push(cb); };
        this.update = function() {
            this.hover = Util.isInArea(cursor.x, cursor.y, this.x, this.y, this.w, this.h, false);
            this.pressed = this.hover && cursor.click;
            // TODO: Don't allow clicking by dragging a clicked cursor into button and releasing
            if(this.hover && cursor.click) { // Fire onClick events
                for(var i = 0; i < this.onClick.length; i++) this.onClick[i]();
            }
        };
        this.draw = function() {
            bf.fillStyle = this.hover && !this.pressed ? '#888888' : '#666666';
            bf.fillRect(this.x, this.y, this.w, this.h);
            bf.fillStyle = this.hover ? this.pressed ? '#222222' : '#404040' : '#282828';
            bf.fillRect(this.x+1, this.y+1, this.w-2, this.h-2);
            TextDraw.drawText(this.text, this.hover ? 'Legendary' : 'white', bf,'normal','med',
                this.x + this.w/2, this.y + this.h/2-4,'center',1);
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
        init: function(c,b,w,h) { cursor = c; bf = b; cw = w; ch = h; },
        initGame: function(g) { game = g; },
        update: function() { for(var i = 0; i < elements.length; i++) { elements[i].update(); } },
        render: function() { for(var i = 0; i < elements.length; i++) { elements[i].draw(); } },
        createPrompt: function(type,onClick,data) {
            switch(type) {
                case 'enterContainer':
                    var playerPos = Util.isoToScreen(data.player.ox+0.5,data.player.oy+0.5);
                    var windowY = playerPos.y - 94 < 2 ? playerPos.y + 28 : playerPos.y - 94;
                    prompt = new Window(playerPos.x - 90,windowY,180,76); elements.push(prompt);
                    prompt.children.push(new Label(prompt.x + 125,prompt.y + 13,data.container.name,'center'));
                    // TODO: Show open sprite when hovering on "Enter" button
                    prompt.children.push(new Graphic(prompt.x+2,prompt.y+2,72,72,
                        SpriteMan.containerSpriteLib.indexes[data.container.id]['sprite']));
                    var newButton = new Button(prompt.x + 95,prompt.y + 34,60,30,'Enter',onClick);
                    newButton.addOnClick(onClick);
                    newButton.addOnClick(function(){deleteElement(prompt);});
                    prompt.children.push(newButton);
                    break;
            }
        },
        removePrompt: function(){ deleteElement(prompt); }
    };
});