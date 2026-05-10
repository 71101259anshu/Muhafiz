const nodemailer = require('nodemailer');

const sendEmail = async ({ email, subject, html }) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"Muhafiz Admin" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: subject,
            html: html,
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error(`Error sending email to ${email}:`, error);
        return false;
    }
};

module.exports = sendEmail;
