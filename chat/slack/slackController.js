var config = require('config'),
    async = require('async'),
    apiHandle = require('./../../util/apiHandle'),
    helpers = require('./../../util/helpers'),
    genMsg = require('./../../util/genMsg');

exports.sendMsgWithAttach = sendMsgWithAttach;
exports.sendMsg = sendMsg;
exports.init = init;
exports.checkBot = checkBot;
exports.actionApprove = actionApprove;
exports.handleReviceMsg = handleReviceMsg;

let webClient = null;
let rtmClient = null;
let bot = null;

function init(web, rtm) {
    webClient = web;
    rtmClient = rtm;
}

function handleReviceMsg(message) {
    if (message.type === 'message' && message.text) {
        if(bot.id !== message.user) {
            var charMapping = '<@' + bot.id + '>';
            var index = message.text.indexOf(charMapping);
            if (index !== -1) {
                var cmd = message.text.substring(index + charMapping.length);
                console.log(cmd);
                if (cmd.substring(0, 1) === ' ') {
                    console.log('cat');
                    cmd = cmd.substring(1);
                }
                switch(cmd.toLowerCase()) {
                    case 'dm':
                        rtmClient.sendMessage('Hey, This is request [DM].', message.channel);
                        break;
                    default:
                        rtmClient.sendMessage('I do not support this command.', message.channel);
                        return;
                }
            }
        }
    }
}

function actionApprove(payload, respond) {
    helpers.resolveLater(50)
    .then(() => {
        let msgConfirmation;
        let msgRespond;
        let isApprove;
        if(payload.actions[0].value === 'accept') {
            msgConfirmation = 'You have approved.';
            msgRespond = 'Your request has been approved.';
            isApprove = true;
        } else {
            msgConfirmation = 'You have rejected.';
            msgRespond = 'Your request has been rejected.';
            isApprove = false;
        } 

        // Call api change status WF
        var json = {"name": "Test"};
        var url = 'https://botsu89heroku.herokuapp.com/testpost';
        apiHandle.postApi(json, url, function(err, res, body) {
            if (res && (res.statusCode === 200 || res.statusCode === 201)) {
                console.log('-----Post OK-----');
                // Send msg to user approve
                respond({ text: msgConfirmation });

                // Send msg to user request
                sendMsg(payload.actions[0].name, msgRespond, function(err){
                    console.log(err);
                });
            } else {
                console.log('-----Error-----');
                console.log(err);
            }
        });
        
    })
    .catch((error) => {
        // Handle errors
        console.error(error);
        respond({
          text: 'An error occurred while your choice.'
        });
    });
}

function checkBot() {
    //Get info bot
    webClient.users.list().then((res) => {
        bot = res.members.find(user => user.name === 'botndt');
        if(bot) {
            // Check bot exist in channel
            webClient.channels.list().then((res) => {
            var findChannel = false;
                for(var i = 0; i < res.channels.length; i++) {
                    var c = res.channels[i];
                    if(c.name === 'testchannel') {
                        var membersArray = c.members;
                        var botIdFinded = membersArray.find(userId => userId === bot.id);
                        if(!botIdFinded) {
                            console.log('bot [botndt] not in channel [testchannel]');
                        }
                        findChannel = true;
                        break;
                    }
                }
                if(!findChannel) {
                    console.log('channel [testchannel] not exist in Team');
                }
            }).catch(console.error);
        } else {
            console.log('bot [botndt] not exist in Team');
        }
    }).catch(console.error);
}

function sendMsg(userId, msg, callback) {
    webClient.im.open({user:userId}, function(err, resp) {
        if(!err) {
            var msgGen = genMsg.genMsgSimple(msg, resp.channel.id);
            console.log(msgGen);
            webClient.chat.postMessage(msgGen, function(err, resp) {
                callback(err);
            });
        } else {
            callback(err);
        }
    });
};

function sendMsgWithAttach(data, callback) {
    let userApprove = helpers.mappingUser(data.appReq, data.userIdApprove);
    let userRequest = helpers.mappingUser(data.appReq, data.userIdReq);
    webClient.im.open({user:userApprove.slack}, function(err, resp) {
        if(!err) {
            async.waterfall([
                function (callback) {
                    var check = helpers.checkUrl(data.imgUrl, function(exists) {
                         callback(exists);
                    });
                }
              ], function (exists) {
                var msgPost;
                if(exists) {
                    msgPost = genMsg.genMsgApprove(data, resp.channel.id, userRequest.slack);
                } else {
                    msgPost = genMsg.genMsgNotImgApprove(data, resp.channel.id, userRequest.slack);
                }
                webClient.chat.postMessage(msgPost, function(err, resp) {
                    callback(err);
                });
              });
        } else {
            callback(err);
        }
    });
};