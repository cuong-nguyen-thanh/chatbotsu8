exports.genMsgApprove = genMsgApprove;
exports.genMsgNotImgApprove = genMsgNotImgApprove;
exports.genMsgSimple = genMsgSimple;

function genMsgNotImgApprove(data, channelId, userRequest) {
    var msgPost = {
      channel:channelId, 
      text:'Have a request need you approve',
      attachments: [
          {
              "title": data.subject,
              "color": "#3AA3E3",
              "fields": [
                  {
                      "title": "User",
                      "value": userRequest.username,
                  },
                  {
                      "title": "From Date",
                      "value": data.setting_value_list[0].values[0],
                      "short": true
                  },
                  {
                      "title": "To Date",
                      "value": data.setting_value_list[1].values[0],
                      "short": true
                  },
                  {
                      "title": "Reason",
                      "value": data.setting_value_list[2].values[0],
                  }
              ],
          },
          {
              "title": "You want approve?",
              "callback_id": "action_slack_click_approve",
              "color": "#3AA3E3",
              "attachment_type": "default",
              "actions": [
                  {
                      "name": userRequest.slack,
                      "text": "Accept",
                      "type": "button",
                      "value": "accept",
                      "style": "primary"
                  },
                  {
                      "name": userRequest.slack,
                      "text": "Reject",
                      "type": "button",
                      "value": "reject",
                      "style": "danger",
                  }
              ]
          }
      ]
  };
  return msgPost;
}

function genMsgSimple(msg, channelId) {
    var msgPost = {
        channel:channelId, 
        text:msg,
    };
    return msgPost;
}

function genMsgApprove(data, channelId, userRequest) {
      var msgPost = {
        channel:channelId, 
        text:'Have a request need you approve',
        attachments: [
            {
                "title": data.subject,
                "color": "#3AA3E3",
                "fields": [
                    {
                        "title": "User",
                        "value": userRequest.username,
                    },
                    {
                        "title": "From Date",
                        "value": data.setting_value_list[0].values[0],
                        "short": true
                    },
                    {
                        "title": "To Date",
                        "value": data.setting_value_list[1].values[0],
                        "short": true
                    },
                    {
                        "title": "Reason",
                        "value": data.setting_value_list[2].values[0],
                    }
                ],
            },
            {
                "title": "Image",
                "color": "#3AA3E3",
                "image_url": data.setting_value_list[3].values[0],
            },
            {
                "title": "You want approve?",
                "callback_id": "action_slack_click_approve",
                "color": "#3AA3E3",
                "attachment_type": "default",
                "actions": [
                    {
                        "name": userRequest.slack,
                        "text": "Accept",
                        "type": "button",
                        "value": "accept",
                        "style": "primary"
                    },
                    {
                        "name": userRequest.slack,
                        "text": "Reject",
                        "type": "button",
                        "value": "reject",
                        "style": "danger",
                    }
                ]
            }
        ]
    };
    return msgPost;
}