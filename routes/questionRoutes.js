const dateFormat = require('dateformat');
const express = require('express')
const passport = require('passport')
const asyncHandler = require('express-async-handler');
const nocache = require('nocache')

const Test = require('../models/test');
const router = express.Router({ mergeParams: true })

router.use(nocache())

const initializePassport = require('../config/passport')
initializePassport(
  passport,
  position => Test.findOne({ position }),
  id => Test.findById(id),
)

router.get('/', asyncHandler(async (req, res, next) => {
  const testPos = req.params.position
  const test = await Test.findOne({ position: testPos })
  const errors = req.flash('errors') || []
  const successes = req.flash('successes') || []
  const adminSuccesses = req.flash('adminSuccesses') || []
  res.render('test/login', { ...test.toJSON(), ...test.settings.toJSON(), errors, successes, adminSuccesses })
}))

router.post('/', asyncHandler(async (req, res, next) => {
  req.session.studId = req.body.studId
  res.redirect(`/q/${req.params.position}/student`)
}))

router.post('/admin', passport.authenticate('local', { failureRedirect: 'back', failureFlash: true, }), (req, res) => {
  res.redirect(`/${req.params.position}/admin`)
})

router.get('/student', checkStudentLoggedIn, asyncHandler(async (req, res, next) => {
  const testPos = req.params.position
  const test = await Test.findOne({ position: testPos })
  test.questions = test.questions.filter(question => !question.type.includes('survey'))
  res.render('test/student', { ...test.toJSON(), testPos, start: Date.now() })
}))

const twoDecimal = value => {
  const numOfDecim = value % 1 !== 0 ? value.toString().split(".")[1].length : 0
  return numOfDecim > 2 ? value.toFixed(2) : value
};

router.post('/student', asyncHandler(async (req, res, next) => {
  const test = await Test.findOne({ position: req.params.position })
  const attempted = ++test.students.filter(student => student.id === req.session.studId).length
  const studAnswers = req.body.studAnswers.map(studAns => typeof studAns === 'string' ? [studAns] : studAns)
  let now = new Date()
  const quesPoints = test.questions.map(question => parseInt(question.points))
  let totalQuesPoints = quesPoints.reduce((accumulator, currentValue) => accumulator + currentValue)
  let studPoints = studAnswers.map((studAns, i) => {
    let point = 0;
    const question = test.questions[i]
    let addsub = question.points / question.crctAns.length
    studAns.forEach(choice => {
      if (question.crctAns.includes(choice)) point += addsub
    })
    return twoDecimal(point)
  })
  function getScore() {
    const totalStudPoints = studPoints.reduce((accumulator, currentValue) => accumulator + currentValue)
    return `${twoDecimal(totalStudPoints / totalQuesPoints * 100)}% (${totalStudPoints}/${totalQuesPoints})`
  }
  let student = {
    name: req.session.studName,
    score: getScore(),
    start: new Date(req.session.start),
    finish: now,
    time: now - new Date(req.session.start),
    answers: studAnswers.map((studAns, i) => ({
      correct: studPoints[i] === 0 ? 'wrong' : studPoints[i] === quesPoints[i] ? 'right' : 'partial',
      studAns
    }))
  }
  req.session.studName = null
  req.session.start = null
  test.students.unshift(student)
  await test.save()
  res.redirect(`q/${req.params.position}/student/review`)
}))

router.get('/student/review', (req, res) => {

})

router.get('/student/review/logout', (req, res) => {
  req.session.studId = null
  req.flash('success', 'You are now logged out')
  res.redirect(`/${req.params.position}?logout`)
})

function checkStudentLoggedIn(req, res, next) {
  if (req.session.studId) return next()
  res.redirect(`/q/${req.params.position}`)
}

module.exports = router
