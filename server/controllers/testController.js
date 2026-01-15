const Test = require('../models/Test');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const generateInviteCode = require('../utils/generateInviteCode');
const path = require('path');
const multer = require('multer');




// Storage config for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads"); // Storing in root uploads to match static serve path
  },
  filename: function (req, file, cb) {
    cb(
      null,
      Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname)
    );
  }
});

const upload = multer({ storage });

// Create Test
const createTest = async (req, res) => {
  try {
    const { title, description, duration, startTime, questions } = req.body; // Added description

    if (!title || !duration || !startTime) {
      return res.status(400).json({ message: 'Title, duration, and start time are required' });
    }

    // Parse questions if it's a string (coming from FormData)
    let parsedQuestions = questions;
    if (typeof questions === 'string') {
      try {
        parsedQuestions = JSON.parse(questions);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid questions format' });
      }
    }

    // Validate questions array
    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
      return res.status(400).json({ message: 'At least one question is required' });
    }

    // Generate unique invite code
    let inviteCode, existing;
    do {
      inviteCode = generateInviteCode();
      existing = await Test.findOne({ inviteCode });
    } while (existing);

    // Handle uploaded files (Multer will add them to req.files)
    // We map uploaded files to the 'image' field of the question to support Visual Questions
    const processedQuestions = parsedQuestions.map((q, index) => {
      // Find file with fieldname questionFile_{index}
      const attachment = req.files?.find(file => file.fieldname === `questionFile_${index}`);

      return {
        ...q,
        image: attachment ? `/uploads/${attachment.filename}` : null,
        // Ensure new fields are preserved
        negativePoints: q.negativePoints || 0,
        explanation: q.explanation || "",
        isShuffle: q.isShuffle || false,
        correctAnswer: q.correctAnswer || "" // Preserve expected answer
      };
    });

    const test = new Test({
      title,
      description, // Save description
      duration,
      startTime,
      inviteCode,
      questions: processedQuestions,
      createdBy: req.user._id // Link to creator
    });

    await test.save();

    res.status(201).json({
      message: 'Test created successfully',
      test
    });
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Get All Tests
const getAllTests = async (req, res) => {
  try {
    // Filter tests by the logged-in user (creator)
    const tests = await Test.aggregate([
      { $match: { createdBy: req.user._id } }, // Only show tests created by this user
      { $sort: { createdAt: -1 } },
      {
        $project: {
          title: 1,
          startTime: 1,
          duration: 1,
          inviteCode: 1,
          createdAt: 1,
          questionsCount: { $size: { "$ifNull": ["$questions", []] } }
        }
      }
    ]);
    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tests', error });
  }
};

// Update Test
const updateTest = async (req, res) => {
  try {
    const { title, startTime, duration } = req.body;
    const updatedTest = await Test.findByIdAndUpdate(
      req.params.id,
      { title, startTime, duration },
      { new: true }
    );
    if (!updatedTest) return res.status(404).json({ message: 'Test not found' });
    res.json(updatedTest);
  } catch (err) {
    res.status(500).json({ message: 'Error updating test' });
  }
};

// Delete Test
const deleteTest = async (req, res) => {
  try {
    const deleted = await Test.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Test not found' });
    res.json({ message: 'Test deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting test' });
  }
};

// Send Invite Emails
const sendTestInviteToEmails = async (req, res) => {
  const { testId, emails } = req.body;

  if (!testId || !emails || emails.length === 0) {
    return res.status(400).json({ message: 'Test ID and emails are required' });
  }

  try {
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ message: 'Server email credentials not configured', details: 'Check .env file' });
    }

    // Create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection configuration
    try {
      await transporter.verify();
      console.log("SMTP Connection verified");
    } catch (verifyErr) {
      console.error("SMTP Verify Error:", verifyErr);
      return res.status(500).json({
        message: 'Email Server Connection Failed',
        error: verifyErr.message
      });
    }

    const emailPromises = emails.map((email) =>
      transporter.sendMail({
        from: `"Muhafiz Admin" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Test Invite Code for "${test.title}"`,
        html: `<p>Hello,</p>
               <p>Your invite code for the test <strong>${test.title}</strong> is:</p>
               <h2>${test.inviteCode}</h2>
               <p>Use this code to access your test on the portal.</p>`,
      })
    );

    await Promise.all(emailPromises);
    test.invitedEmails = [...new Set([...test.invitedEmails, ...emails])];
    await test.save();

    res.status(200).json({ message: 'Invite codes sent to all students' });
  } catch (error) {
    console.error('Error sending invite codes:', error);
    res.status(500).json({
      message: 'Failed to send emails',
      error: error.message
    });
  }
};

// Validate Invite Code and Email
const validateInviteCodeandEmail = async (req, res) => {
  const { email, inviteCode } = req.body;

  if (!email || !inviteCode) {
    return res.status(400).json({ message: 'Email and invite code are required' });
  }

  try {
    const test = await Test.findOne({ inviteCode });

    if (!test) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    if (!test.invitedEmails.includes(email)) {
      return res.status(403).json({ message: 'This email is not invited to this test' });
    }

    const user = await User.findOne({ email });
    const name = user?.name || email.split('@')[0];

    return res.status(200).json({
      message: 'Validation successful',
      testId: test._id,
      name,
      biometricEnabled: test.biometricEnabled,
    });
  } catch (err) {
    console.error('Validation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Single Test by ID
const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Test not found' });
    res.status(200).json(test);
  } catch (err) {
    console.error('Error fetching test:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark Student as Attended
const markStudentAttended = async (req, res) => {
  const { email } = req.body;
  const testId = req.params.id;

  if (!email || !testId) {
    return res.status(400).json({ message: 'Email and test ID are required' });
  }

  try {
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    if (!test.attendedEmails.includes(email)) {
      test.attendedEmails.push(email);
      test.markModified('attendedEmails');
      await test.save();
    }

    res.status(200).json({ message: 'Student marked as attended' });
  } catch (err) {
    console.error('Error marking attendance:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Log Inactivity
const logInactivity = async (req, res) => {
  const { email, name, timestamp } = req.body;
  const { testId } = req.params;

  if (!email || !timestamp) {
    return res.status(400).json({ message: 'Email and timestamp are required' });
  }

  try {
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    const existingStudent = test.studentActivity.find((s) => s.email === email);

    if (existingStudent) {
      existingStudent.inactivityLogs.push(timestamp);
    } else {
      test.studentActivity.push({ email, name, inactivityLogs: [timestamp] });
    }

    await test.save();
    res.status(200).json({ message: 'Inactivity logged' });
  } catch (error) {
    console.error('Error logging inactivity:', error);
    res.status(500).json({ message: 'Failed to log inactivity' });
  }
};

// ✅ Get Student Activity
const getStudentActivity = async (req, res) => {
  const { testId } = req.params;

  try {
    const test = await Test.findById(testId).lean();
    if (!test) return res.status(404).json({ message: 'Test not found' });

    // Fetch submissions to verify "Present" status
    const submissions = await Result.find({ testId }).select('studentEmail').lean();
    const submittedEmails = submissions.map(s => s.studentEmail);

    const attended = test.attendedEmails || [];
    const invited = test.invitedEmails || [];
    const activity = test.studentActivity || [];

    // Combine arrays to get unique list of all relevant students
    const allEmails = [...new Set([...invited, ...attended])];

    const users = await User.find({ email: { $in: allEmails } }).lean();

    const students = allEmails.map((email) => {
      const hasSubmitted = submittedEmails.includes(email);
      const isPresent = attended.includes(email) || hasSubmitted;
      const student = activity.find((s) => s.email === email);
      const user = users.find(u => u.email === email);

      return {
        email,
        name: user?.username || user?.name || student?.name || email.split("@")[0],
        status: hasSubmitted ? 'Present' : 'Absent', // Strict: Present only if submitted
        inactivityLogs: student?.inactivityLogs || [],
      };
    });

    res.status(200).json(students);
  } catch (err) {
    console.error("🔥 Error fetching student activity:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Send Warning to a student
const sendWarning = (req, res) => {
  const { testId, email } = req.body;

  if (!testId || !email) {
    return res.status(400).json({ message: 'Test ID and email are required' });
  }

  const room = `${testId}-${email}`;
  global.io.to(room).emit('receiveWarning', {
    message: '⚠️ You have received a warning from the admin.',
  });

  res.status(200).json({ message: 'Warning sent successfully' });
};

// ✅ Remove Student from the exam AND invitedEmails
const removeStudent = async (req, res) => {
  const { testId, email } = req.body;

  if (!testId || !email) {
    return res.status(400).json({ message: 'Test ID and email are required' });
  }

  try {
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Remove student from invitedEmails
    test.invitedEmails = test.invitedEmails.filter(e => e !== email);
    await test.save();

    // Emit socket event to force logout
    const room = `${testId}-${email}`;
    global.io.to(room).emit('forceLogout', {
      message: '❌ You have been removed from the test by the admin.',
    });

    return res.status(200).json({
      message: 'Student removed successfully',
      updatedInvitedEmails: test.invitedEmails,
    });
  } catch (err) {
    console.error('Error removing student:', err);
    res.status(500).json({ message: 'Failed to remove student' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const totalTests = await Test.countDocuments();

    const now = new Date();
    const activeTests = await Test.find({
      startTime: { $lte: now }
    }).lean();

    const activeExams = activeTests.filter(test => {
      const endTime = new Date(test.startTime).getTime() + test.duration * 60000;
      return now.getTime() <= endTime;
    }).length;

    const flaggedSessionsAgg = await Test.aggregate([
      { $unwind: "$studentActivity" },
      { $match: { "studentActivity.inactivityLogs.0": { $exists: true } } },
      { $count: "flaggedCount" }
    ]);
    const flaggedSessions = flaggedSessionsAgg[0]?.flaggedCount || 0;

    const registeredStudents = await User.countDocuments({ role: "student" });

    const recentTests = await Test.find().sort({ createdAt: -1 }).limit(5);
    const recentLogs = recentTests.map(test =>
      `📝 Test "${test.title}" was created on ${new Date(test.createdAt).toLocaleDateString()}`
    );

    res.status(200).json({
      stats: {
        totalTests,
        activeExams,
        flaggedSessions,
        registeredStudents,
      },
      recentLogs,
    });
  } catch (err) {
    console.error("🔥 Dashboard stats error:", err); // 👈 PRINT FULL ERROR
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};

// ✅ Remove student and update invitedEmails
const removeStudentPermanently = async (req, res) => {
  const { testId } = req.params;
  const { email } = req.body;

  if (!testId || !email) {
    return res.status(400).json({ message: 'Test ID and email are required' });
  }

  try {
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    // Remove from invitedEmails
    test.invitedEmails = test.invitedEmails.filter(e => e !== email);

    // Optional: Also remove from attendedEmails and studentActivity
    test.attendedEmails = test.attendedEmails.filter(e => e !== email);
    test.studentActivity = test.studentActivity.filter(s => s.email !== email);

    await test.save();

    res.status(200).json({
      message: 'Student removed successfully',
      updatedInvitedEmails: test.invitedEmails,
    });
  } catch (err) {
    console.error('Error removing student:', err);
    res.status(500).json({ message: 'Server error' });
  }
};



const Result = require('../models/Result'); // Import Result model

// ... (existing imports)

// ✅ Submit Test & Calculate Score
const submitTest = async (req, res) => {
  // Parsing because FormData sends text fields as strings
  let { testId, studentEmail, answers, studentName } = req.body;

  if (typeof answers === 'string') {
    try {
      answers = JSON.parse(answers);
    } catch (e) {
      return res.status(400).json({ message: "Invalid answers format" });
    }
  }

  if (!testId || !studentEmail || !answers) {
    return res.status(400).json({ message: "Missing testId, email, or answers" });
  }

  try {
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });

    let totalScore = 0;
    let maxTotalPoints = 0;
    const evaluatedAnswers = [];
    let requiresManualGrading = false;

    // Process Files if any
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // Fieldname expectation: answerFile_{questionId}
        const match = file.fieldname.match(/answerFile_(.+)/);
        if (match) {
          const qId = match[1];
          const ans = answers.find(a => a.questionId === qId);
          if (ans) {
            ans.fileUrl = `/uploads/${file.filename}`;
          }
        }
      });
    }

    // Calculate Score
    test.questions.forEach(question => {
      maxTotalPoints += (question.points || 0);

      const studentAns = answers.find(a => a.questionId === question.id);
      const selectedOptIds = studentAns ? studentAns.selectedOptions : [];
      const textAnswer = studentAns ? studentAns.textAnswer : "";
      const fileUrl = studentAns ? studentAns.fileUrl : "";

      // Determine correct option IDs for this question
      const correctOptIds = question.options
        .filter(opt => opt.isCorrect)
        .map(opt => opt.id || (opt._id ? opt._id.toString() : null)) // Robust ID handling
        .filter(id => id); // Remove nulls

      let isCorrect = false;
      let pointsAwarded = 0;

      // Logic for Single Choice (MCQ / True-False)
      if (["mcq", "true-false", "dropdown"].includes(question.type)) {
        if (correctOptIds.length > 0 && selectedOptIds.length > 0) {
          if (correctOptIds[0] === selectedOptIds[0]) {
            isCorrect = true;
            pointsAwarded = question.points || 1;
          } else {
            pointsAwarded = -(question.negativePoints || 0);
          }
        }
      }
      // Logic for Multiple Choice (Checkboxes)
      // Logic for Multiple Choice (Checkboxes) - Partial Grading
      else if (question.type === "checkboxes") {
        const studentSelectedIds = selectedOptIds || [];

        // 1. Check if ANY wrong option is selected
        const hasWrongSelection = studentSelectedIds.some(id => !correctOptIds.includes(id));

        if (hasWrongSelection) {
          isCorrect = false;
          pointsAwarded = 0; // Strict penalty: 0 if any wrong answer (User Request)
        } else {
          // 2. Calculate Partial Score based on how many correct identified
          const correctSelectedCount = studentSelectedIds.filter(id => correctOptIds.includes(id)).length;
          const totalCorrectCount = correctOptIds.length;

          if (totalCorrectCount > 0 && correctSelectedCount > 0) {
            // Partial Formula: (Correctly Selected / Total Correct) * Points
            pointsAwarded = (correctSelectedCount / totalCorrectCount) * (question.points || 1);

            // Mark as 'isCorrect' only if 100% matched for statistical tracking
            isCorrect = (correctSelectedCount === totalCorrectCount);
          } else {
            pointsAwarded = 0;
          }
        }
      }
      // Logic for Text Answers & Files
      else if (["short-answer", "paragraph", "file"].includes(question.type)) {
        // Auto-grade Check for Short Answer
        if (question.type === 'short-answer' && question.correctAnswer && textAnswer) {
          const studentText = textAnswer.trim().toLowerCase();
          const correctText = question.correctAnswer.trim().toLowerCase();

          if (studentText === correctText) {
            isCorrect = true;
            pointsAwarded = question.points || 0;
            // It is graded, so manual grading is NOT required for this specific question
            // However, we need to track if *any* question needs grading. 
            // If this was the only text question, requiresManualGrading stays false!
          } else {
            requiresManualGrading = true; // No exact match -> needs review
          }
        } else {
          requiresManualGrading = true; // Paragraph/File always needs review
        }
      }

      // Add to total
      totalScore += pointsAwarded;

      evaluatedAnswers.push({
        questionId: question.id,
        selectedOptions: selectedOptIds,
        textAnswer: textAnswer,
        fileUrl: fileUrl,
        isCorrect,
        pointsAwarded
      });
    });

    // Save Result
    const result = new Result({
      testId,
      studentEmail,
      studentName,
      score: totalScore,
      totalPoints: maxTotalPoints,
      answers: evaluatedAnswers,
      isGraded: !requiresManualGrading // If no manual, it's fully graded
    });

    await result.save();

    res.status(200).json({
      message: "Test submitted successfully",
      score: totalScore,
      totalPoints: maxTotalPoints,
      resultId: result._id
    });

  } catch (err) {
    console.error("Error submitting test:", err);
    res.status(500).json({ message: "Failed to submit test" });
  }
};

// ✅ Get All Results for a Test (Admin)
const getTestResults = async (req, res) => {
  try {
    const { testId } = req.params;
    const results = await Result.find({ testId }).sort({ createdAt: -1 });
    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching results:", err);
    res.status(500).json({ message: "Failed to fetch results" });
  }
};

// ✅ Update Result Score (Manual Grading)
const updateResultScore = async (req, res) => {
  const { resultId } = req.params;
  const { gradedAnswers } = req.body;
  // gradedAnswers: [{ questionId, pointsAwarded, feedback }]

  try {
    const result = await Result.findById(resultId);
    if (!result) return res.status(404).json({ message: "Result not found" });

    let newTotalScore = 0;

    // Update specific answers
    result.answers = result.answers.map(ans => {
      const grade = gradedAnswers.find(g => g.questionId === ans.questionId);
      if (grade) {
        ans.pointsAwarded = parseFloat(grade.pointsAwarded);
        ans.feedback = grade.feedback || "";
      }
      newTotalScore += (ans.pointsAwarded || 0); // Re-sum score
      return ans;
    });

    result.score = newTotalScore;
    result.isGraded = true; // Mark as graded
    await result.save();

    res.status(200).json({ message: "Grades updated successfully", result });

  } catch (err) {
    console.error("Error updating grades:", err);
    res.status(500).json({ message: "Failed to update grades" });
  }
};

// ✅ Get Test for Student (Hidden Answers)
const getStudentTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id).lean();
    if (!test) return res.status(404).json({ message: 'Test not found' });

    // Check 48-Hour Expiry
    const startTime = new Date(test.startTime).getTime();
    const expiryTime = startTime + (48 * 60 * 60 * 1000); // 48 hours later
    if (Date.now() > expiryTime) {
      return res.status(403).json({ message: 'Test availability has expired (48-hour limit).' });
    }

    // Sanitize questions: Remove isCorrect and explanation
    const sanitizedQuestions = test.questions.map(q => ({
      ...q,
      explanation: undefined, // Hide explanation
      options: q.options.map(o => ({
        id: o.id,
        text: o.text,
        // isCorrect: undefined // REMOVE THIS FIELD
      }))
    }));

    // We strictly should not send isCorrect. 
    // Since we are using .lean(), the 'undefined' trick usually works or we reconstruct.
    // Better to reconstruct to be safe.

    const safeQuestions = test.questions.map(q => ({
      _id: q._id, // Explicitly pass _id
      id: q._id,  // Map id to _id for consistency
      text: q.text,
      type: q.type,
      points: q.points,
      negativePoints: q.negativePoints,
      image: q.image,
      options: q.options.map(o => ({
        _id: o._id, // Explicitly pass _id
        id: o._id,  // Map id to _id
        text: o.text
      }))
    }));

    res.status(200).json({
      ...test,
      questions: safeQuestions,
      invitedEmails: undefined, // Privacy
      studentActivity: undefined,
      attendedEmails: undefined
    });
  } catch (err) {
    console.error('Error fetching student test:', err);
    res.status(500).json({ message: 'Server error' });
  }
};



// Toggle Release Scores
async function toggleReleaseScores(req, res) {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });

    test.releaseScores = !test.releaseScores;
    await test.save();

    res.status(200).json({
      message: `Results ${test.releaseScores ? 'Published' : 'Hidden'}`,
      releaseScores: test.releaseScores
    });
  } catch (err) {
    console.error("Error toggling release scores:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
}

// Get Single Detailed Result (For Student Dashboard)
async function getDetailedResult(req, res) {
  try {
    const { resultId } = req.params;
    const result = await Result.findById(resultId).populate('testId');

    if (!result) return res.status(404).json({ message: "Result not found" });

    const test = result.testId;
    if (!test) return res.status(404).json({ message: "Test associated with result not found" });

    const isStudent = req.user.email === result.studentEmail;

    if (isStudent && !test.releaseScores) {
      return res.status(403).json({ message: "Results have not been published yet." });
    }

    const detailedAnswers = result.answers.map(ans => {
      const question = test.questions.find(q => q._id.toString() === ans.questionId || q.id === ans.questionId);

      if (!question) return { ...ans.toObject(), questionText: "Question Not Found" };

      const showCorrect = test.releaseScores || !isStudent;

      return {
        ...ans.toObject(),
        questionText: question.text,
        questionType: question.type,
        options: question.options.map(o => ({
          ...o.toObject(),
          isCorrect: showCorrect ? o.isCorrect : undefined
        })),
        maxPoints: question.points,
        correctAnswer: showCorrect ? question.correctAnswer : undefined,
        explanation: showCorrect ? question.explanation : undefined
      };
    });

    res.status(200).json({
      ...result.toObject(),
      answers: detailedAnswers,
      testTitle: test.title,
      totalPoints: test.questions.reduce((sum, q) => sum + (q.points || 0), 0)
    });

  } catch (err) {
    console.error("Error fetching detailed result:", err);
    res.status(500).json({ message: "Failed to fetch result" });
  }
}



// Send Result Emails (Bulk or Single)
async function sendResultEmails(req, res) {
  try {
    const { testId } = req.params;
    const { studentEmails } = req.body; // Array of emails. If empty, send to all.

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });

    /* // Removed requirement to publish first
    if (!test.releaseScores) {
      return res.status(400).json({ message: "Please publish the results first before emailing students." });
    }
    */

    // Filter for only GRADED results
    let query = { testId: test._id, isGraded: true }; // ✅ Only fully graded tests
    if (studentEmails && studentEmails.length > 0) {
      query.studentEmail = { $in: studentEmails };
    }

    const results = await Result.find(query);

    if (results.length === 0) {
      return res.status(404).json({ message: "No graded results found to email." });
    }

    // Send Emails in parallel
    const emailPromises = results.map(result => {
      const link = `http://localhost:3000/result/${result._id}`;

      // Calculate Grade & Remarks
      const percentage = (result.score / (result.totalPoints || 1)) * 100;
      const isPassed = percentage >= 40;
      const statusColor = isPassed ? "#16a34a" : "#dc2626"; // Green or Red
      const statusText = isPassed ? "PASSED" : "NEEDS IMPROVEMENT";

      const kindWords = isPassed
        ? "Congratulations! Keep up the great work! 🌟"
        : "Don't be discouraged. Keep practicing and you'll do better next time! 💪";

      return sendEmail({
        email: result.studentEmail,
        subject: `Result: ${test.title} - ${statusText}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            
            <!-- Header -->
            <div style="background-color: #1e293b; padding: 20px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 24px;">Test Result</h2>
              <p style="color: #94a3b8; margin: 5px 0 0; font-size: 14px;">${test.title}</p>
            </div>

            <!-- Content -->
            <div style="padding: 30px 20px; text-align: center;">
              <p style="font-size: 18px; color: #334155; margin-bottom: 20px;">Hello <strong>${result.studentName || 'Student'}</strong>,</p>
              
              <p style="color: #64748b; margin-bottom: 30px;">Your assessment has been graded. Here is how you performed:</p>

              <!-- Score Card -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display: inline-block; min-width: 200px;">
                <h1 style="color: ${statusColor}; margin: 0; font-size: 48px; line-height: 1;">${result.score}</h1>
                <p style="color: #64748b; margin: 5px 0 0; font-size: 14px; text-transform: uppercase; font-weight: 600;">out of ${result.totalPoints}</p>
              </div>

              <!-- Pass/Fail Badge -->
              <div style="margin-top: 20px;">
                <span style="background-color: ${statusColor}; color: white; padding: 6px 16px; border-radius: 20px; font-weight: 700; font-size: 14px; letter-spacing: 1px;">
                  ${statusText}
                </span>
              </div>

              <!-- Kind Words -->
              <p style="margin-top: 25px; font-size: 16px; color: #475569; font-style: italic;">
                "${kindWords}"
              </p>

              <!-- Action Button -->
              <div style="margin-top: 35px;">
                <a href="${link}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                  View Detailed Analysis
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Muhafiz-Kvizroom. All rights reserved.</p>
            </div>
          </div>
        `
      });
    });

    await Promise.all(emailPromises);

    res.status(200).json({ message: `Successfully sent ${results.length} result emails.` });

  } catch (err) {
    console.error("Error sending result emails:", err);
    res.status(500).json({ message: `Failed to send emails: ${err.message}` });
  }
}

// Share Test to Classroom
const shareTestToClass = async (req, res) => {
  const { testId, classId } = req.body;

  if (!testId || !classId) {
    return res.status(400).json({ message: 'Test ID and Class ID are required' });
  }

  try {
    // Fetch test details
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Fetch class details with students
    const Class = require('../models/Class');
    const classData = await Class.findById(classId).populate('students', 'email username');
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Extract student emails
    const studentEmails = classData.students.map(s => s.email);

    if (studentEmails.length === 0) {
      return res.status(400).json({ message: 'No students found in this class' });
    }

    // Send invites to all students
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ message: 'Server email credentials not configured' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const emailPromises = studentEmails.map((email) =>
      transporter.sendMail({
        from: `"Muhafiz Admin" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Test Invite Code for "${test.title}"`,
        html: `<p>Hello,</p>
               <p>Your invite code for the test <strong>${test.title}</strong> is:</p>
               <h2>${test.inviteCode}</h2>
               <p>Use this code to access your test on the portal.</p>`,
      })
    );

    await Promise.all(emailPromises);

    // Update test's invitedEmails
    test.invitedEmails = [...new Set([...test.invitedEmails, ...studentEmails])];
    await test.save();

    // Create announcement post in the class stream
    const Post = require('../models/Post');
    const announcementContent = `📝 New Quiz: ${test.title}\n\n🔑 Invite Code: ${test.inviteCode}\n📅 Start Time: ${new Date(test.startTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}\n⏱️ Duration: ${test.duration} minutes`;

    await Post.create({
      content: announcementContent,
      author: req.user._id,
      class: classId,
      attachments: []
    });

    res.status(200).json({
      message: `Test shared with ${studentEmails.length} students from ${classData.name}`,
      studentCount: studentEmails.length
    });

  } catch (error) {
    console.error('Error sharing test to class:', error);
    res.status(500).json({ message: 'Failed to share test to class', error: error.message });
  }
};

module.exports = {
  createTest,
  getAllTests,
  sendTestInviteToEmails,
  updateTest,
  deleteTest,
  validateInviteCodeandEmail,
  getTestById,
  markStudentAttended,
  logInactivity,
  getStudentActivity,
  removeStudentPermanently,
  getDashboardStats,
  getTestResults,
  updateResultScore,
  submitTest,
  toggleReleaseScores,
  getDetailedResult,
  sendResultEmails,
  getStudentTest,
  sendWarning,
  removeStudent,
  shareTestToClass
};
