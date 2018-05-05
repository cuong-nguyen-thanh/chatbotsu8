var express = require('express'),
    config = require('config'),
    errorHandler = require('errorhandler'),
    fs = require('fs'),
    helpers = require('./util/helpers'),
    auth = require('./util/auth'),
    processRequest = require('./controllers/process-request'),
    slackController = require('./chat/slack/slackController'),
    bodyParser = require('body-parser');
var app = module.exports = express();
const { createMessageAdapter } = require('@slack/interactive-messages');
const { RTMClient } = require('@slack/client');
const { WebClient } = require('@slack/client');

const webClient = new WebClient(config.botUserOAuthAccessToken);
const rtmClient = new RTMClient(config.botUserOAuthAccessToken);

slackController.init(webClient, rtmClient);
slackController.checkBot();

// Listen message
rtmClient.on('message', function handleRtmMessage(message) {
    slackController.handleReviceMsg(message);
});

// Configuration logging
var logDir = config.logDir;
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, 0755);
}

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

// Parse application/json
app.use(bodyParser.json())

// Set port
app.set('port', (process.env.PORT || 5000))

// Create the adapter using the app's verification token
const slackInteractions = createMessageAdapter(config.verificationToken);

// Process Request ===================================
// Default message
app.get('/', auth.authGet, function (req, res) {
	res.send('hello, i am a bot');
});

// For test post method
app.post('/testpost', auth.authPost, function (req, res) {
    console.log(req.body);
	res.json({
        status: 0,
        decs: 'change status ok'
    });
});

// Revice approval notice
app.post('/webhook/wf/approve', auth.authPost, processRequest.approvalNotice);

// Attach the adapter to the Express application as a middleware
app.use('/slack/actions', slackInteractions.expressMiddleware());

// Slack interactive message handlers
slackInteractions.action(/action_slack_click_approve_id_(\w+)/, (payload, respond) => {
    slackController.actionApprove(payload, respond);
    // Before the work completes, return a message object that is the same as the original but with
    // the interactive elements removed.
    return helpers.returnFistTimeMsg(payload);
});

// Connection to Slack API Server
rtmClient.start();

// Listen
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'));
})
