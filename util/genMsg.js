exports.genMsgApprove = genMsgApprove;
exports.genMsgNotImgApprove = genMsgNotImgApprove;
exports.genMsgSimple = genMsgSimple;

function genMsgNotImgApprove(data, channelId, userIdRequest) {
    var msgPost = {
      channel:channelId, 
      text:'Have a request need you approve',
      attachments: [
          {
              "title": "Request Vacation",
              "color": "#3AA3E3",
              "fields": [
                  {
                      "title": "User",
                      "value": data.userNameReq,
                  },
                  {
                      "title": "From Date",
                      "value": data.fromDate,
                      "short": true
                  },
                  {
                      "title": "To Date",
                      "value": data.toDate,
                      "short": true
                  },
                  {
                      "title": "Reason",
                      "value": data.reason,
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
                      "name": userIdRequest,
                      "text": "Accept",
                      "type": "button",
                      "value": "accept",
                      "style": "primary"
                  },
                  {
                      "name": userIdRequest,
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

function genMsgApprove(data, channelId, userIdRequest) {
      var msgPost = {
        channel:channelId, 
        text:'Have a request need you approve',
        attachments: [
            {
                "title": "Request Vacation",
                "color": "#3AA3E3",
                "fields": [
                    {
                        "title": "User",
                        "value": data.userNameReq,
                    },
                    {
                        "title": "From Date",
                        "value": data.fromDate,
                        "short": true
                    },
                    {
                        "title": "To Date",
                        "value": data.toDate,
                        "short": true
                    },
                    {
                        "title": "Reason",
                        "value": data.reason,
                    }
                ],
            },
            {
                "title": "Image",
                "color": "#3AA3E3",
                "image_url": data.imgUrl,
            },
            {
                "title": "You want approve?",
                "callback_id": "action_slack_click_approve",
                "color": "#3AA3E3",
                "attachment_type": "default",
                "actions": [
                    {
                        "name": userIdRequest,
                        "text": "Accept",
                        "type": "button",
                        "value": "accept",
                        "style": "primary"
                    },
                    {
                        "name": userIdRequest,
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