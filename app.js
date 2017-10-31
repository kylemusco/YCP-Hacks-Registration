// Load the dotfiles.
require('dotenv').load({silent: true});

var express         = require('express');
var request         = require('request');

// Middleware!
var bodyParser      = require('body-parser');
var methodOverride  = require('method-override');
var morgan          = require('morgan');
var cookieParser    = require('cookie-parser');

var mongoose        = require('mongoose');
var port            = process.env.PORT || 3000;
var database        = process.env.DATABASE || process.env.MONGODB_URI || "mongodb://localhost:27017";

var settingsConfig  = require('./config/settings');
var adminConfig     = require('./config/admin');

var app             = express();

// Connect to mongodb
mongoose.connect(database);

app.use(morgan('dev'));
app.use(cookieParser());

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.use(methodOverride());

app.use(express.static(__dirname + '/app/client'));

// Routers =====================================================================

var apiRouter = express.Router();
require('./app/server/routes/api')(apiRouter);
app.use('/api', apiRouter);

var authRouter = express.Router();
require('./app/server/routes/auth')(authRouter);
app.use('/auth', authRouter);

/* Returns a list of emails for users that are confirmed */
app.get('/confirmedlist', function(req,res) {
  request("http://ycphacks.herokuapp.com/api/users", function(err,response,body) {
            var response = JSON.parse(body);
            var emailList = "";

            for( var i=0; i<response.length; i++ ) {
                if( response[i].status.confirmed ) {
                    
                    emailList += response[i].email + ",";

                }
            }
            res.send(emailList);
    });
});

/* Gets list of users that checked in and returns their account information */
app.get('/checkedin', function(req,res) {
    request("http://ycphacks.herokuapp.com/api/users", function(err,response,body) {
        var response = JSON.parse(body);
        var responseList = "";

        for( var i=0; i<response.length; i++ ) {
            var user = response[i];
            if( user.status.checkedIn ) {
                // Get name
                if( user.profile.name != undefined ) {
                    responseList += user.profile.name + "<br>";
                } else {
                    responseList += "No name given<br>";
                }

                // Get email
                if( user.email != undefined ) {
                    responseList += user.email + "<br>";
                } else {
                    responseList += "No email given<br>";
                }

                // Get School
                if( user.profile.school != undefined ) {
                    responseList += user.profile.school + "<br>";
                } else {
                    responseList += "No school given<br>";
                }

                // Get address
                if( user.confirmation.address != undefined ) {
                    var address = user.confirmation.address;
                    responseList += address.line1 + ", " + address.city + ", " + address.state + ", " + address.zip + ", " + address.country;
                } else {
                    responseList += "No address given";
                }

                responseList += "<br><br><br><br>";
            }
        }

        res.send(responseList);
    });
});

require('./app/server/routes')(app);

// listen (start app with node server.js) ======================================
app.listen(port);
console.log("App listening on port " + port);

