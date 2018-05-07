var config = require('config');
var urlExists = require('url-exists');
var crypto = require('crypto');
var apiHandle = require('./apiHandle');

exports.mappingUser = mappingUser;
exports.getSlackUsers = getSlackUsers;
exports.checkUrl = checkUrl;
exports.returnFistTimeMsg = returnFistTimeMsg;
exports.resolveLater = resolveLater;
exports.genToken = genToken;
exports.genUniqueId = genUniqueId;
exports.log = log;

function log(data) {
    apiHandle.postLogApi(JSON.stringify(data), config.loggingURL, function(err, res, body) {});
}

function genUniqueId() {
    var id = crypto.randomBytes(16).toString("hex");
    return id;
}

function genToken(cryptKey, crpytIv, plainData) {
    var encipher = crypto.createCipheriv('aes-128-cbc', cryptKey, crpytIv),
        encrypted = encipher.update(plainData, 'utf8', 'binary');
    encrypted += encipher.final('binary');
    var tk = new Buffer(encrypted, 'binary').toString('base64');
    return tk;
}

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
            reply.attachments.push(
                {
                    "title": "Processing...",
                    "color": "#ccff00",
                }
            );
        }
    }
    return reply;
}

function checkUrl(url, callback) {
    callback(false);
    // This phase not applied image
    /*
    urlExists(url, function(err, exists) {
        if(err) {
            callback(false);
        } else {
            callback(exists);
        }
    });
    */
}

function mappingUser(type, userId) {
    let userIdFinded;
    switch(type) {
        case config.appType.wf:
            userIdFinded = findUserByWfId(userId)
            break;
        case config.appType.slack:
            userIdFinded = findUserBySlackId(userId)
            break;
    }
    return userIdFinded;
}

function getSlackUsers(appID, wfUserIds) {
    const userIdFounds = [];
    if (wfUserIds) {
        wfUserIds.forEach(id => {
            const wfUserId = findUserByWfId(id);
            if (wfUserId) {
                userIdFounds.push(wfUserId);
            }
        });
    }

    return userIdFounds;
}

function findUserByWfId(userId) {
    var arrayUser = config.mappingUser;
    for(var i = 0; i < arrayUser.length; i++) {
        if(arrayUser[i].wf === userId) {
            return arrayUser[i];
        }
    }
    return null;
}

function findUserBySlackId(userId) {
    var arrayUser = config.mappingUser;
    for(var i = 0; i < arrayUser.length; i++) {
        if(arrayUser[i].slack === userId) {
            return arrayUser[i];
        }
    }
    return null;
}