var express  = require('express');
var auth0    = require('auth0-oauth2-express');
var Webtask  = require('webtask-tools');
var app      = express();
var template = require('./templates/index.jade');
var metadata = require('./webtask.json');
var jwt      = require('jsonwebtoken');
var request  = require('request');
var rp       = require('request-promise');
var _        = require('underscore');


var ipTraceEndpoint = 'http://freegeoip.net/json/';

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
  var getUsersEndpoint = jwt.decode(token).aud[0] + 'users';
  var users; 

  var options = {
    url: getUsersEndpoint,
    headers: {
      'Authorization': req.headers.authorization
    }
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var users = JSON.parse(response.body);
      console.log('----- first user: ------- ', _.first(users));

      var usersResponse = [];

      var returnUsers = _.after(users.length, function(){
        res.status(200).send(usersResponse);
      });

      _.each(users, function(user){
          var ipLocationEndpoint = ipTraceEndpoint + user.last_ip;

          request(ipLocationEndpoint, function(error, response, body){
            if(error || response.statusCode !== 200){ 
              console.log("ERROR: ", error);
            } else {
              user.location = JSON.parse(response.body);
              usersResponse.push(user);
            }
            
            returnUsers();

          });
      });

    }
  });
});


module.exports = app;
