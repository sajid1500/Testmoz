const test_build = async (req, res, next) => {
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
};

const test_admin = async (req, res, next) => {
  const testPos = req.params.position
  const test = await Test.findOne({ position: testPos })
  if (test) {
    res.render('test/dashboard', { name: test.name, dashboard: `/${testPos}/admin` })
  } else {
    next()
  }
})

router.get('/:position/admin/settings', async (req, res, next) => {
  const testPos = req.params.position
  const test = await (await Test.findOne({ position: testPos })).toJSON()

  if (test) {
    res.render('test/settings', { ...test, dashboard: `/${testPos}/admin`, areErrors: false })
  } else {
    next()
  }
}))

router.post('/:position/admin/settings', async (req, res, next) => {
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
    res.render('test/settings', { ...req.body, dashboard: `/${testPos}/admin`, areErrors: true, origName: test.name })
  } else {
    res.redirect(req.originalUrl)
  }
}))

router.get('/:position/admin/questions', async (req, res, next) => {
  const testPos = req.params.position
  const test = (await Test.findOne({ position: testPos })).toJSON()
  if (test) {
    res.render('test/questions', { ...test, dashboard: `/${testPos}/admin` })
  } else {
    next()
  }
}))

router.post('/:position/admin/questions', async (req, res, next) => {
  const test = (await Test.findOne({ position: req.params.position }))
  test.questions = req.body
  await test.save()
}))

router.get('/:position/admin/publish', async (req, res, next) => {
  const testPos = req.params.position
  const test = (await Test.findOne({ position: testPos })).toJSON()
  if (test) {
    res.render('test/publish', { ...test, dashboard: `/${testPos}/admin`, testPos })
  } else {
    next()
  }
}))

router.post('/:position/admin/publish', async (req, res, next) => {
  const testPos = req.params.position
  const test = await Test.findOne({ position: req.params.position })
  test.published = true;
  await test.save()
  res.redirect(`/${testPos}/admin/publish`)
}))

router.get('/q/:position', async (req, res, next) => {
  const testPos = req.params.position
  const test = (await Test.findOne({ position: testPos })).toJSON()
  if (test) {
    res.render('test/login', { ...test, dashboard: `/${testPos}/admin`, testPos })
  } else {
    next()
  }
}))

router.post('/q/:position', async (req, res, next) => {
  req.session.studName = req.body.studName
  console.log(req.body)
  req.session.start = new Date()

  res.redirect(`/q/${req.params.position}/student`)
}))

router.get('/q/:position/student', async (req, res, next) => {
  const testPos = req.params.position
  const test = (await Test.findOne({ position: testPos })).toJSON()
  if (test) {
    res.render('test/student', { ...test, dashboard: `/${testPos}/admin`, testPos, start: Date.now() })
  } else {
    next()
  }
}))

const twoDecimal = value => {
  const numOfDecim = value % 1 !== 0 ? value.toString().split(".")[1].length : 0
  return numOfDecim > 2 ? value.toFixed(2) : value
};
router.post('/q/:position/student', async (req, res, next) => {
  const test = await Test.findOne({ position: req.params.position })
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
  req.session.session = null
  console.log(student)
  test.students.unshift(student)
  await test.save()
  if (test) {
    res.render('test/student', { ...test.toJSON(), finish: dateFormat(student.finish, 'mmmm d, yyyy, h:MM tt'), score: student.score, answers: student.answers, studPoints })
  } else {
    next()
  }
}))

router.get('/:position/admin/reports', async (req, res, next) => {
  const testPos = req.params.position
  const test = (await Test.findOne({ position: testPos })).toJSON()
  const avgTime = test.students.reduce((accumulator, student) => accumulator + student.time, 0) / test.students.length
  const avgScore = test.students.reduce((accumulator, student) => accumulator + parseInt(student.score.match(/\d+/)[0]), 0) / test.students.length
  if (test) {
    res.render('test/results', { ...test, dashboard: `/${testPos}/admin`, testPos, dateFormat, avgTime, avgScore })
  } else {
    next()
  }
}))

module.exports = router