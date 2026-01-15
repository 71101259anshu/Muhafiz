const AssignmentSubmission = require('../models/AssignmentSubmission');
const Classwork = require('../models/Classwork');

// @desc    Submit an assignment
// @route   POST /api/classwork/:id/submit
// @access  Private (Student)
const submitAssignment = async (req, res) => {
    try {
        const { id } = req.params; // Classwork ID
        const studentId = req.user._id;

        // Check if classwork exists
        const classwork = await Classwork.findById(id);
        if (!classwork) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Check for existing submission
        let submission = await AssignmentSubmission.findOne({ classwork: id, student: studentId });

        // Handle Files
        let newAttachments = [];
        if (req.files && req.files.length > 0) {
            newAttachments = req.files.map(file => ({
                name: file.originalname,
                url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
                fileType: file.mimetype
            }));
        }

        if (submission) {
            // If already graded, cannot resubmit
            if (submission.status === 'graded') {
                return res.status(400).json({ message: 'Already graded' });
            }

            // If submitted or working, we update
            // Combine attachments
            submission.attachments = [...submission.attachments, ...newAttachments];
            submission.status = 'submitted'; // Always move to submitted on turn in
            submission.submittedAt = Date.now();
            await submission.save();
        } else {
            // Create new
            submission = await AssignmentSubmission.create({
                classwork: id,
                student: studentId,
                attachments: newAttachments,
                status: 'submitted'
            });
        }

        res.status(201).json(submission);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all submissions for an assignment
// @route   GET /api/classwork/:id/submissions
// @access  Private (Teacher/Admin)
const getSubmissions = async (req, res) => {
    try {
        const { id } = req.params;

        // Get the classwork to find the class
        const classwork = await Classwork.findById(id);
        if (!classwork) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Get the class to find all enrolled students
        const Class = require('../models/Class');
        const classData = await Class.findById(classwork.class).populate('students', 'username email photo');
        if (!classData) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Get all submissions for this assignment
        const submissions = await AssignmentSubmission.find({ classwork: id })
            .populate('student', 'username email photo');

        // Create a map of student ID to submission
        const submissionMap = {};
        submissions.forEach(sub => {
            if (sub.student) {
                submissionMap[sub.student._id.toString()] = sub;
            }
        });

        // Build the complete list: all students with their submission status
        const allStudentSubmissions = classData.students.map(student => {
            const submission = submissionMap[student._id.toString()];

            if (submission) {
                // Student has submitted
                return submission;
            } else {
                // Student has not submitted - create a placeholder object
                return {
                    _id: null,
                    classwork: id,
                    student: {
                        _id: student._id,
                        username: student.username,
                        email: student.email,
                        photo: student.photo
                    },
                    status: 'not submitted',
                    attachments: [],
                    grade: null,
                    feedback: null
                };
            }
        });

        res.json(allStudentSubmissions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get my submission for an assignment
// @route   GET /api/classwork/:id/my-submission
// @access  Private
const getMySubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.user._id;
        const submission = await AssignmentSubmission.findOne({ classwork: id, student: studentId });
        if (!submission) {
            return res.status(404).json({ message: 'No submission found' });
        }
        res.json(submission);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Grade a submission
// @route   PUT /api/classwork/submissions/:subId
// @access  Private (Admin)
const gradeSubmission = async (req, res) => {
    try {
        const { subId } = req.params;
        const { grade, feedback } = req.body;
        const submission = await AssignmentSubmission.findById(subId);
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }
        submission.grade = grade;
        submission.feedback = feedback;
        submission.status = 'graded';
        await submission.save();
        res.json(submission);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Unsubmit an assignment
// @route   POST /api/classwork/:id/unsubmit
// @access  Private (Student)
const unsubmitAssignment = async (req, res) => {
    try {
        const { id } = req.params; // Classwork ID
        const studentId = req.user._id;

        // Find Submission
        const submission = await AssignmentSubmission.findOne({ classwork: id, student: studentId });
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Check if graded
        if (submission.status === 'graded') {
            return res.status(400).json({ message: 'Cannot unsubmit graded work' });
        }

        // Check Due Date
        const classwork = await Classwork.findById(id);
        if (classwork && classwork.dueDate) {
            const dueDate = new Date(classwork.dueDate);
            if (new Date() > dueDate) {
                return res.status(400).json({ message: 'Cannot unsubmit after due date' });
            }
        }

        // Delete Submission
        await AssignmentSubmission.findByIdAndDelete(submission._id);

        res.json({ message: 'Assignment unsubmitted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    submitAssignment,
    getSubmissions,
    getMySubmission,
    gradeSubmission,
    unsubmitAssignment
};
