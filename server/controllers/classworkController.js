const Classwork = require('../models/Classwork');

// Create Classwork (Admin only)
const createClasswork = async (req, res) => {
    try {
        console.log("Create Classwork Request Body:", req.body);
        console.log("Create Classwork File:", req.file);

        const { classId, title, description, type, topic, dueDate } = req.body;

        // Verify Admin Role
        if (req.user.role !== 'admin') {
            console.log("Unauthorized: User is not admin");
            return res.status(401).json({ message: 'Only teachers can create classwork' });
        }

        const classworkData = {
            class: classId,
            author: req.user._id,
            title,
            description,
            type,
            topic: topic || 'General',
            // Only set dueDate if it exists and is not 'undefined' string (FormData artifact)
            dueDate: (dueDate && dueDate !== 'undefined' && dueDate !== '') ? dueDate : null,
            maxGrade: req.body.maxGrade || 100,
            attachments: []
        };

        if (req.file) {
            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            classworkData.attachments.push({
                url: fileUrl,
                name: req.file.originalname,
                fileType: req.file.mimetype
            });
        }

        const newClasswork = await Classwork.create(classworkData);

        // Auto-create a post in the stream to announce the new classwork
        const Post = require('../models/Post');
        const announcementContent = type === 'assignment'
            ? `📝 New Assignment: ${title}${dueDate ? `\nDue: ${new Date(dueDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}`
            : `📚 New Material: ${title}`;

        await Post.create({
            content: announcementContent,
            author: req.user._id,
            class: classId,
            attachments: classworkData.attachments
        });

        res.status(201).json(newClasswork);

    } catch (err) {
        console.error("Create Classwork Error:", err);
        res.status(500).json({ message: err.message, stack: err.stack });
    }
};

// Get Classwork (Grouped by Topic or Flat list)
const getClasswork = async (req, res) => {
    try {
        const classwork = await Classwork.find({ class: req.params.classId })
            .sort({ createdAt: -1 });

        // If student, attach submission status
        if (req.user.role === 'student') {
            const AssignmentSubmission = require('../models/AssignmentSubmission');
            const submissions = await AssignmentSubmission.find({
                classwork: { $in: classwork.map(c => c._id) },
                student: req.user._id
            });

            // Map submissions to classwork
            const classworkWithStatus = classwork.map(item => {
                const sub = submissions.find(s => s.classwork.toString() === item._id.toString());
                const isSubmitted = sub && sub.status !== 'working' && sub.status !== 'returned'; // strictly submitted/graded
                // Or simplified: Just check if sub exists and is not 'working' if we treat 'returned' as submitted-ish? 
                // Requirement: "not submitted". 
                // If status is 'working', it is NOT submitted.
                // If status is 'submitted', 'graded', 'late', it IS submitted.
                // If status is 'returned', usually means valid submission exists but sent back.

                return {
                    ...item.toObject(),
                    isSubmitted: sub ? (sub.status !== 'working') : false,
                    mySubmission: sub // Optional: pass full sub if needed
                };
            });
            return res.json(classworkWithStatus);
        }

        // If Admin/Teacher, attach 'ungradedCount'
        if (req.user.role === 'admin') {
            const AssignmentSubmission = require('../models/AssignmentSubmission');
            // Get all submissions for these classworks that are submitted or late (ready to grade)
            // status: 'submitted' or 'late'. 'graded' is done. 'working' is not ready. 'returned' is done/pending student.
            const submissions = await AssignmentSubmission.find({
                classwork: { $in: classwork.map(c => c._id) },
                status: { $in: ['submitted', 'late'] }
            });

            const classworkWithCounts = classwork.map(item => {
                const count = submissions.filter(s => s.classwork.toString() === item._id.toString()).length;
                return {
                    ...item.toObject(),
                    ungradedCount: count
                };
            });
            return res.json(classworkWithCounts);
        }

        res.json(classwork);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Delete Classwork (Admin only)
const deleteClasswork = async (req, res) => {
    try {
        const item = await Classwork.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Classwork not found' });
        }

        // Verify Admin Role or Author
        // Strictly admin based on requirements, but often author too. Sticking to Admin/Role based logic.
        if (req.user.role !== 'admin' && item.author.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete' });
        }

        await item.deleteOne();
        res.json({ message: 'Classwork removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update Classwork (Admin only)
const updateClasswork = async (req, res) => {
    try {
        const item = await Classwork.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Classwork not found' });
        }

        // Verify Admin Role
        if (req.user.role !== 'admin' && item.author.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to update' });
        }

        const { title, description, topic, dueDate, maxGrade } = req.body;

        // Update fields
        if (title) item.title = title;
        if (description) item.description = description;
        if (topic) item.topic = topic;
        // Check explicitly for undefined/null to allow clearing if needed, though usually just updating to new value
        if (dueDate !== undefined) item.dueDate = (dueDate && dueDate !== 'undefined' && dueDate !== '') ? dueDate : null;
        if (maxGrade) item.maxGrade = maxGrade;

        await item.save();
        res.json(item);
    } catch (err) {
        console.error("Update Classwork Error:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createClasswork, getClasswork, deleteClasswork, updateClasswork };
