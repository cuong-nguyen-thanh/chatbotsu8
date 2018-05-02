var slackController = require('./../chat/slack/slackController'),
    helpers = require('./../util/helpers');
    config = require('config');

const {test} = require('./../commons/common');

exports.approvalNotice = approvalNotice;

function approvalNotice(req, res) {
    //console.log(req.query);
    //console.log(req.params);
    //console.log(req.body);
    switch(req.body.chatAppApprove) {
        case config.chatType.slack:
            slackController.sendMsgWithAttach(req.body, function(err) {
                if(err) {
                    // Response 500 with error
                    res.status(500).send(err);
                } else {
                    // Response 200
                    res.status(200).send();
                }
            });
            break;
        case config.chatType.chatwork:
            // TODO process for chatwork
            res.status(500).send('chatAppApprove is not suppport');
            break;
        default:
            res.status(500).send('chatAppApprove is not suppport');
            return;
    }

    
}