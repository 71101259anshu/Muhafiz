const Class = require('../models/Class');
const User = require('../models/User');

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
            classes = await Class.find({ teacher: req.user._id }).populate('students', 'name email');
        } else {
            // Fetch Joined
            classes = await Class.find({ students: req.user._id }).populate('teacher', 'name');
        }

        // Normalize response for frontend
        const payload = classes.map(c => ({
            id: c._id,
            name: c.name,
            section: c.section,
            teacherName: c.teacher?.name || 'Instructor',
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

module.exports = { createClass, joinClass, getMyClasses, getClassById };
