const Class = require('../models/Class');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Classwork = require('../models/Classwork');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Test = require('../models/Test');
const Result = require('../models/Result');

// Create Class
const createClass = async (req, res) => {
    const { name, section, subject, room } = req.body;

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Only admins can create classes' });
    }

    if (!name) return res.status(400).json({ message: 'Class name is required' });

    try {
        // Generate unique 6-char code
        let code;
        let exists = true;
        while (exists) {
            code = Math.random().toString(36).substring(2, 8).toUpperCase();
            exists = await Class.findOne({ code });
        }

        // Random Gradient
        const gradients = [
            'linear-gradient(135deg, #FF6B6B 0%, #556270 100%)',
            'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            'linear-gradient(135deg, #FC466B 0%, #3F5EFB 100%)',
            'linear-gradient(135deg, #c31432 0%, #240b36 100%)'
        ];
        const bannerImage = gradients[Math.floor(Math.random() * gradients.length)];

        const newClass = await Class.create({
            name,
            section,
            subject,
            room,
            teacher: req.user._id,
            code,
            bannerImage
        });

        res.status(201).json(newClass);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Join Class
const joinClass = async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Code required' });

    try {
        const classroom = await Class.findOne({ code });
        if (!classroom) return res.status(404).json({ message: 'Invalid Class Code' });

        if (classroom.students.includes(req.user._id)) {
            return res.status(400).json({ message: 'Already joined' });
        }

        if (classroom.teacher.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Teachers cannot join their own class as student' });
        }

        classroom.students.push(req.user._id);
        await classroom.save();

        res.json({ message: 'Joined successfully', classId: classroom._id });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get My Classes (Teacher: Created, Student: Joined)
const getMyClasses = async (req, res) => {
    try {
        let classes;
        if (req.user.role === 'admin' || req.user.role === 'teacher') {
            // Fetch Created
            classes = await Class.find({ teacher: req.user._id })
                .populate('students', 'username email')
                .populate('teacher', 'username');
        } else {
            // Fetch Joined
            classes = await Class.find({ students: req.user._id }).populate('teacher', 'username');
        }

        // Normalize response for frontend
        const payload = classes.map(c => ({
            id: c._id,
            name: c.name,
            section: c.section,
            teacherName: c.teacher?.username || 'Instructor',
            teacherId: c.teacher?._id || c.teacher, // Add ID for permission checks
            studentCount: c.students.length,
            bannerImage: c.bannerImage,
            code: c.code
        }));

        res.json(payload);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get Single Class
const getClassById = async (req, res) => {
    try {
        const cls = await Class.findById(req.params.id)
            .populate('teacher', 'username email photo')
            .populate('students', 'username email photo');

        if (!cls) return res.status(404).json({ message: 'Class not found' });
        res.json(cls);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get Class Members (Teachers & Students)
const getClassMembers = async (req, res) => {
    try {
        const cls = await Class.findById(req.params.id)
            .populate('teacher', 'username email photo role')
            .populate('students', 'username email photo role');

        if (!cls) return res.status(404).json({ message: 'Class not found' });

        res.json({
            teacher: cls.teacher,
            students: cls.students
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Mark Attendance
const markAttendance = async (req, res) => {
    const { date, records } = req.body;
    const classId = req.params.id;

    try {
        // Upsert attendance record
        let attendance = await Attendance.findOne({ classId, date });

        if (attendance) {
            attendance.records = records;
            await attendance.save();
        } else {
            attendance = await Attendance.create({
                classId,
                date,
                records
            });
        }

        res.json({ message: 'Attendance saved', attendance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get Attendance
const getAttendance = async (req, res) => {
    const { date } = req.query;
    const classId = req.params.id;

    try {
        const attendance = await Attendance.findOne({ classId, date });
        res.json(attendance || { records: [] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get Gradebook
const getGradebook = async (req, res) => {
    const classId = req.params.id;

    try {
        const cls = await Class.findById(classId).populate('students', 'username email');
        if (!cls) return res.status(404).json({ message: 'Class not found' });

        // 1. Get all Classworks (Assignments only, exclude material)
        const classworks = await Classwork.find({
            class: classId,
            type: 'assignment'
        }).select('title type maxGrade');

        // 2. Get all Tests created by this teacher (Assuming tests are linked by creator for now)
        // Ideally Tests should have a classId, but per current schema they don't.
        // We will fetch tests created by the class teacher.
        const tests = await Test.find({ createdBy: cls.teacher }).select('title totalPoints questions');

        // 3. Get Student Submissions
        const submissions = await AssignmentSubmission.find({
            classwork: { $in: classworks.map(cw => cw._id) }
        });

        // 4. Get Test Results
        const results = await Result.find({
            testId: { $in: tests.map(t => t._id) }
        });

        // 5. Aggregate Data
        const gradebook = cls.students.map(student => {
            const studentGrades = {};

            // Map Assignments
            classworks.forEach(cw => {
                const sub = submissions.find(s =>
                    s.classwork.toString() === cw._id.toString() &&
                    s.student.toString() === student._id.toString()
                );
                studentGrades[`cw_${cw._id}`] = sub ? (sub.grade !== null ? `${sub.grade}/${cw.maxGrade}` : 'Submitted') : '-';
            });

            // Map Tests
            tests.forEach(test => {
                const res = results.find(r =>
                    r.testId.toString() === test._id.toString() &&
                    (r.studentId?.toString() === student._id.toString() || r.studentEmail === student.email)
                );
                // Calculate total points for test if not stored directly
                let testTotal = 0;
                if (test.questions && test.questions.length > 0) {
                    testTotal = test.questions.reduce((sum, q) => sum + (q.points || 1), 0);
                }

                studentGrades[`test_${test._id}`] = res ? `${res.score}/${res.totalPoints || testTotal}` : '-';
            });

            return {
                id: student._id,
                name: student.username,
                email: student.email,
                grades: studentGrades
            };
        });

        res.json({
            columns: [
                ...classworks.map(cw => ({ id: `cw_${cw._id}`, label: cw.title, type: 'assignment' })),
                ...tests.map(t => ({ id: `test_${t._id}`, label: t.title, type: 'test' }))
            ],
            data: gradebook
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Remove Student from Class
const removeStudent = async (req, res) => {
    const classId = req.params.id;
    const { studentId } = req.body;

    try {
        const cls = await Class.findById(classId);
        if (!cls) return res.status(404).json({ message: 'Class not found' });

        // Authorization check: Only teacher can remove
        if (cls.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the class teacher can remove students.' });
        }

        // Remove student
        cls.students = cls.students.filter(id => id.toString() !== studentId);
        await cls.save();

        res.json({ message: 'Student removed successfully', students: cls.students });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Delete Class
const deleteClass = async (req, res) => {
    try {
        const cls = await Class.findById(req.params.id);

        if (!cls) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Check if user is the teacher
        if (cls.teacher.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete this class' });
        }

        await cls.deleteOne(); // or Class.findByIdAndDelete(req.params.id)

        res.json({ message: 'Class removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createClass,
    joinClass,
    getMyClasses,
    getClassById,
    getClassMembers,
    markAttendance,
    getAttendance,
    getGradebook,
    removeStudent,
    deleteClass
};
