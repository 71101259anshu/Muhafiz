const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// ... inside seedQuiz
const user = await User.findOne();
if (!user) {
    console.log("No user found. Seeding without creator.");
}

const test = new Test({
    title: "Sample Quiz-7 (Feature Test)",
    description: "A comprehensive test to verify Auto-Grading, Exact Match, and File Uploads.",
    duration: 30,
    startTime: startTimeResult,
    inviteCode: generateInviteCode(),
    questions: questions,
    biometricEnabled: false,
    createdBy: user ? user._id : null
});

await test.save();
console.log(`✅ Test Created Successfully!`);
console.log(`Title: ${test.title}`);
console.log(`Invite Code: ${test.inviteCode}`);
console.log(`Start Time: ${test.startTime}`);

process.exit();
    } catch (err) {
    console.error(err);
    process.exit(1);
}
};

seedQuiz();
