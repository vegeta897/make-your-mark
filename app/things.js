'use strict';
Application.Services.factory('Things',function(Util) {
    
    var sizes = { MICRO: 1, TINY: 2, SMALL: 3, MEDIUM: 4, LARGE: 5, HUGE: 6 };
    
    var props = {
        BROKEN:'broken', CHEWED:'chewed', CUT:'cut', CUTTABLE:'cuttable', FLAT:'flat', FOLDED:'folded', 
        FRAGILE:'fragile', HARD:'hard', LONG:'long', PEELED:'peeled', PENCIL_WORKS:'pencil-works', POPPED:'popped',
        SAWABLE:'sawable', SCRATCHED:'scratched', SHARP:'sharp', SMASHED:'smashed', SOFT:'soft', THIN:'thin', 
        TORN:'torn', WRITTEN_ON:'written-on'
    };
    // TODO: Maybe have properties alone dictate what actions can be performed, eg. scissors have "cutting-device"
    var actions = {
        BREAK:'break', CHEW:'chew', CUT:'cut', EAT:'eat', ERASE:'erase', FOLD:'fold', PEEL:'peel', POP:'pop',
        SWING:'swing', TEAR:'tear', UNFOLD:'unfold', WRITE:'write'
    };
    
    var THINGS = {
        pencil: { name: 'Pencil', size: sizes.TINY, common: 500,
            desc: 'A fine writing utensil.', actions: [actions.BREAK,actions.WRITE], 
            props: [props.HARD,props.SHARP,props.LONG,props.SAWABLE] },
        pen: { name: 'Pen', size: sizes.TINY, common: 350, // TODO: Can't be erased
            desc: 'A finer writing utensil.', actions: [actions.WRITE],
            props: [props.HARD,props.SHARP,props.LONG] },
        paper: { name: 'Paper', size: sizes.TINY, common: 500,
            desc: 'Flat, white, rectangular, flimsy.', actions: [actions.TEAR,actions.FOLD], 
            props: [props.FLAT,props.CUTTABLE,props.PENCIL_WORKS] },
        rock: { name: 'Rock', size: sizes.SMALL, common: 400,
            desc: 'About the size of your fist, it could do some damage.',
            props: [props.HARD,props.PENCIL_WORKS] },
        stone: { name: 'Stone', size: sizes.TINY, common: 500,
            desc: 'Smaller than a rock. That\'s it.',
            props: [props.HARD,props.PENCIL_WORKS] },
        shovel: { name: 'Shovel', size: sizes.LARGE, common: 200,
            desc: 'Great for digging holes.', actions: [actions.SWING],
            props: [props.HARD,props.THIN,props.LONG,props.SAWABLE] },
        hammer: { name: 'Hammer', size: sizes.MEDIUM, common: 250,
            desc: 'THWACK!', actions: [actions.SWING],
            props: [props.HARD,props.THIN,props.LONG,props.SAWABLE] },
        scissors: { name: 'Scissors', size: sizes.SMALL, common: 400,
            desc: 'One pair of one scissors.', actions: [actions.BREAK,actions.CUT], 
            props: [props.HARD,props.SHARP] },
        paperSnowflake: { name: 'Paper Snowflake', size: sizes.TINY, common: 1,
            desc: 'Did a grade schooler make this?', actions: [actions.TEAR],
            props: [props.FLAT,props.CUTTABLE,props.PENCIL_WORKS] },
        banana: { name: 'Banana', size: sizes.SMALL, common: 250,
            desc: 'Just like the monkeys eat!', actions: [actions.PEEL,actions.CHEW],
            props: [props.CUTTABLE,props.SOFT,props.SAWABLE] },
        bananaPeel: { name: 'Banana Peel', size: sizes.SMALL, common: 10,
            desc: 'Watch your step.', actions: [actions.CHEW],
            props: [props.CUTTABLE,props.SOFT] },
        guitar: { name: 'Guitar', size: sizes.LARGE, common: 30,
            desc: '6-string acoustic.', actions: [actions.BREAK],
            props: [props.HARD,props.LONG,props.PENCIL_WORKS,props.SAWABLE] },
        stick: { name: 'Stick', size: sizes.MEDIUM, common: 450,
            desc: 'Like from a tree!', actions: [actions.BREAK],
            props: [props.HARD,props.LONG,props.THIN,props.CUTTABLE,props.SAWABLE] },
        television: { name: 'Television', size: sizes.LARGE, common: 30,
            desc: 'Not HD.',
            props: [props.HARD,props.FRAGILE] },
        cellphone: { name: 'Cellphone', size: sizes.SMALL, common: 200,
            desc: 'Or "mobile phone" if you\'re across the pond.',
            props: [props.HARD,props.FRAGILE] },
        chewingGum: { name: 'Gum', size: sizes.TINY, common: 100,
            desc: 'Spearmint chewing gum to freshen your breath.', actions: [actions.CHEW],
            props: [props.SOFT,props.CUTTABLE,props.FLAT] },
        saw: { name: 'Saw', size: sizes.MEDIUM, common: 150,
            desc: 'Have you seen this saw?', actions: [actions.CUT],
            props: [props.HARD,props.FLAT,props.LONG] },
        eraser: { name: 'Eraser', size: sizes.TINY, common: 300,
            desc: 'Of classic pink parallelogram variety.', actions: [actions.ERASE],
            props: [props.HARD,props.CUTTABLE,props.SAWABLE,props.PENCIL_WORKS] },
        bubbleWrap: { name: 'Bubble Wrap', size: sizes.MEDIUM, common: 30,
            desc: 'You know what to do.', actions: [actions.POP,actions.FOLD],
            props: [props.CUTTABLE,props.FLAT] },
        mirror: { name: 'Mirror', size: sizes.MEDIUM, common: 80,
            desc: 'A brightly colored circle stares back at you.', actions: [actions.BREAK],
            props: [props.HARD,props.FLAT] },
        axe: { name: 'Axe', size: sizes.LARGE, common: 200,
            desc: 'You didn\'t axe for this.', actions: [actions.SWING],
            props: [props.HARD,props.THIN,props.LONG,props.SAWABLE,props.SHARP] },
        coin: { name: 'Coin', size: sizes.TINY, common: 30,
            desc: 'A golden coin embossed with the letters "MYM".',
            props: [props.HARD,props.FLAT] },
        cookie: { name: 'Cookie', size: sizes.TINY, common: 10,
            desc: 'Dotted with chocolate chips. Possibly stale.', actions: [actions.EAT],
            props: [props.SOFT,props.FLAT] }
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
    actionList[actions.BREAK] = { t: 0, 'do': function(t) { 
        addProps(t.s,props.BROKEN); removeActions(t.s,[actions.BREAK,actions.CUT]); } };
    actionList[actions.TEAR] = { t: 0, 'do': function(t) { addProps(t.s,props.TORN); 
        removeProps(t.s,props.FOLDED); removeActions(t.s,[actions.TEAR,actions.FOLD,actions.UNFOLD]); } };
    actionList[actions.FOLD] = { t: 0, 'do': function(t) { addProps(t.s,props.FOLDED); 
        removeActions(t.s,actions.FOLD); addActions(t.s,actions.UNFOLD); } };
    actionList[actions.UNFOLD] = { t: 0, 'do': function(t) {
        if(t.s.id == 'paper' && hasOneProp(t.s,props.CUT)) { changeThing(t.s,'paperSnowflake'); return; }
        removeProps(t.s,props.FOLDED); removeActions(t.s,actions.UNFOLD); addActions(t.s,actions.FOLD);
    } };
    actionList[actions.CUT] = { t: 1, 'do': function(t) { 
        if(t.s.id != 'saw' && hasOneProp(t.t,props.CUTTABLE) || (t.s.id == 'saw' && hasOneProp(t.t,props.SAWABLE))) { 
            addProps(t.t,props.CUT); removeActions(t.t,[actions.TEAR,actions.FOLD]); } 
        else { addProps(t.t,props.SCRATCHED); }
    } };
    actionList[actions.SWING] = { t: 1, 'do': function(t) { // TODO: Add durability to determine if item breaks
        if(t.t.id == 'bubbleWrap') { addProps(t.t,props.POPPED); }
        if(hasOneProp(t.t,[props.FRAGILE,props.SOFT]) && !hasOneProp(t.t,[props.SMASHED,props.BROKEN])) { 
            if(hasOneProp(t.t,props.SOFT)) { addProps(t.t,props.SMASHED); } else { addProps(t.t,props.BROKEN); } } 
    } };
    actionList[actions.PEEL] = { t: 0, 'do': function(t) {
        removeActions(t.s,actions.PEEL); addActions(t.s,actions.EAT); addProps(t.s,props.PEELED); 
        t.c = createChild(t.s,'bananaPeel',1);
    } };
    actionList[actions.WRITE] = { t: 1, 'do': function(t) {
        if(hasOneProp(t.t,props.PENCIL_WORKS)) { addProps(t.t,props.WRITTEN_ON); } // TODO: Writing messages
    } };
    actionList[actions.CHEW] = { t: 0, 'do': function(t) { addProps(t.t,props.CHEWED); } };
    actionList[actions.ERASE] = { t: 1, 'do': function(t) { removeProps(t.t,props.WRITTEN_ON); } };
    actionList[actions.POP] = { t: 0, 'do': function(t) { addProps(t.s,props.POPPED); } };
    actionList[actions.EAT] = { t: 0, 'do': function(t) { t.r = t.s } };
    
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
            var allActions = Util.subtractArrays((t.s.actions || []).concat(t.s.actionsExtra || []), 
                t.s.actionsLost || []);
            if(jQuery.inArray(a, allActions) < 0) { return false; } // Object doesn't have this action
            if((actionList[a].t == 1 && t.hasOwnProperty('t')) || 
                (actionList[a].t == 0)) {
                actionList[a].do(t); return true;
            }
        },
        newSeek: function() { // Pick a random thing with a random property
            var beganAt = performance.now();
            Math.seedrandom();
            console.log('beginning seek pick at:',beganAt);
            var allThings = Util.propertyNamesToArray(THINGS);
            var allProps = Util.propertyNamesToArray(props);
            var triedProps = [];
            var target = { name: Util.pickInArray(allThings) };
            var triedThings = [target.name];
            console.log('picked',[target.name],'- beginning property selection');
            var fail = 0;
            while(fail < 500) {
                var availableProps = Util.subtractArrays(allProps,triedProps);
                console.log('available properties in pool:',availableProps);
                if(availableProps.length == 0) { // No more properties to try
                    triedProps = [];
                    availableProps = allProps;
                    var availableThings = Util.subtractArrays(allThings,triedThings);
                    var pickedThing = Util.pickInArray(availableThings);
                    triedThings.push(pickedThing);
                    target = { name: pickedThing };
                    console.log('tried objects:',triedThings);
                    console.log('all properties tried, picking new object:',[target.name]);
                }
                var pickedProp = Util.pickInArray(availableProps);
                triedProps.push(pickedProp);
                target.property = props[pickedProp];
                console.log('picked',[target.property],'- beginning property checks');
                console.log('valid property test #'+(fail+1));
                // Check if thing already has this property
                while(hasOneProp(THINGS[target.name],[target.property])) {
                    target.property = props[Util.pickInObject(props)];
                    console.log('object already has this property, trying',[target.property]);
                }
                console.log('object does not already have this property, beginning action tests');
                // Perform all actions on/with object to see if this property is attainable
                for(var key in actionList) { if(!actionList.hasOwnProperty(key)) continue;
                    var targetThing = angular.copy(THINGS[target.name]);
                    // Skip if this object can't perform this self-action
                    if(actionList[key].t == 0 && jQuery.inArray(key, targetThing.actions || []) < 0) {
                        continue;
                    }
                    var t = { t: targetThing, s: targetThing };
                    console.log('performing action:',[key]);
                    actionList[key].do(t);
                    if(hasOneProp(targetThing,[target.property])) {
                        console.log('property attained in first iteration');
                        console.log('total time spent:',beganAt-performance.now());
                        target.properName = THINGS[target.name].name;
                        return target;
                    }
                    // Secondary actions do not seem to be necessary yet
                    //console.log('primary action not sufficient, trying secondary');
                    //// If thing doesn't have property after this action, try another iteration
                    //for(var key2 in actionList) { if(!actionList.hasOwnProperty(key2)) continue;
                    //    console.log('testing secondary action:',[key2]);
                    //    var targetThing2 = angular.copy(targetThing);
                    //    // Skip if this object can't perform this self-action
                    //    console.log('actions:',targetThing2.actions);
                    //    var allActions = Util.subtractArrays((targetThing2.actions || [])
                    //            .concat(targetThing2.actionsExtra || []), targetThing2.actionsLost || []);
                    //    console.log('all actions:',allActions);
                    //    if(actionList[key2].t == 0 && jQuery.inArray(key2, allActions) < 0) {
                    //        console.log('object doesn\'t have this self-action');
                    //        continue;
                    //    }
                    //    var t2 = { t: targetThing2, s: targetThing2 };
                    //    console.log('performing second action:',[key2]);
                    //    actionList[key2].do(t2);
                    //    if(hasOneProp(targetThing2,[target.property])) {
                    //        console.log('property attained in second iteration');
                    //        console.log('total time spent:',beganAt-performance.now());
                    //        return target;
                    //    }
                    //    console.log('secondary action not sufficient, trying another');
                    //}
                    //console.log('primary and secondary actions failed, trying another primary');
                }
                console.log('all actions tried, picking new property');
                fail++;
            }
            console.log('failed to pick suitable object+property in 500 tries');
            console.log('total time spent:',beganAt-performance.now());
            target.properName = THINGS[target.name].name;
            return target;
        },
        createChild: createChild
    };
});