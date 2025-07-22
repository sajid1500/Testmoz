const mongoose = require('mongoose')
const Schema = mongoose.Schema

const settingsSchema = new Schema({
  intro: {
    type: String,
    default: ''
  },
  theme: {
    type: String,
    default: ''
  },
  lang: {
    type: String,
    default: ''
  },
  randQues: {
    type: Boolean,
    default: true
  },
  con: {
    type: String,
    default: ''
  },
  showMsg: {
    type: Boolean,
    default: false
  },
  passScore: {
    type: Number,
    default: null
  },
  passMsg: {
    type: String,
    default: ''
  },
  failMsg: {
    type: String,
    default: ''
  },
  showScore: {
    type: Boolean,
    default: true
  },
  showOutline: {
    type: Boolean,
    default: true
  },
  indRes: {
    type: Boolean,
    default: true
  },
  disCrctAns: {
    type: Boolean,
    default: true
  },
  disExp: {
    type: Boolean,
    default: true
  },
  authorization: {
    type: String,
    default: 'anyone'
  },
  studPass: {
    type: String,
    default: ''
  },
  uniqueId: {
    type: [String],
    default: ['']
  },
  email: {
    type: [String],
    default: ['']
  },
  duration: {
    type: [String, Number],
    default: ['unlimited', null]
  },
  attempts: {
    type: [String],
    default: ['unlimited', '']
  },
  idInfo: {
    type: String,
    default: 'Enter your name'
  }
}, { _id: false, })
// 

module.exports = settingsSchema