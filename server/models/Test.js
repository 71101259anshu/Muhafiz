const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  formLink: {
    type: String,
    required: true,
  },
  duration: {
    type: Number, // duration in minutes
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  studentEmails: {
    type: [String],
    default: []
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true
  },
  emails: {
    type: [String]
  },

  invitedEmails: {  // for total invited emails
    type: [String],
    default: [],
  },

  attendedEmails: { // for emails of students who attended the test
    type: [String],
    default: [],
  },
  studentActivity: [
    {
      email: String,
      name: String,
      inactivityLogs: [String], // timestamps when user was inactive
    },
  ],
  inactivityLogs: [
  {
    email: String,
    name: String,
    timestamp: String,
  },
],


}, { timestamps: true });

module.exports = mongoose.model('Test', testSchema);
