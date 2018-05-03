var config = require('config'),
    async = require('async'),
    apiHandle = require('./../../util/apiHandle'),
    helpers = require('./../../util/helpers'),
    SlackModel = require('./../../model/SlackModel'),
    dateFormat = require('dateformat'),
    genMsg = require('./../../util/genMsg');
var HashMap = require('hashmap');

exports.sendMsgWithAttach = sendMsgWithAttach;
exports.sendMsg = sendMsg;
exports.init = init;
exports.checkBot = checkBot;
exports.actionApprove = actionApprove;
exports.handleReviceMsg = handleReviceMsg;

let webClient = null;
let rtmClient = null;
let bot = null;
var mapSlack = null;

function init(web, rtm) {
    webClient = web;
    rtmClient = rtm;
    mapSlack = new HashMap();
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
        // Get data req
        var idUnique = payload.callback_id.substring("action_slack_click_approve_id_".length);
        var mapData = mapSlack.get(idUnique);

        // Gen token for api
        var today = new Date();
        var dateFm = dateFormat(today, "yyyymmddHHMM");
        var plainData = 'API_WORKFLOW_KEY#' +mapData.tenant_id+ '#' + dateFm;
        var token = helpers.genToken('kintai_encrypt01', 'visappworkflow01', plainData);

        // Create json data
        var jsonData = {
            "action_id":action_id,
            "application_list":[
                {
                "application_id":mapData.application_id,
                "comment":"comment",
                "update_time":"2018-03-19 12:05:16"
                }
            ]
        };

        // create url
        var url = config.urlWf + '/api/ext/applications/status?access_token=' +
            token +'&employee_external_code=' +
            mapData.approverId +'&app_id=' + mapData.app_id + '&tenant_id=' + mapData.tenant_id;
        console.log(jsonData);
        console.log(url);

        // call WF
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
                respond({ text: 'Error access to ' +  config.urlWf});
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
    // Get info bot
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
    let idUnique = helpers.genUniqueId();
    webClient.im.open({user:userApprove.slack}, function(err, resp) {
        if(!err) {
            async.waterfall([
                function (callback) {
                    var check = helpers.checkUrl(imgUrl, function(exists) {
                         callback(exists);
                    });
                }
              ], function (exists) {
                var msgPost = genMsg.genMsgApprove(data, resp.channel.id, userRequest);
                if(exists) {
                    msgPost.attachments.push(genMsg.genElementImage(imgUrl));
                } 
                msgPost.attachments.push(genMsg.genFtMsg(userRequest, idUnique));
                webClient.chat.postMessage(msgPost, function(err, resp) {
                    if(!err) {
                        // Set data to HashMap
                        var slackObj = new SlackModel(data.application_id, 
                            data.employee_external_code, 
                            data.approverId, data.application_form_id, 
                            data.app_id, data.tenant_id);
                        mapSlack.set(idUnique, slackObj);
                    }
                    callback(err);
                });
              });
        } else {
            callback(err);
        }
    });
};