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
const Test = require('./models/test')

const app = express();

// connect to mongodb and listen for requests
const db = require('./config/keys').mongoURI
const PORT=process.env.PORT || 3000

mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: true })
  .then(res => app.listen(PORT, () => console.log('listening on 3000')))
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

// app.use((req, res) => {
//   res.locals.info = req.flash('info')
//   res.locals.error = req.flash('error')
//   res.locals.success = req.flash('success')
// })

// routes
app.get('/', (req, res) => {
  res.render('main/index', { title: 'Testmoz - Powerful but Simple Test Generator' });
});

app.get('/features', (req, res) => {
  res.render('main/features', { title: 'Features of The Testmoz Test Builder' });
});

app.get('/build', (req, res) => {
  res.render('main/build', { title: 'Build a Test for Free with Testmoz' });
});

app.post('/build', async (req, res, next) => {
  const data = req.body;
  const errors = []

  if (data.password !== data.confirm_password) {
    errors.push('mismatch')
    res.render('main/build', { title: 'Build a Test for Free with Testmoz', errors });
  } else {
    const position = await Test.estimatedDocumentCount() + 1
    const test = new Test({ ...data, position })
    await test.save()
    res.redirect(`/${position}/admin`)
  }
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

// admin routes
app.use('/:position/admin', checkTestExists, adminRoutes)

// question routes
app.use('/q/:position', checkTestExists, questionRoutes)

// 404 page

app.use((req, res) => sendErrorPage(res));

async function checkTestExists(req, res, next) {
  if (!isNaN(req.params.position) && await Test.findOne({ position: req.params.position })) return next()
  sendErrorPage(res)
}

function sendErrorPage(res) {
  res.status(404).render('main/404', {
    title: '404 Page Not Found',
  });
}
