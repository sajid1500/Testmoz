const LocalStrategy = require('passport-local').Strategy

function initialize(passport, getTestByPos, getTestById) {
  const authenticateTest = async (username, password, done) => {
    try {
      const test = (await getTestByPos(username)).toJSON()
      // console.log(test)
      if (!test) {
        return done(null, false)
      }
      if (test.password === password) {
        return done(null, test)
      }
    } catch (e) {
      return done(e)
    }
    return done(null, false, { message: 'Wrong password' })
  }

  passport.use(new LocalStrategy({ usernameField: 'pos' }, authenticateTest))

  passport.serializeUser((test, done) => {
    return done(null, test._id)
  })
  passport.deserializeUser(async (id, done) => {
    return done(null, (await getTestById(id)).toJSON())
  })
}

module.exports = initialize