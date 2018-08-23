const express = require('express');
const path = require('path');
const app = express();
const bodyparser = require('body-parser');
const ev = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const config = require('./config/database');
const passport = require('passport');

app.use(bodyparser.urlencoded({ extended: false}));
app.use(bodyparser.json());
const mongoose = require('mongoose');


mongoose.connect(config.database);
let db = mongoose.connection;

db.once('open', function() {
  console.log('Connected to mongodb');

});

db.on('error', function(err){
  console.log(err);
});

//express session middleware
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));

//express messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

//express validator middleware
app.use(ev({
  errorFormatter: function(param, msg, value){
    var namespace = param.split('.'),
    root = namespace.shift(),
    formParam = root;

    while(namespace.length){
      formParam += '[' + namespace.shift() + ']';
    }
    return{
      param : formParam,
      msg : msg,
      value: value
    }
  }
}));

//passport config
require('./config/passport')(passport);
//passport middle wares
app.use(passport.initialize());
  app.use(passport.session());
//variable
  app.get('*', function(req, res, next){
    res.locals.user = req.user || null;
    next();
  });

let Article = require('./models/article');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/',function(req, res){

  Article.find({}, function(err, articles){
    if(err){
      console.log(err);
    }else{
      res.render('index', {
        title: 'Articles',
        art:articles,
      });
    }
});
});

//route files
let articles = require('./routes/articles');
let users = require('./routes/users');
app.use('/articles', articles);
app.use('/users', users);

app.listen(3000, function(){
  console.log('server started');
});
