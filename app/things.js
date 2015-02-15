'use strict';
Application.Services.factory('Things',function(Util) {
    
    var SIZE = { MICRO: 1, TINY: 2, SMALL: 3, MEDIUM: 4, LARGE: 5, HUGE: 6 };
    
    var things = {
        pencil: { name: 'Pencil', size: SIZE.TINY, common: 100,
            desc: 'A fine writing utensil.', actions: ['break'], 
            props: ['hard','sharp'] },
        paper: { name: 'Paper', size: SIZE.TINY, common: 200,
            desc: 'Flat, white, rectangular, flimsy.', actions: ['tear','fold'], 
            props: ['flat','cuttable'] },
        rock: { name: 'Rock', size: SIZE.SMALL, common: 150, 
            desc: 'About the size of your fist, it could do some damage.', 
            props: ['hard'] },
        scissors: { name: 'Scissors', size: SIZE.SMALL, common: 40,
            desc: 'One pair of one scissors.', actions: ['break','cut'], 
            props: ['hard','sharp'] },
        paperSnowflake: { name: 'Paper Snowflake', size: SIZE.TINY, common: 1,
            desc: 'Did a grade schooler make this?', actions: ['tear'],
            props: ['flat','cuttable'] }
    };
    
    for(var tKey in things) { if(!things.hasOwnProperty(tKey)) { continue; } things[tKey].id = tKey; } // Assign IDs
    
    var changeThing = function(thing,changeTo) {
        var newThing = angular.copy(things[changeTo]);
        thing.changedFrom = thing.id;
        thing.id = newThing.id; thing.name = newThing.name; thing.size = newThing.size; thing.common = newThing.common;
        thing.desc = newThing.desc; thing.actions = newThing.actions; thing.props = newThing.props;
        delete thing.propsExtra; delete thing.propsLost; delete thing.actionsExtra; delete thing.actionsLost;
    };
    
    var changeThingTest = function(thing,changeTo) {
        delete thing.propsExtra; delete things.propsLost; delete things.actionsExtra; delete things.actionsLost;
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
        if(thing[lost].length == 0) delete things[lost];
        if(thing[extra].length == 0) delete things[extra];
    };

    var removeX = function(thing,x,stock,extra,lost) {
        thing[lost] = thing[lost] || [];
        thing[extra] = thing[extra] || [];
        if(jQuery.inArray(x,thing[extra]) >= 0) thing[extra].splice(jQuery.inArray(x,thing[extra]),1);
        if(jQuery.inArray(x,thing[lost]) < 0 &&
            jQuery.inArray(x,thing[stock]) >= 0) thing[lost].push(x);
        if(thing[lost].length == 0) delete things[lost];
        if(thing[extra].length == 0) delete things[extra];
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
    
    var actions = { // t.s = Self, t.t = Target
        'break': { t: 0, do: function(t) { addProps(t.s,'broken'); removeActions(t.s,['break','cut']); } },
        'tear': { t: 0, do: function(t) { addProps(t.s,'torn'); 
            removeProps(t.s,'folded'); removeActions(t.s,['tear','fold','unfold']); } },
        'fold': { t: 0, do: function(t) { addProps(t.s,'folded'); 
            removeActions(t.s,'fold'); addActions(t.s,'unfold'); } },
        'unfold': { t: 0, do: function(t) {
            if(t.s.id == 'paper' && hasOneProp(t.s,'cut')) { changeThing(t.s,'paperSnowflake'); return; }
            removeProps(t.s,'folded'); removeActions(t.s,'unfold'); addActions(t.s,'fold');
        } },
        'cut': { t: 1, do: function(t) { 
            if(hasOneProp(t.t,'cuttable')) {
                if(hasOneProp(t.t,['flat','thin'])) { addProps(t.t,'cut'); removeActions(t.t,['tear','fold']) } 
                else addProps(t.t,'scarred');
            } else { addProps(t.t,'scratched'); }
        } }
    };
    
    var thingsArray = [];
    
    var totalCommon = function() {
        var total = 0;
        for(var key in things) { if(!things.hasOwnProperty(key)) continue;
            total += things[key].common;
            things[key].key = key;
            thingsArray.push(things[key]);
        }
        return total;
    }();
    
    var spawnThing = function(x,y) {
        Math.seedrandom('thing'+Util.positionSeed(x,y));
        var target = Util.randomIntRange(1,totalCommon);
        var total = 0;
        for(var i = 0; i < thingsArray.length; i++) {
            total += thingsArray[i].common;
            if(total < target) continue;
            var newThing = angular.copy(thingsArray[i]);
            newThing.x = x; newThing.y = y; newThing.guid = Util.positionSeed(x,y)/*+':'+(guid++)*/;
            return newThing;
        }
    };
    
    return {
        spawnThing: spawnThing, changeThing: changeThing,
        expandThings: function(th) {
            if(!th || th.length == 0) return [];
            th = angular.copy(th);
            for(var i = 0; i < th.length; i++) {
                var guid = th[i].split(':')[0];
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
                th[i] = spawnThing(pos.x,pos.y);
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
                if(th[i].hasOwnProperty('propsExtra')) {
                    for(var m = 0; m < th[i].propsExtra.length; m++) {
                        guidExtra += m == th[i].propsExtra.length - 1 ? 
                            th[i].propsExtra[m] : th[i].propsExtra[m] + ',';
                    }
                }
                guidExtra += ':';
                if(th[i].hasOwnProperty('actionsExtra')) {
                    for(var n = 0; n < th[i].actionsExtra.length; n++) {
                        guidExtra += n == th[i].actionsExtra.length - 1 ?
                            th[i].actionsExtra[n] : th[i].actionsExtra[n] + ',';
                    }
                }
                guidExtra += ':';
                if(th[i].hasOwnProperty('propsLost')) {
                    for(var o = 0; o < th[i].propsLost.length; o++) {
                        guidExtra += o == th[i].propsLost.length - 1 ?
                            th[i].propsLost[o] : th[i].propsLost[o] + ',';
                    }
                }
                guidExtra += ':';
                if(th[i].hasOwnProperty('actionsLost')) {
                    for(var p = 0; p < th[i].actionsLost.length; p++) {
                        guidExtra += p == th[i].actionsLost.length - 1 ?
                            th[i].actionsLost[p] : th[i].actionsLost[p] + ',';
                    }
                }
                guidExtra += th[i].hasOwnProperty('changedFrom') ? ':'+th[i].id : ':';
                th[i] = guidExtra;
            }
            return th;
        },
        targetsRequired: function(a) { return actions[a].t; },
        doAction: function(t,a) {
            var allActions = Util.subtractArrays((t.s.actions || []).concat(t.s.actionsExtra || []), t.s.actionsLost);
            if(jQuery.inArray(a, allActions) < 0) { return false; } // Object doesn't have this action
            if((actions[a].t == 1 && t.hasOwnProperty('t')) || 
                (actions[a].t == 0)) { 
                actions[a].do(t); return true;
            }
        }
    };
});