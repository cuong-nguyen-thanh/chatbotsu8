var config = require('config'),
    async = require('async'),
    apiHandle = require('./../../util/apiHandle'),
    helpers = require('./../../util/helpers'),
    SlackModel = require('./../../model/SlackModel'),
    dateFormat = require('dateformat'),
    genMsg = require('./../../util/genMsg');
var HashMap = require('hashmap');
const chatwork = require('chatwork-client');

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

      // Call api change status WF
      // Get data req
      var idUnique = payload.callback_id.substring("action_slack_click_approve_id_".length);
      var mapData = mapSlack.get(idUnique);
      mapSlack.delete(idUnique);
      helpers.log(`data: ${mapData.tenant_id}; ${mapData.application_id}; ${mapData.app_id}; ${mapData.approver_id}; ${mapData.update_time}`);

      if(payload.actions[0].value === 'accept') {
        msgConfirmation = `Request ${mapData.application_id} has been approved by you.`;
        msgRespond = `Your request ${mapData.application_id} has been approved.`;
        action_id = "3";
      } else {
        msgConfirmation = `Request ${mapData.application_id} has been rejected by you.`;
        msgRespond = `Your request ${mapData.application_id} has been rejected.`;
        action_id = "4";
      }

      // Gen token for api
      var today = new Date();
      var updatedDate = new Date(mapData.update_time);
      today.setHours(today.getHours() + 9); //GMT+9
      var dateFm = dateFormat(today, "GMT:yyyymmddHHMM");
      var updatedDateFm = dateFormat(updatedDate, "GMT:yyyy-mm-dd HH:MM:ss");
      var plainData = 'API_WORKFLOW_KEY#' +mapData.tenant_id+ '#' + dateFm;
      var token = helpers.genToken('kintai_encrypt01', 'visappworkflow01', plainData);

      // Create json data
      var jsonData = {
          "action_id":action_id,
          "application_list":[
              {
              "application_id":mapData.application_id,
              "comment":"comment",
              "update_time": updatedDateFm
              }
          ]
      };
      helpers.log(jsonData);
      // create url
      var url = config.urlWf + '/api/ext/applications/status?access_token=' +
          token +'&employee_external_code=approver&app_id=' + mapData.app_id + '&tenant_id=' + mapData.tenant_id;
      helpers.log(url);
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
              respond({ text: 'Error to access ' +  config.urlWf});
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
        bot = res.members.find(user => user.id === config.infoWorkSpace.slack_botId);
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

  var chatworkParams = {
    chatworkToken: config.chatwork.access_token,
    roomId: config.chatwork.room_id,
    msg: msg
  };
  helpers.log(chatworkParams);

  chatwork.init(chatworkParams);

  chatwork.postRoomMessages()
    .then((data)=>{
      console.log(data)
    })
    .catch((err)=>{
      console.log(err);
    });

    // webClient.im.open({user:userId}, function(err, resp) {
    //     if(!err) {
    //         var msgGen = genMsg.genMsgSimple(msg, resp.channel.id);
    //         console.log(msgGen);
    //         webClient.chat.postMessage(msgGen, function(err, resp) {
    //             callback(err);
    //         });
    //     } else {
    //         callback(err);
    //     }
    // });
};

function sendMsgWithAttach(data, callback) {
    console.log("data request: " + JSON.stringify(data));
    let userApproves = helpers.getSlackUsers(data.AppID, data.ApproverIds);
    let userRequest = helpers.mappingUser(data.AppID, data.RequesterId);
    let imgUrl = '';//data.SettingValueList[3].values[0];
    let idUnique = helpers.genUniqueId();
    if (userApproves.length === 0) {
        callback(true);
    } else {
        userApproves.forEach(userApprove => {
            webClient.im.open({user:userApprove.slack}, function(err, resp) {
                if(!err) {
                    async.waterfall([
                        function (imgCallback) {
                            var check = helpers.checkUrl(imgUrl, function(exists) {
                                imgCallback(exists);
                            });
                        }
                    ], function (exists) {
                        var msgPost = genMsg.genMsgApprove(data, resp.channel.id, userRequest, userApprove.slack);
                        if(exists) {
                            msgPost.attachments.push(genMsg.genElementImage(imgUrl));
                        } 
                        msgPost.attachments.push(genMsg.genFtMsg(userRequest, idUnique));
                        webClient.chat.postMessage(msgPost, function(err, resp) {
                            if(!err) {
                                // Set data to HashMap
                                var slackObj = new SlackModel(data.ApplicationId, 
                                  data.RequesterId,
                                  data.ApproverIds,
                                  data.Subject,
                                  data.AppID,
                                  data.TenantId,
                                  data.UpdateTime);
                                mapSlack.set(idUnique, slackObj);
                                console.log(mapSlack);
                            }
                            callback(err);
                        });
                    });
                } else {
                    callback(err);
                }
            });
        });
    }
};