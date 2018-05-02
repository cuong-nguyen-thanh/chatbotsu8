var slackController = require('./../chat/slack/slackController'),
    helpers = require('./../util/helpers');
    config = require('config');

const {test} = require('./../commons/common');

exports.approvalNotice = approvalNotice;

function approvalNotice(req, res) {
    slackController.sendMsgWithAttach(req.body, function(err) {
        if(err) {
            //Response 500 with error
            res.status(500).send(err);
        } else {
            // Response 200
            res.status(200).send();
        }
    });
}