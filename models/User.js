
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
  },
  mobile: {
    type: Number,
  },
  password: {
    type: String  },
  avatar:{
    type:String
  },
  role: {
    type: String,
    enum:['admin','user'],
    default:'user',
  },


isVerified:{
  type:Boolean,
  default:false
}

}, { timestamps: true });


module.exports = mongoose.model("user",UserSchema);