const dateFormat = require('dateformat');
const express = require('express')
const passport = require('passport')
const asyncHandler = require('express-async-handler');
const Test = require('../models/test');

const router = express.Router()

const initializePassport = require('../config/passport')
initializePassport(
  passport,
  position => Test.findOne({ position }),
  id => Test.findById(id),
)

router.get('/:position', asyncHandler(async (req, res, next) => {
  const testPos = req.params.position
  const test = (await Test.findOne({ position: testPos })).toJSON()
  const errors = req.flash('errors') || []
  const successes = req.flash('successes') || []
  const adminSuccesses = req.flash('adminSuccesses') || []
  if (test) {
    res.render('test/login', { ...test, testPos, errors, successes, adminSuccesses })
  } else {
    next()
  }
}))

router.post('/:position', asyncHandler(async (req, res, next) => {
  req.session.studName = req.body.studName
  console.log('object')
  res.redirect(`/q/${req.params.position}/student`)
}))

router.post('/:position/admin', passport.authenticate('local', { failureRedirect: 'back', failureFlash: true, }), (req, res) => {
  res.redirect(`/${req.params.position}/admin`)
})

router.get('/:position/student', asyncHandler(async (req, res, next) => {
  const testPos = req.params.position
  const test = (await Test.findOne({ position: testPos })).toJSON()
  if (test) {
    res.render('test/student', { ...test, testPos, start: Date.now() })
  } else {
    next()
  }
}))

const twoDecimal = value => {
  const numOfDecim = value % 1 !== 0 ? value.toString().split(".")[1].length : 0
  return numOfDecim > 2 ? value.toFixed(2) : value
};
router.post('/:position/student', asyncHandler(async (req, res, next) => {
  const test = await Test.findOne({ position: req.params.position })
  if (req.body.logout) {
    req.flash('successes', 'You are now logged out')
    res.redirect(`/${req.params.position}`)
    return
  }
  if (!req.body.studAns && test) {
    console.log(req.body)
    res.render('test/student', { ...test.toJSON(), returned: true })
    return;
  }
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
  console.log(req.body)
  await test.save()
  if (test) {
    res.render('test/student', { ...test.toJSON(), finish: dateFormat(student.finish, 'mmmm d, yyyy, h:MM tt'), score: student.score, answers: student.answers, studPoints, returned })
  } else {
    next()
  }
}))

module.exports = router
