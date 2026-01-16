const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  id: String,       // UUID for each option
  text: String,
  isCorrect: Boolean,
});

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, required: true },
  points: { type: Number, default: 1 },
  correctAnswer: { type: String }, // For Auto-Grading Short Answer
  image: { type: String }, // URL or path
  explanation: { type: String },
  negativePoints: { type: Number, default: 0 },
  isShuffle: { type: Boolean, default: false },
  options: [
    {
      text: String,
      isCorrect: Boolean,
    },
  ],
});


const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for now
  },
  formLink: { // Made optional as we use inviteCode/internal routes
    type: String,
    required: false,
  },
  duration: {
    type: Number, // duration in minutes
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  questions: [questionSchema], // Added for storing questions and options
  studentEmails: {
    type: [String],
    default: [],
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true,
  },
  emails: {
    type: [String],
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
  biometricEnabled: { // New: Requirement for biometric check
    type: Boolean,
    default: false
  },
  proctoringSettings: {
    restrictTabs: { type: Boolean, default: true },
    restrictFullScreen: { type: Boolean, default: true },
    disableCopyPaste: { type: Boolean, default: true },
    noiseDetection: { type: Boolean, default: false },
    multiFaceDetection: { type: Boolean, default: false },
  },
  releaseScores: { // Production: Controls if students can see results
    type: Boolean,
    default: false
  },
}, { timestamps: true });

// Add malpractice logs to studentActivity
testSchema.path('studentActivity').schema.add({
  malpracticeLogs: [
    {
      type: { type: String }, // 'tab_switch', 'noise', 'fullscreen_exit', 'multiple_faces', 'no_face'
      message: String,
      timestamp: { type: Date, default: Date.now },
      snapshotUrl: String // Optional: if we capture evidence
    }
  ]
});

module.exports = mongoose.model('Test', testSchema);
