const Test = require('../models/Test');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const generateInviteCode = require('../utils/generateInviteCode');

// Create Test
const createTest = async (req, res) => {
  const { title, formLink, duration, startTime } = req.body;

  if (!title || !formLink || !duration || !startTime) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    let inviteCode, existing;
    do {
      inviteCode = generateInviteCode();
      existing = await Test.findOne({ inviteCode });
    } while (existing);

    const test = new Test({ title, formLink, duration, startTime, inviteCode });
    await test.save();

    res.status(201).json({ message: 'Test created successfully', test });
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get All Tests
const getAllTests = async (req, res) => {
  try {
    const tests = await Test.find().sort({ createdAt: -1 });
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

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

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
    res.status(500).json({ message: 'Failed to send emails' });
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

    const attended = test.attendedEmails || [];
    const activity = test.studentActivity || [];
    const users = await User.find({ email: { $in: attended } }).lean();

    const students = attended.map((email) => {
      const student = activity.find((s) => s.email === email);
      const user = users.find(u => u.email === email);
      return {
        email,
        name: user?.name || student?.name || email.split("@")[0],
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
  sendWarning,
  removeStudent,
  getDashboardStats,
  removeStudentPermanently,
};
