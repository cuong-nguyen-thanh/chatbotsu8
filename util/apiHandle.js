var request=require('request');

exports.postApi = postApi;

function postApi(dataJson, url, callback) {
    var options = {
        url: url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        json: dataJson
    };
    request(options, function(err, res, body) {
        callback(err, res, body);
    });
}

