'use strict';
Application.Services.factory('Things',function(Util) {
    
    var sizes = { MICRO: 1, TINY: 2, SMALL: 3, MEDIUM: 4, LARGE: 5, HUGE: 6 };
    
    var props = {
        BRITTLE:'brittle', BROKEN:'broken', CHEWED:'chewed', CUT:'cut', CUTTABLE:'cuttable', FLAT:'flat', FOLDED:'folded', 
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
            desc: 'A fine writing utensil.', actions: [actions.BREAK,actions.WRITE,actions.ERASE,actions.CHEW], 
            props: [props.HARD,props.SHARP,props.LONG,props.SAWABLE] },
        pen: { name: 'Pen', size: sizes.TINY, common: 350, // TODO: Can't be erased
            desc: 'A finer writing utensil.', actions: [actions.WRITE],
            props: [props.HARD,props.SHARP,props.LONG] },
        paper: { name: 'Paper', size: sizes.TINY, common: 500,
            desc: 'Flat, white, rectangular, flimsy.', actions: [actions.TEAR,actions.FOLD], 
            props: [props.FLAT,props.CUTTABLE,props.PENCIL_WORKS] },
        rock: { name: 'Rock', size: sizes.SMALL, common: 400,
            desc: 'About the size of your fist, it could do some damage.',
            props: [props.HARD] },
        stone: { name: 'Stone', size: sizes.TINY, common: 500,
            desc: 'Smaller than a rock. That\'s it.',
            props: [props.HARD] },
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
            props: [props.FLAT,props.CUTTABLE] },
        banana: { name: 'Banana', size: sizes.SMALL, common: 250,
            desc: 'Just like the monkeys eat!', actions: [actions.PEEL],
            props: [props.CUTTABLE,props.SOFT,props.SAWABLE] },
        bananaPeel: { name: 'Banana Peel', size: sizes.SMALL, common: 250, noSpawn: true,
            desc: 'Watch your step.',
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
        eraser: { name: 'Eraser', size: sizes.TINY, common: 300,
            desc: 'Of the classic pink parallelogram variety.', actions: [actions.ERASE],
            props: [props.HARD,props.CUTTABLE,props.SAWABLE,props.PENCIL_WORKS] },
        coin: { name: 'Coin', size: sizes.TINY, common: 30,
            desc: 'A golden coin embossed with the letters "MYM".',
            props: [props.HARD,props.FLAT] },
        cookie: { name: 'Cookie', size: sizes.TINY, common: 10,
            desc: 'Dotted with chocolate chips. Possibly stale.', actions: [actions.EAT,actions.BREAK],
            props: [props.SOFT,props.FLAT,props.BRITTLE] },
        bubbleWrap: { name: 'Bubble Wrap', size: sizes.MEDIUM, common: 60,
            desc: 'You know what to do.', actions: [actions.POP,actions.FOLD],
            props: [props.CUTTABLE,props.FLAT] },
        mirror: { name: 'Mirror', size: sizes.MEDIUM, common: 80,
            desc: 'A brightly colored circle stares back at you.', actions: [actions.BREAK],
            props: [props.HARD,props.FLAT,props.FRAGILE] },
        saw: { name: 'Saw', size: sizes.MEDIUM, common: 150,
            desc: 'Have you seen this saw?', actions: [actions.CUT],
            props: [props.HARD,props.FLAT,props.LONG] },
        axe: { name: 'Axe', size: sizes.LARGE, common: 200,
            desc: 'You didn\'t axe for this.', actions: [actions.SWING],
            props: [props.HARD,props.THIN,props.LONG,props.SHARP] }
    };
    
    var changeThing = function(thing,changeTo) {
        var newThing = angular.copy(THINGS[changeTo]);
        thing.changedFrom = thing.id;
        thing.id = newThing.id; thing.name = newThing.name; thing.size = newThing.size; thing.common = newThing.common;
        thing.desc = newThing.desc; thing.actions = newThing.actions; thing.props = newThing.props;
        delete thing.propsExtra; delete thing.propsLost; delete thing.actionsExtra; delete thing.actionsLost;
        thing.allProps = createFullPropertyList(newThing);
        thing.allActions = createFullActionList(newThing);
    };
    
    var createChild = function(thing,child,id) {
        var newThing = angular.copy(THINGS[child]);
        newThing.guid = thing.guid+'-'+child+'-'+id;
        newThing.sx = thing.sx; newThing.sy = thing.sy; newThing.x = thing.x; newThing.y = thing.y;
        newThing.allProps = createFullPropertyList(newThing);
        newThing.allActions = createFullActionList(newThing);
        Math.seedrandom('child-quality'+Util.positionSeed(newThing.sx,newThing.sy,newThing.x,newThing.y));
        newThing.quality = Util.randomIntRange(1,1000);
        newThing.value = thingValue(newThing);
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
        var allProps = Util.subtractArrays(t.props.concat(t.propsExtra || []), t.propsLost);
        for(var i = 0; i < props.length; i++) { if(jQuery.inArray(props[i], allProps) < 0) return false; }
        return true;
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

    var createFullActionList = function(thing) { // Create alphabetized array of all actions a thing has
        var allActions = (angular.copy(thing.actions) || []).concat(thing.actionsExtra || []);
        allActions = Util.subtractArrays(allActions,thing.actionsLost || []);
        return allActions.sort();
    };

    var createFullPropertyList = function(thing) { // Create alphabetized array of all properties a thing has
        var allProps = (angular.copy(thing.props) || []).concat(thing.propsExtra || []);
        allProps = Util.subtractArrays(allProps,thing.propsLost || []);
        return allProps.sort();
    };

    var addProps = function(thing,props) {
        if(typeof props == 'string' || props instanceof String) props = [props];
        for(var i = 0; i < props.length; i++) addX(thing,props[i],'props','propsExtra','propsLost');
        thing.allProps = createFullPropertyList(thing);
    };
    var removeProps = function(thing,props) {
        if(typeof props == 'string' || props instanceof String) props = [props];
        for(var i = 0; i < props.length; i++) removeX(thing,props[i],'props','propsExtra','propsLost');
        thing.allProps = createFullPropertyList(thing);
    };
    var addActions = function(thing,actions) {
        if(typeof actions == 'string' || actions instanceof String) actions = [actions];
        for(var i = 0; i < actions.length; i++) addX(thing,actions[i],'actions','actionsExtra','actionsLost');
        thing.allActions = createFullActionList(thing);
    };
    var removeActions = function(thing,actions) {
        if(typeof actions == 'string' || actions instanceof String) actions = [actions];
        for(var i = 0; i < actions.length; i++) removeX(thing,actions[i],'actions','actionsExtra','actionsLost');
        thing.allActions = createFullActionList(thing);
    };
    
    var actionList = {}; // t.s = Self, t.t = Target
    actionList[actions.BREAK] = { t: 0, 'do': function(t) {
        addProps(t.s,props.BROKEN); removeActions(t.s,[actions.BREAK,actions.CUT]); } };
    actionList[actions.TEAR] = { t: 0, 'do': function(t) {
        if(hasOneProp(t.s,props.CUT)) return;
        addProps(t.s,props.TORN);
        removeProps(t.s,props.FOLDED); removeActions(t.s,[actions.TEAR,actions.FOLD,actions.UNFOLD]); } };
    actionList[actions.FOLD] = { t: 0, 'do': function(t) {
        if(hasOneProp(t.s,props.FOLDED)) return;
        addProps(t.s,props.FOLDED); removeActions(t.s,actions.FOLD); addActions(t.s,actions.UNFOLD); } };
    actionList[actions.UNFOLD] = { t: 0, 'do': function(t) {
        removeProps(t.s,props.FOLDED); removeActions(t.s,actions.UNFOLD); addActions(t.s,actions.FOLD);
    } };
    actionList[actions.CUT] = { t: 1, 'do': function(t) {
        if(hasOneProp(t.t,[props.TORN,props.SMASHED])) return;
        if(hasOneProp(t.t,props.BRITTLE)) { addProps(t.t,props.BROKEN); return; }
        if(t.t.id == 'paper' && hasOneProp(t.t,props.FOLDED)) { changeThing(t.s,'paperSnowflake'); return; }
        if(t.s.id != 'saw' && hasOneProp(t.t,props.CUTTABLE) || (t.s.id == 'saw' && hasOneProp(t.t,props.SAWABLE))) { 
            addProps(t.t,props.CUT); removeProps(t.t,[props.SAWABLE,props.CUTTABLE,props.FOLDED]);
            removeActions(t.t,[actions.TEAR,actions.FOLD,actions.BREAK]); }
        else { addProps(t.t,props.SCRATCHED); }
    } };
    actionList[actions.SWING] = { t: 1, 'do': function(t) { // TODO: Add durability to determine if item breaks
        if(t.t.id == 'bubbleWrap') { addProps(t.t,props.POPPED); }
        if(hasOneProp(t.t,[props.FRAGILE,props.SOFT]) && !hasOneProp(t.t,[props.SMASHED,props.BROKEN,props.CUT])) { 
            if(hasOneProp(t.t,props.SOFT)) { addProps(t.t,props.SMASHED); } else { addProps(t.t,props.BROKEN); }
            removeProps(t.t,props.CUTTABLE,props.SAWABLE);
        } 
    } };
    actionList[actions.PEEL] = { t: 0, 'do': function(t) {
        removeActions(t.s,actions.PEEL); addActions(t.s,actions.EAT); addProps(t.s,props.PEELED); 
        t.c = createChild(t.s,'bananaPeel',1);
    } };
    actionList[actions.WRITE] = { t: 1, 'do': function(t) {
        if(hasOneProp(t.t,props.PENCIL_WORKS)) { addProps(t.t,props.WRITTEN_ON); } // TODO: Writing messages
    } };
    actionList[actions.CHEW] = { t: 0, 'do': function(t) { addProps(t.s,props.CHEWED); } };
    actionList[actions.ERASE] = { t: 1, 'do': function(t) { removeProps(t.t,props.WRITTEN_ON); } };
    actionList[actions.POP] = { t: 0, 'do': function(t) { addProps(t.s,props.POPPED); } };
    actionList[actions.EAT] = { t: 0, 'do': function(t) { t.r = t.s } };
    
    var thingsArray = [];
    
    var totalCommon = function() { // Self-executing function
        var total = 0;
        for(var key in THINGS) { if(!THINGS.hasOwnProperty(key)) continue;
            THINGS[key].id = key;
            if(THINGS[key].noSpawn) continue;
            thingsArray.push(THINGS[key]);
            total += THINGS[key].common;
        }
        return total;
    }();
    
    var spawnThing = function(params) {
        var seed = params.hasOwnProperty('sx') ? Util.positionSeed(params.sx,params.sy,params.x,params.y) : params.seed;
        Math.seedrandom('thing'+seed);
        var newThing;
        if(params.anyItem) { // Don't apply weighting to choice of item
            newThing = angular.copy(THINGS[Util.pickInObject(THINGS)]);
        } else { // Choose item with weighting
            var target = Util.randomIntRange(1,totalCommon);
            var total = 0;
            for(var i = 0; i < thingsArray.length; i++) {
                total += thingsArray[i].common;
                if(total < target) continue;
                newThing = angular.copy(thingsArray[i]);
                break;
            }
        }
        newThing.sx = params.sx || 0; newThing.sy = params.sy || 0;
        newThing.x = params.x || 0; newThing.y = params.y || 0;
        newThing.guid = 't'+seed;
        newThing.allProps = createFullPropertyList(newThing);
        newThing.allActions = createFullActionList(newThing);
        newThing.quality = Util.randomIntRange(1, params.containerValue ? 1000 : Util.randomIntRange(500,1000));
        newThing.quality = params.containerValue ? 
            parseInt(newThing.quality + (1001 - newThing.quality) * params.containerValue/45000) : newThing.quality;
        newThing.value = thingValue(newThing);
        return newThing;
    };
    
    var thingValue = function(thing) {
        return (1000 - THINGS[thing.id].common) * thing.quality / 1000;
    };
    
    return {
        spawnThing: spawnThing, changeThing: changeThing,
        expandThings: function(th) {
            if(!th || th.length == 0) return [];
            th = angular.copy(th);
            for(var i = 0; i < th.length; i++) {
                var t = th[i];
                var guid = t.g;
                var quality = +t.q;
                var sx = +t.sx, sy = +t.sy, x = +t.x, y = +t.y;
                var propsExtra = t.pe, actionsExtra = t.ae, propsLost = t.pl, actionsLost = t.al;
                var changedTo = t.ct;
                var pos = Util.positionFromSeed(guid);
                var params = {sx:pos.sx,sy:pos.sy,x:pos.x,y:pos.y};
                if(guid[1] == 'c') { // If thing from container
                    var containerGUID = guid.split('t')[1].split('|')[0];
                    var contentIndex = guid[guid.length-1];
                    params = {seed:containerGUID+'|'+contentIndex, anyItem:true};
                }
                t = spawnThing(params);
                var child = guid.split('-');
                if(child.length > 1) t = createChild(t,child[1],child[2]);
                t.sx = sx; t.sy = sy; t.x = x; t.y = y;
                if(changedTo) changeThing(t,changedTo);
                if(propsExtra) t.propsExtra = propsExtra;
                if(actionsExtra) t.actionsExtra = actionsExtra;
                if(propsLost) t.propsLost = propsLost;
                if(actionsLost) t.actionsLost = actionsLost;
                if(quality) t.quality = +quality;
                t.allProps = createFullPropertyList(t);
                t.allActions = createFullActionList(t);
                th[i] = t;
            }
            return th;
        },
        shrinkThings: function(th) {
            if(!th || th.length == 0) return [];
            th = angular.copy(th);
            for(var i = 0; i < th.length; i++) {
                var storedThing = {
                    sx: th[i].sx, sy: th[i].sy, x: th[i].x, y: th[i].y, g: th[i].guid,
                    pe: th[i].propsExtra, ae: th[i].actionsExtra, pl: th[i].propsLost, al: th[i].actionsLost,
                    ct: th[i].changedFrom ? th[i].id : null, q: th[i].guid[1] == 'c' ? th[i].quality : null
                };
                for(var sk in storedThing) { if(!storedThing.hasOwnProperty(sk)) continue;
                    if(storedThing[sk] === null || storedThing[sk] === undefined) delete storedThing[sk];
                }
                th[i] = storedThing;
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
            var allThings = Util.propertyNamesToArray(THINGS);
            var allProps = Util.propertyNamesToArray(props);
            var triedProps = [];
            var target = { name: Util.pickInArray(allThings) };
            var triedThings = [target.name];
            var fail = 0;
            while(fail < 500) {
                var availableProps = Util.subtractArrays(allProps,triedProps);
                if(availableProps.length == 0) { // No more properties to try
                    triedProps = [];
                    availableProps = allProps;
                    var availableThings = Util.subtractArrays(allThings,triedThings);
                    var pickedThing = Util.pickInArray(availableThings);
                    triedThings.push(pickedThing);
                    target = { name: pickedThing };
                }
                var pickedProp = Util.pickInArray(availableProps);
                triedProps.push(pickedProp);
                target.property = props[pickedProp];
                // Check if thing already has this property
                while(hasOneProp(THINGS[target.name],[target.property])) {
                    target.property = props[Util.pickInObject(props)];
                }
                // Perform all actions on/with object to see if this property is attainable
                for(var key in actionList) { if(!actionList.hasOwnProperty(key)) continue;
                    var targetThing = angular.copy(THINGS[target.name]);
                    // Skip if this object can't perform this self-action
                    if(actionList[key].t == 0 && jQuery.inArray(key, targetThing.actions || []) < 0) {
                        continue;
                    }
                    var t = { t: targetThing, s: targetThing };
                    actionList[key].do(t);
                    if(hasOneProp(targetThing,[target.property])) {
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
                fail++;
            }
            target.properName = THINGS[target.name].name;
            return target;
        },
        createChild: createChild, createFullActionList: createFullActionList, createFullPropertyList: createFullPropertyList
    };
});