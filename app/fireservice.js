'use strict';
Application.Services.factory('FireService',function() {
    var fireRef = new Firebase('https://mym897.firebaseio.com/map1');

    var localTimeOffset = 0;
    var getServerTime = function() {
        return localTimeOffset ? new Date().getTime() + localTimeOffset : new Date().getTime();
    };
    var writesPer5Sec = 0;
    setInterval(function(){
        if(writesPer5Sec > 200) { alert("Too many firebase writes! ("+writesPer5Sec+")"); fireRef = null; }
        writesPer5Sec = 0;
    },5000);
    
    return {
        set: function(path, value) { fireRef.child(path).set(value); writesPer5Sec++; },
        remove: function(path) {
            if(path.constructor !== Array) path = [path];
            for(var i = 0; i < path.length; i++) {
                fireRef.child(path[i]).remove(); writesPer5Sec++;
            }
        },
        update: function(path, properties) { fireRef.child(path).update(properties); writesPer5Sec++; },
        push: function(path, value) { fireRef.child(path).push(value); writesPer5Sec++; },
        transact: function(path, amount) { 
            writesPer5Sec++;
            fireRef.child(path).transaction(function(orig) {
                return !orig ? +amount : +orig + +amount == 0 ? null : +orig + +amount
            });
        },
        once: function(path, callback) {
            fireRef.child(path).once('value', function(snap) { callback(snap.val()); });
        },
        onValue: function(path, handler) {
            fireRef.child(path).on('value',function(snap) { handler(snap.val()); });
        },
        onAddChild: function(path, handler) {
            fireRef.child(path).on('child_added',function(snap) { handler(snap.val(),snap.key()); });
        },
        onRemoveChild: function(path, handler) {
            fireRef.child(path).on('child_removed',function(snap) { handler(snap.val(),snap.key()); });
        },
        off: function(path) {
            if(path.constructor !== Array) path = [path];
            for(var i = 0; i < path.length; i++) fireRef.child(path[i]).off();
        },
        sendEvent: function(user,text) {
            if(!user || !text) return;
            fireRef.child('eventLog').push({ user: user, text: text, time: getServerTime() });
        },
        removeOnQuit: function(path) {
            fireRef.child(path).onDisconnect().remove();
        },
        setGlobal: function(path,value) { fireRef.parent().child(path).set(value); },
        onceGlobal: function(path, callback) {
            fireRef.parent().child(path).once('value', function(snap) { callback(snap.val()); });
        },
        onGlobal: function(path, handler) {
            fireRef.parent().child(path).on('value',function(snap) { handler(snap.val()); });
        },
        initServerTime: function(callback) {
            var localTimeRef = new Date().getTime();
            var timeStampID = 'stamp'+Math.floor(Math.random()*10000);
            fireRef.child('timeStampTests/'+timeStampID).set(Firebase.ServerValue.TIMESTAMP,function(){
                fireRef.child('timeStampTests/'+timeStampID).once('value',function(snap){
                    localTimeOffset = snap.val() - localTimeRef;
                    callback(localTimeOffset);
                    fireRef.child('timeStampTests/'+timeStampID).remove();
                    //setInterval(interval,500);
                })
            });
        },
        ref: fireRef, getServerTime: getServerTime
    };
});