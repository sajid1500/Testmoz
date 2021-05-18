const dateFormat = require('dateformat');
const express = require('express')
const asyncHandler = require('express-async-handler');
const nocache = require('nocache')
const Test = require('../models/test');

const router = express.Router()

router.use(nocache())

router.post('/:position/admin', asyncHandler(async (req, res, next) => {
  const data = req.body;

  if (data.password !== data.confirm_password) {
    req.session.error = 'Your passwords did not match.'
    res.redirect('/build');
  } else {
    const position = await Test.estimatedDocumentCount() + 1
    const test = new Test({ ...data, position })
    await test.save()
    res.redirect(`/${position}/admin`)
  }
}));

router.get('/:position/admin', ensureAuthenticated, asyncHandler(async (req, res, next) => {
  const testPos = req.params.position
  const test = await Test.findOne({ position: testPos })
  if (test) {
    res.render('test/dashboard', { ...test.toJSON() })
  } else {
    next()
  }
}))

router.get('/:position/admin/logout', ensureAuthenticated, asyncHandler(async (req, res, next) => {
  const testPos = req.params.position
  req.logout()
  req.flash('adminSuccesses', 'You are now logged out')
  res.redirect(`/q/${testPos}`)
}))

router.get('/:position/admin/settings', ensureAuthenticated, asyncHandler(async (req, res, next) => {
  const testPos = req.params.position
  const test = await (await Test.findOne({ position: testPos })).toJSON()

  if (test) {
    res.render('test/settings', { ...test, areErrors: false })
  } else {
    next()
  }
}))

router.post('/:position/admin/settings', asyncHandler(async (req, res, next) => {
  const { name, intro, theme, lang } = req.body
  const testPos = req.params.position
  const test = await Test.findOne({ position: testPos })

  if (req.body.hasOwnProperty('showOutline')) test.showOutline.value = req.body.showOutline
  if (req.body.hasOwnProperty('outlineOpt')) test.showOutline.options = req.body.outlineOpt
  for (const [key, value] of Object.entries(req.body)) {
    switch (key) {
      case 'intro':
      case 'con':
      case 'passMsg':
      case 'failMsg':
        test[key] = value;
        break;
      case 'quesPerPg':
        test.quesPerPg.amount = value;
        break;
      case 'nav':
        if (test.quesPerPg.amount === 'one') {
          test.quesPerPg.nav = value;
        } else {
          test.quesPerPg.nav = 'forward';
        }
        break;
      case 'show':
        if (test.quesPerPg.amount === 'one') {
          if (typeof value === 'string') {
            test.quesPerPg.show = [value]
          } else {
            test.quesPerPg.show = value
          }
        } else {
          test.quesPerPg.show = ['nothing']
        }
        break;
    }
  }
  await test.save()

  if (!name) {
    res.render('test/settings', { ...req.body, areErrors: true, origName: test.name })
  } else {
    res.redirect(req.originalUrl)
  }
}))

router.get('/:position/admin/questions', ensureAuthenticated, asyncHandler(async (req, res, next) => {
  const testPos = req.params.position
  const test = (await Test.findOne({ position: testPos })).toJSON()
  if (test) {
    res.render('test/questions', { ...test })
  } else {
    next()
  }
}))

router.post('/:position/admin/questions', asyncHandler(async (req, res, next) => {
  const test = (await Test.findOne({ position: req.params.position }))
  test.questions = req.body
  await test.save()
}))

router.get('/:position/admin/publish', ensureAuthenticated, asyncHandler(async (req, res, next) => {
  const testPos = req.params.position
  const test = (await Test.findOne({ position: testPos })).toJSON()
  if (test) {
    res.render('test/publish', { ...test, testPos })
  } else {
    next()
  }
}))

router.post('/:position/admin/publish', asyncHandler(async (req, res, next) => {
  const testPos = req.params.position
  const test = await Test.findOne({ position: req.params.position })
  test.published = true;
  await test.save()
  res.redirect(`/${testPos}/admin/publish`)
}))

function ensureAuthenticated(req, res, next) {
  const position = req.params.position
  if (req.user && req.user.position == position) {
    return next()
  }
  res.redirect(`/q/${position}`)
}

module.exports = router