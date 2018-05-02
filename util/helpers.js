var config = require('config');
var urlExists = require('url-exists');

exports.mappingUser = mappingUser;
exports.checkUrl = checkUrl;
exports.returnFistTimeMsg = returnFistTimeMsg;
exports.resolveLater = resolveLater;

// Create a Promise that resolves after a full turn of the event loop
// Used since Promise.resolve() will resolve too early
function resolveLater(ms = 0) {
    return new Promise((resolve) => setTimeout(() => resolve(), ms));
}

function returnFistTimeMsg(payload) {
    const reply = payload.original_message;
    for(var i = 0; i < reply.attachments.length; i++) {
        if(reply.attachments[i].callback_id) {
            delete reply.attachments[i];
        }
    }
    return reply;
}

function checkUrl(url, callback) {
    urlExists(url, function(err, exists) {
        if(err) {
            callback(false);
        } else {
            callback(exists);
        }
    });
}

function mappingUser(appReq, userIdApprove) {
    let userIdFinded;
    switch(appReq) {
        case config.appType.wf:
            userIdFinded = findUserWf(userIdApprove)
            break;
    }
    return userIdFinded;
}

function findUserWf(userIdApprove) {
    var arrayUser = config.mappingUser;
    for(var i = 0; i < arrayUser.length; i++) {
        if(arrayUser[i].wf === userIdApprove) {
            return arrayUser[i];
        }
    }
    return null;
}