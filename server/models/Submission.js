const submissionSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
  studentEmail: String,
  submittedAt: Date,
  status: {
    type: String,
    enum: ['submitted', 'ended', 'auto-submitted'],
  },
});

module.exports = mongoose.model('Submission', submissionSchema);
