const mongoose = require('mongoose')
const settingsSchema = require('./settingsSchema')
const Schema = mongoose.Schema

const testSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true
  },
  position: {
    type: Number,
    required: true,
    unique: true
  },
  settings: settingsSchema,
  questions: Array,
  published: Boolean,
  students: Array
})
// }, { minimize: false })

const Test = mongoose.model('test', testSchema)
module.exports = Test