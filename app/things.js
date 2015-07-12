'use strict';
Application.Services.factory('Things',function(Util) {
    
    var sizes = { MICRO: 1, TINY: 2, SMALL: 3, MEDIUM: 4, LARGE: 5, HUGE: 6 };
    
    var props = {
        BROKEN:'broken', CUT:'cut', CUTTABLE:'cuttable', FLAT:'flat', FOLDED:'folded', 
        FRAGILE:'fragile', HARD:'hard', LONG:'long', PEELED:'peeled', PENCIL_WORKS:'pencil-works',
        SCRATCHED:'scratched', SHARP:'sharp', SMASHED:'smashed', SOFT:'soft', THIN:'thin', 
        TORN:'torn', WRITTEN_ON:'written-on'
    };
    
    var actions = {
        BREAK:'break', FOLD:'fold', PEEL:'peel', SWING:'swing', TEAR:'tear', UNFOLD:'unfold', WRITE:'write'
    };
    
    var THINGS = {
        pencil: { name: 'Pencil', size: sizes.TINY, common: 1000,
            desc: 'A fine writing utensil.', actions: [actions.BREAK,actions.WRITE], 
            props: [props.HARD,props.SHARP,props.LONG] },
        paper: { name: 'Paper', size: sizes.TINY, common: 2000,
            desc: 'Flat, white, rectangular, flimsy.', actions: [actions.TEAR,actions.FOLD], 
            props: [props.FLAT,props.CUTTABLE,props.PENCIL_WORKS] },
        rock: { name: 'Rock', size: sizes.SMALL, common: 1500,
            desc: 'About the size of your fist, it could do some damage.',
            props: [props.HARD,props.PENCIL_WORKS] },
        stone: { name: 'Stone', size: sizes.TINY, common: 2500,
            desc: 'Smaller than a rock. That\'s it.',
            props: [props.HARD,props.PENCIL_WORKS] },
        shovel: { name: 'Shovel', size: sizes.LARGE, common: 200,
            desc: 'Great for digging holes.', actions: [actions.SWING],
            props: [props.HARD,props.THIN,props.LONG] },
        hammer: { name: 'Hammer', size: sizes.MEDIUM, common: 250,
            desc: 'THWACK!', actions: [actions.SWING],
            props: [props.HARD,props.THIN,props.LONG] },
        scissors: { name: 'Scissors', size: sizes.SMALL, common: 400,
            desc: 'One pair of one scissors.', actions: [actions.BREAK,actions.CUT], 
            props: [props.HARD,props.SHARP] },
        paperSnowflake: { name: 'Paper Snowflake', size: sizes.TINY, common: 1,
            desc: 'Did a grade schooler make this?', actions: [actions.TEAR],
            props: [props.FLAT,props.CUTTABLE,props.PENCIL_WORKS] },
        banana: { name: 'Banana', size: sizes.SMALL, common: 250,
            desc: 'Just like the monkeys eat!', actions: [actions.PEEL],
            props: [props.CUTTABLE,props.FRAGILE,props.SOFT] },
        bananaPeel: { name: 'Banana Peel', size: sizes.SMALL, common: 10,
            desc: 'Watch your step.',
            props: [props.CUTTABLE,props.SOFT] },
        guitar: { name: 'Guitar', size: sizes.LARGE, common: 1,
            desc: '6-string acoustic.', actions: [actions.BREAK],
            props: [props.HARD,props.LONG,props.PENCIL_WORKS] }
    };
    
    for(var tKey in THINGS) { if(!THINGS.hasOwnProperty(tKey)) { continue; } THINGS[tKey].id = tKey; } // Assign IDs
    
    var changeThing = function(thing,changeTo) {
        var newThing = angular.copy(THINGS[changeTo]);
        thing.changedFrom = thing.id;
        thing.id = newThing.id; thing.name = newThing.name; thing.size = newThing.size; thing.common = newThing.common;
        thing.desc = newThing.desc; thing.actions = newThing.actions; thing.props = newThing.props;
        delete thing.propsExtra; delete thing.propsLost; delete thing.actionsExtra; delete thing.actionsLost;
    };
    
    var createChild = function(thing,child,id) {
        var newThing = angular.copy(THINGS[child]);
        newThing.guid = thing.guid+'-'+child+'-'+id;
        newThing.sx = thing.sx; newThing.sy = thing.sy; newThing.x = thing.x; newThing.y = thing.y;
        return newThing;
    };
    
    var hasOneProp = function(t,props) { // Thing has at least one of these properties/propsExtra
        var allProps = Util.subtractArrays(t.props.concat(t.propsExtra || []), t.propsLost);
        if(typeof props == 'string' || props instanceof String) props = [props];
        for(var i = 0; i < props.length; i++) {
            if(jQuery.inArray(props[i], allProps) >= 0) return true;
        }
        return false;
    };

    var hasAllProps = function(t,props) { // Thing has all of these properties/propsExtra
        var has = 0, allProps = Util.subtractArrays(t.props.concat(t.propsExtra || []), t.propsLost);
        for(var i = 0; i < props.length; i++) { if(jQuery.inArray(props[i], allProps) >= 0) has++; }
        return has == props.length;
    };
    
    var addX = function(thing,x,stock,extra,lost) {
        thing[lost] = thing[lost] || [];
        thing[extra] = thing[extra] || [];
        if(jQuery.inArray(x,thing[lost]) >= 0) thing[lost].splice(jQuery.inArray(x,thing[lost]),1);
        if(jQuery.inArray(x,thing[extra]) < 0 && 
            jQuery.inArray(x,thing[stock]) < 0) thing[extra].push(x);
        if(thing[lost].length == 0) delete THINGS[lost];
        if(thing[extra].length == 0) delete THINGS[extra];
    };

    var removeX = function(thing,x,stock,extra,lost) {
        thing[lost] = thing[lost] || [];
        thing[extra] = thing[extra] || [];
        if(jQuery.inArray(x,thing[extra]) >= 0) thing[extra].splice(jQuery.inArray(x,thing[extra]),1);
        if(jQuery.inArray(x,thing[lost]) < 0 &&
            jQuery.inArray(x,thing[stock]) >= 0) thing[lost].push(x);
        if(thing[lost].length == 0) delete THINGS[lost];
        if(thing[extra].length == 0) delete THINGS[extra];
    };

    var addProps = function(thing,props) {
        if(typeof props == 'string' || props instanceof String) props = [props];
        for(var i = 0; i < props.length; i++) addX(thing,props[i],'props','propsExtra','propsLost'); 
    };
    var removeProps = function(thing,props) {
        if(typeof props == 'string' || props instanceof String) props = [props];
        for(var i = 0; i < props.length; i++) removeX(thing,props[i],'props','propsExtra','propsLost'); 
    };
    var addActions = function(thing,actions) {
        if(typeof actions == 'string' || actions instanceof String) actions = [actions];
        for(var i = 0; i < actions.length; i++) addX(thing,actions[i],'actions','actionsExtra','actionsLost'); 
    };
    var removeActions = function(thing,actions) {
        if(typeof actions == 'string' || actions instanceof String) actions = [actions];
        for(var i = 0; i < actions.length; i++) removeX(thing,actions[i],'actions','actionsExtra','actionsLost'); 
    };
    
    var actionList = {}; // t.s = Self, t.t = Target
    actionList[actions.BREAK] = { 
        t: 0, 'do': function(t) { addProps(t.s,props.BROKEN); removeActions(t.s,[actions.BREAK,actions.CUT]); } };
    actionList[actions.TEAR] = { t: 0, 'do': function(t) { addProps(t.s,props.TORN); 
            removeProps(t.s,props.FOLDED); removeActions(t.s,[actions.TEAR,actions.FOLD,actions.UNFOLD]); } };
    actionList[actions.FOLD] = { t: 0, 'do': function(t) { addProps(t.s,props.FOLDED); 
            removeActions(t.s,actions.FOLD); addActions(t.s,actions.UNFOLD); } };
    actionList[actions.UNFOLD] = { t: 0, 'do': function(t) {
            if(t.s.id == 'paper' && hasOneProp(t.s,props.CUT)) { changeThing(t.s,'paperSnowflake'); return; }
            removeProps(t.s,props.FOLDED); removeActions(t.s,actions.UNFOLD); addActions(t.s,actions.FOLD);
        } };
    actionList[actions.CUT] = { t: 1, 'do': function(t) { 
            if(hasOneProp(t.t,props.CUTTABLE)) { addProps(t.t,props.CUT); removeActions(t.t,[actions.TEAR,actions.FOLD]); } 
            else { addProps(t.t,props.SCRATCHED); }
        } };
    actionList[actions.SWING] = { t: 1, 'do': function(t) {
            if(hasOneProp(t.t,props.FRAGILE) && !hasOneProp(t.t,[props.SMASHED,props.BROKEN])) { 
                if(hasOneProp(t.t,props.SOFT)) { addProps(t.t,props.SMASHED); } else { addProps(t.t,props.BROKEN); } } 
        } };
    actionList[actions.PEEL] = { t: 0, 'do': function(t) {
            removeActions(t.s,actions.PEEL); addProps(t.s,props.PEELED); t.c = createChild(t.s,'bananaPeel',1);
        } };
    actionList[actions.WRITE] = { t: 1, 'do': function(t) {
            if(hasOneProp(t.t,props.PENCIL_WORKS)) { addProps(t.t,props.WRITTEN_ON); } // TODO: Writing messages
        } };
    
    var thingsArray = [];
    
    var totalCommon = function() {
        var total = 0;
        for(var key in THINGS) { if(!THINGS.hasOwnProperty(key)) continue;
            total += THINGS[key].common;
            THINGS[key].key = key;
            thingsArray.push(THINGS[key]);
        }
        return total;
    }();
    
    var spawnThing = function(sx,sy,x,y) {
        Math.seedrandom('thing'+Util.positionSeed(sx,sy,x,y));
        var target = Util.randomIntRange(1,totalCommon);
        var total = 0;
        for(var i = 0; i < thingsArray.length; i++) {
            total += thingsArray[i].common;
            if(total < target) continue;
            var newThing = angular.copy(thingsArray[i]);
            newThing.sx = sx; newThing.sy = sy; newThing.x = x; newThing.y = y; 
            newThing.guid = Util.positionSeed(sx,sy,x,y);
            return newThing;
        }
    };
    
    return {
        spawnThing: spawnThing, changeThing: changeThing,
        expandThings: function(th) {
            if(!th || th.length == 0) return [];
            th = angular.copy(th);
            for(var i = 0; i < th.length; i++) {
                var guid = th[i].split(':')[0].split('-')[0];
                var propsExtra = th[i].split(':')[1];
                propsExtra = propsExtra ? propsExtra.split(',') : propsExtra;
                var actionsExtra = th[i].split(':')[2];
                actionsExtra = actionsExtra ? actionsExtra.split(',') : actionsExtra;
                var propsLost = th[i].split(':')[3];
                propsLost = propsLost ? propsLost.split(',') : propsLost;
                var actionsLost = th[i].split(':')[4];
                actionsLost = actionsLost ? actionsLost.split(',') : actionsLost;
                var changedTo = th[i].split(':')[5];
                var pos = Util.positionFromSeed(guid);
                var child = th[i].split(':')[0].split('-');
                th[i] = spawnThing(pos.sx,pos.sy,pos.x,pos.y);
                if(child.length > 1) th[i] = createChild(th[i],child[1],child[2]);
                if(changedTo) changeThing(th[i],changedTo);
                if(propsExtra) th[i].propsExtra = propsExtra;
                if(actionsExtra) th[i].actionsExtra = actionsExtra;
                if(propsLost) th[i].propsLost = propsLost;
                if(actionsLost) th[i].actionsLost = actionsLost;
            }
            return th;
        },
        shrinkThings: function(th) {
            if(!th || th.length == 0) return [];
            th = angular.copy(th);
            for(var i = 0; i < th.length; i++) {
                var guidExtra = th[i].guid + ':';
                if(th[i].propsExtra) {
                    for(var m = 0; m < th[i].propsExtra.length; m++) {
                        guidExtra += m == th[i].propsExtra.length - 1 ? 
                            th[i].propsExtra[m] : th[i].propsExtra[m] + ',';
                    }
                }
                guidExtra += ':';
                if(th[i].actionsExtra) {
                    for(var n = 0; n < th[i].actionsExtra.length; n++) {
                        guidExtra += n == th[i].actionsExtra.length - 1 ?
                            th[i].actionsExtra[n] : th[i].actionsExtra[n] + ',';
                    }
                }
                guidExtra += ':';
                if(th[i].propsLost) {
                    for(var o = 0; o < th[i].propsLost.length; o++) {
                        guidExtra += o == th[i].propsLost.length - 1 ?
                            th[i].propsLost[o] : th[i].propsLost[o] + ',';
                    }
                }
                guidExtra += ':';
                if(th[i].actionsLost) {
                    for(var p = 0; p < th[i].actionsLost.length; p++) {
                        guidExtra += p == th[i].actionsLost.length - 1 ?
                            th[i].actionsLost[p] : th[i].actionsLost[p] + ',';
                    }
                }
                guidExtra += th[i].changedFrom ? ':'+th[i].id : ':';
                th[i] = guidExtra;
            }
            return th;
        },
        targetsRequired: function(a) { return actionList[a].t; },
        doAction: function(t,a) {
            var allActions = Util.subtractArrays((t.s.actions || []).concat(t.s.actionsExtra || []), t.s.actionsLost);
            if(jQuery.inArray(a, allActions) < 0) { return false; } // Object doesn't have this action
            if((actionList[a].t == 1 && t.hasOwnProperty('t')) || 
                (actionList[a].t == 0)) {
                actionList[a].do(t); return true;
            }
        },
        createChild: createChild
    };
});