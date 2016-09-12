var express  = require('express');
var auth0    = require('auth0-oauth2-express');
var Webtask  = require('webtask-tools');
var app      = express();
var template = require('./templates/index.jade');
var metadata = require('./webtask.json');
var jwt      = require('jsonwebtoken');
var request  = require('request');


app.use(auth0({
  scopes: 'read:users'
}));

app.get('/', function (req, res) {
  
  res.header("Content-Type", 'text/html');
  res.status(200).send(template({
    baseUrl: res.locals.baseUrl
  }));

});

// This endpoint would be called by webtask-gallery to dicover your metadata
app.get('/meta', function (req, res) {
  res.status(200).send(metadata);
});

app.get('/users', function(req, res){
  var token = req.headers.authorization.split(' ')[1];
  var apiEndpoint = jwt.decode(token).aud[0];

  var options = {
    url: apiEndpoint + 'users',
    headers: {
      'Authorization': req.headers.authorization
    }
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
      res.status(200).send(body);
    }
    console.log(response);

  });

});


module.exports = app;
