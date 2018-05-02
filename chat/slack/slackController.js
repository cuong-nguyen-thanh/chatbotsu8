var config = require('config'),
    async = require('async'),
    apiHandle = require('./../../util/apiHandle'),
    helpers = require('./../../util/helpers'),
    dateFormat = require('dateformat'),
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
        let action_id;
        if(payload.actions[0].value === 'accept') {
            msgConfirmation = 'You have approved.';
            msgRespond = 'Your request has been approved.';
            action_id = "3";
        } else {
            msgConfirmation = 'You have rejected.';
            msgRespond = 'Your request has been rejected.';
            action_id = "4";
        } 

        // Call api change status WF
        var userApprove = helpers.mappingUser(config.appType.slack, payload.user.id);
        var today = new Date();
        var dateFm = dateFormat(today, "yyyymmddHHMM");
        var plainData = 'API_WORKFLOW_KEY#tenant01#' + dateFm;
        var token = helpers.genToken('kintai_encrypt01', 'visappworkflow01', plainData);
        var application_id = payload.callback_id.substring("action_slack_click_approve_id_".length);
        console.log(application_id);
        var jsonData = {
            "action_id":action_id,
            "application_list":[
                {
                "application_id":application_id,
                "comment":"comment",
                "update_time":"2018-03-19 12:05:16"
                }
            ]
        };
        var url = config.urlWf + '/api/ext/applications/status?access_token=' +
            token +'&employee_external_code=' +
            userApprove.wf +'&app_id=kintai&tenant_id=tenant01_ext';
        console.log(jsonData);
        console.log(url);
        apiHandle.postApi(jsonData, url, function(err, res, body) {
            if (res && (res.statusCode === 200 || res.statusCode === 201)) {
                // Send msg to user approve
                respond({ text: msgConfirmation });
                // Send msg to user request
                sendMsg(payload.actions[0].name, msgRespond, function(err){
                    console.log(err);
                });
            } else {
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
        bot = res.members.find(user => user.name === config.infoWorkSpace.slack_botName);
        if(bot) {
            // Check bot exist in channel
            webClient.channels.list().then((res) => {
            var findChannel = false;
                for(var i = 0; i < res.channels.length; i++) {
                    var c = res.channels[i];
                    if(c.name === config.infoWorkSpace.slack_channel) {
                        var membersArray = c.members;
                        var botIdFinded = membersArray.find(userId => userId === bot.id);
                        if(!botIdFinded) {
                            console.log('bot '+config.infoWorkSpace.slack_botName+' not in channel '+config.infoWorkSpace.slack_channel);
                        }
                        findChannel = true;
                        break;
                    }
                }
                if(!findChannel) {
                    console.log('channel '+config.infoWorkSpace.slack_channel+' not exist in Team');
                }
            }).catch(console.error);
        } else {
            console.log('bot '+config.infoWorkSpace.slack_botName+' not exist in Team');
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
    let userApprove = helpers.mappingUser(data.app_id, data.approverId);
    let userRequest = helpers.mappingUser(data.app_id, data.employee_external_code);
    let imgUrl = data.setting_value_list[3].values[0];
    webClient.im.open({user:userApprove.slack}, function(err, resp) {
        if(!err) {
            async.waterfall([
                function (callback) {
                    var check = helpers.checkUrl(imgUrl, function(exists) {
                         callback(exists);
                    });
                }
              ], function (exists) {
                var msgPost;
                if(exists) {
                    msgPost = genMsg.genMsgApprove(data, resp.channel.id, userRequest);
                } else {
                    msgPost = genMsg.genMsgNotImgApprove(data, resp.channel.id, userRequest);
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