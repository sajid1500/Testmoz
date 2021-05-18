const mongoose = require('mongoose')
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
  intro: {
    type: String,
    default: ''
  },
  theme: {
    type: String,
    default: 'white'
  },
  lang: {
    type: String,
    default: 'auto',
    required: true
  },
  quesPerPg: {
    amount: {
      type: String,
      default: 'all',
      required: true
    },
    nav: { type: String, default: 'forward' },
    show: [{ type: String, default: 'nothing' }]
  },
  randQues: {
    type: Boolean,
    default: false
  },
  con: {
    type: String,
    default: ''
  },
  showMsg: {
    type: String,
    default: ''
  },
  passScore: {
    type: String,
    default: ''
  },
  passMsg: {
    type: String,
    default: ''
  },
  failMsg: {
    type: String,
    default: ''
  },
  // disOutline: {
  //   showRes: String,
  //   showAns: String,
  //   showExp: String,
  // },
  showScore: {
    type: String,
    default: ''
  },
  showOutline: {
    type: Schema.Types.Mixed,
    value: '',
    default: {
      options: []
    }
  },
  questions: Array,
  published: Boolean,
  students: Array
})
// }, { minimize: false })

const Test = mongoose.model('test', testSchema)
module.exports = Test