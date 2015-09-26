'use strict';
Application.Services.factory('Interface',function(World,Players,Things,Util,FireService) {
    
    var game, world;
    var lmbLast, cursorLast, grabOrigin, originSlot, cursorInSector, noAttack;
    
    var processCursor = function(c) {
        if(c.x != '-') {
            c.isoFine = Util.screenToIso((c.x+1), (c.y-11));
            c.iso = { x:Math.floor(c.isoFine.x), y:Math.floor(c.isoFine.y) };
            cursorInSector = Util.xyInBounds(c.iso.x, c.iso.y,0,0,game.arena.width,game.arena.height);
            var playerScreen = Util.isoToScreen(game.player.x,game.player.y);
            var co = { x: c.x - playerScreen.x - 23, y: c.y - playerScreen.y - 13 }; // Cursor-Player canvas delta
            // Determine cursor quad
            if(c.iso.x == game.player.x && c.iso.y == game.player.y) c.clickQuad = {x:0,y:0};
            else if(co.y < 0 && co.x < 0) c.clickQuad = {x:0,y:-1};
            else if(co.y >= 0 && co.x < 0) c.clickQuad = {x:-1,y:0};
            else if(co.y < 0 && co.x >= 0) c.clickQuad = {x:1,y:0};
            else c.clickQuad = {x:0,y:1};
        } else { c.clickQuad = false; }
    };
    
    return {
        initGame: function(g) { game = g; world = World.world; },
        updateCursor: function(c,panel,lmb,rmb) { // lmb,rmb = left/right mouse pressed
            processCursor(c);
            // Generate hover list
            if(!lmb) {
                noAttack = false; // Reset noAttack when left mouse released
            }
            c.hover = {};
            c.click = false;
            var underCursor = [], hoverSelect;
            
            // Auto attack
            // return {
            //    move: rmb, hover: hoverSelect, clickQuad: {x:-1,y:0}, noAttack: noAttack
            //};
            
            if(c.x != '-') {
                var onBackpack = Util.xyInBounds(c.x, c.y,608,260,108,54);
                var onToolbelt = Util.xyInBounds(c.isoFine.x, c.isoFine.y, 0.1, 15.2, 5.65, 1.43);
                var cio = {x: c.x - 608,y: c.y -260}; // Cursor backpack offset
                c.onBPslot = onBackpack ? Math.floor(cio.x/28) + 4*(Math.floor(cio.y/28)) : -1;
                c.onTBslot = onToolbelt ? Math.floor((c.isoFine.x-0.1)/1.43) : -1;
                if(onBackpack) {
                    noAttack = true;
                    if(game.player.backpack[c.onBPslot]) {
                        c.hover[game.player.backpack[c.onBPslot].guid] = game.player.backpack[c.onBPslot];
                        hoverSelect = game.player.backpack[c.onBPslot];
                    }
                } else if(onToolbelt) {
                    noAttack = true;
                    if(game.player.toolbelt[c.onTBslot]) {
                        c.hover[game.player.toolbelt[c.onTBslot].guid] = game.player.toolbelt[c.onTBslot];
                        hoverSelect = game.player.toolbelt[c.onTBslot];
                    }
                } else {
                    underCursor = World.getObjectsAt(0,0,c.iso.x, c.iso.y,'cursor');
                    for(var i = 0; i < underCursor.length; i++) {
                        c.hover[underCursor[i].guid] = underCursor[i];
                        hoverSelect = underCursor[i].guid[0] == 't' ? underCursor[i] : hoverSelect;
                    }
                }
                c.hoverSingle = hoverSelect;
                noAttack = hoverSelect ? true : noAttack; // Don't attack when selecting
                if(!lmbLast && lmb && !hoverSelect) {
                    if(game.selected) noAttack = true; // Don't attack when deselecting
                    delete game.selected; game.player.needTarget = false;
                }
                if(lmb) {
                    c.lmb = true;
                    if(hoverSelect && !game.dragging && !lmbLast) {
                        game.selected = hoverSelect; grabOrigin = {x:c.x, y:c.y, bpSlot:c.onBPslot, tbSlot:c.onTBslot};
                    }
                    if(game.selected && !game.dragging && (onBackpack || onToolbelt
                        || (Math.abs(game.selected.x - game.player.ox) + Math.abs(game.selected.y - game.player.oy) < 2)) 
                        && (Math.abs(grabOrigin.x - c.x) > 4 || Math.abs(grabOrigin.y - c.y) > 4)) {
                        if(grabOrigin.bpSlot >= 0) originSlot = ['backpack',grabOrigin.bpSlot];
                        if(grabOrigin.tbSlot >= 0) originSlot = ['toolbelt',grabOrigin.tbSlot];
                        game.dragging = game.selected;
                        World.removeThing(game.dragging);
                    }
                    game.player.needTarget = false;
                    if(!game.dragging && !game.selected && !noAttack) Players.attack(c.clickQuad);
                } else {
                    c.lmb = false;
                    if(lmbLast) c.click = true;
                    if(game.dragging) {
                        if(cursorInSector) {
                            game.dragging.sx = game.player.osx; game.dragging.sy = game.player.osy;
                            game.dragging.x = game.player.ox; game.dragging.y = game.player.oy;
                            var thrown = Things.shrinkThings([game.dragging])[0];
                            thrown.dest = c.iso;
                            Players.removeFromCarried(game.dragging);
                            FireService.set('thrown/'+game.dragging.guid,thrown);
                        } else if((onBackpack && game.player.backpack[c.onBPslot] != game.dragging)
                            || (onToolbelt && game.player.toolbelt[c.onTBslot] != game.dragging)) {
                            Players.removeFromCarried(game.dragging);
                            var toInv = onBackpack ? 'backpack' : 'toolbelt';
                            var toSlot = onBackpack ? c.onBPslot : c.onTBslot;
                            if(originSlot) {
                                game.player[originSlot[0]][originSlot[1]] = game.player[toInv][toSlot];
                            } else {
                                Players.dropThing(game.player[toInv][toSlot]);
                            }
                            game.player[toInv][toSlot] = game.dragging;
                            Players.updateInv();
                            Players.storePlayer();
                        }
                        delete game.dragging;
                        originSlot = null;
                    }
                }
                if(rmb) {
                    c.rmb = true;
                    Players.move(c.iso); // Move on right click
                    if((onBackpack || onToolbelt) && hoverSelect) Players.dropThing(hoverSelect)
                }  else { c.rmb = false; }
                if(hoverSelect) {
                    var panelX = c.x > 610 ? c.x*2 - 212 - (c.x - 610)*2 : c.x*2 - 212;
                    var panelY = c.y*2 - 200 < 0 ? c.y*2 + 40 : c.y*2 - 220;
                    jQuery(panel).fadeIn(200).css({left: panelX, top: panelY});
                } else {
                    jQuery(panel).hide();
                }
            }
            lmbLast = lmb;
            cursorLast = c.x +':' + c.y;
        }
    };
});