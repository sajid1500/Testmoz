const dateFormat = require('dateformat');
const express = require('express')
const asyncHandler = require('express-async-handler');
const nocache = require('nocache')
const validator = require('validator')
const Test = require('../models/test');
const router = express.Router({ mergeParams: true })

router.use(nocache())

router.get('/', ensureAuthenticated, asyncHandler(async (req, res, next) => {
  const testPos = req.params.position
  const test = await Test.findOne({ position: testPos })
  res.render('test/dashboard', { ...test.toJSON() })
}))

router.get('/logout', ensureAuthenticated, asyncHandler(async (req, res, next) => {
  const testPos = req.params.position
  req.logout()
  req.flash('adminSuccesses', 'You are now logged out')
  res.redirect(`/q/${testPos}`)
}))

router.get('/settings', asyncHandler(async (req, res, next) => {
  const testPos = req.params.position
  const test = await Test.findOne({ position: testPos })
  if (!test) return
  res.render('test/settings', { ...test.toJSON(), ...test.settings.toJSON(), errors: [] })
}))

router.post('/settings', asyncHandler(async (req, res, next) => {
  const testPos = req.params.position
  const test = await Test.findOne({ position: testPos })
  const errors = Object.entries(req.body)
    .map(([key, value]) => {
      switch (key) {
        case 'duration':
        case 'attempts':
          if (value[0] === 'limited' && !value[1]) return key
          break
        case 'name':
          if (validator.isEmpty(value, { ignore_whitespace: true })) return key
          break
        case 'authorization':
          if (!value) return key
          break
        case 'studPass':
          if (req.body.authorization === 'studPass' && validator.isEmpty(value, { ignore_whitespace: true })) return key
          break
        case 'identities':
        case 'emails':
          let value2 = value.split(/\n/)
          if (req.body.authorization === key && !value2[0]) return key
          break
        default:
          return null
      }
    }).filter(elem => elem);

  if (errors.length !== 0) return res.render('test/settings', { ...test.toJSON(), ...test.settings.toJSON(), ...req.body, origName: test.name, errors })

  Object.keys(test.settings.toJSON()).forEach(key => {
    switch (key) {
      case 'identities':
      case 'emails':
        return test.settings[key] = req.body[key].split(/\n/)
      default:
        if (['randQues', 'showMsg', 'showScore', 'showOutline', 'indRes', 'disCrctAns', 'disExp'].includes(key)) return test.settings[key] = req.body[key] ? true : false
        test.settings[key] = req.body[key]
    }
  });
  test.name = req.body.name
  await test.save()
  res.redirect(req.originalUrl)
}))

router.get('/questions', asyncHandler(async (req, res, next) => {
  const testPos = req.params.position
  const test = (await Test.findOne({ position: testPos })).toJSON()
  res.render('test/questions', { ...test })
}))

router.post('/questions', asyncHandler(async (req, res, next) => {
  const test = await Test.findOne({ position: req.params.position })
  test.questions = req.body
  await test.save()
}))

router.get('/publish', ensureAuthenticated, asyncHandler(async (req, res, next) => {
  const testPos = req.params.position
  const test = await Test.findOne({ position: testPos })
  res.render('test/publish', { ...test.toJSON(), testPos })
}))

router.post('/publish', asyncHandler(async (req, res, next) => {
  const testPos = req.params.position
  const test = await Test.findOne({ position: req.params.position })
  test.published = true;
  await test.save()
  res.redirect(`/${testPos}/publish`)
}))

router.get('/reports', asyncHandler(async (req, res, next) => {
  const testPos = req.params.position
  const test = (await Test.findOne({ position: testPos })).toJSON()
  const avgTime = test.students.reduce((accumulator, student) => accumulator + student.time, 0) / test.students.length
  const avgScore = test.students.reduce((accumulator, student) => accumulator + parseInt(student.score.match(/\d+/)[0]), 0) / test.students.length
  res.render('test/results', { ...test, testPos, dateFormat, avgTime, avgScore })
}))

async function ensureAuthenticated(req, res, next) {
  const position = req.params.position
  const test = await Test.findOne({ position })
  if (req.user && req.user.position == position) return next()
  res.redirect(`/q/${position}`)
}

module.exports = router