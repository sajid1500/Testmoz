const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash')
const asyncHandler = require('express-async-handler');
const morgan = require('morgan');
const dateFormat = require('dateformat')
const adminRoutes = require('./routes/adminRoutes')
const questionRoutes = require('./routes/questionRoutes')

const app = express();

// connect to mongodb and listen for requests
const db = require('./config/keys').mongoURI

mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: true })
  .then(result => app.listen(3000))
  .catch(err => console.log(err))

app.set('view engine', 'ejs');

// middleware & static files
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({
  type: ['application/json', 'text/plain']
}))

app.use(session({
  secret: '1928e89e84',
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize())
app.use(passport.session())

app.use(flash())

app.use(morgan('dev'));
// routes
app.get('/', (req, res) => {
  res.render('main/index', {
    title: 'Testmoz - Powerful but Simple Test Generator',
  });
});

app.get('/features', (req, res) => {
  res.render('main/features', {
    title: 'Features of The Testmoz Test Builder',
  });
});

app.get('/build', (req, res) => {
  const error = req.session.error
  req.session.error = null

  res.render('main/build', {
    title: 'Build a Test for Free with Testmoz',
    error
  });
});

app.get('/account/login', (req, res) => {
  res.render('account/login', {
    title: 'Features of The Testmoz Test Builder',
  });
});

app.get('/account/register', (req, res) => {
  res.render('account/register', {
    title: 'Features nof The Testmoz Test Builder',
  });
});

// test routes
app.use(adminRoutes)

// question routes
app.use('/q', questionRoutes)

// 404 page
app.use((req, res) => {
  res.status(404).render('main/404', {
    title: '404 Page Not Found',
  });
});
