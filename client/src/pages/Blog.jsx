import React from 'react';
import { Link } from 'react-router-dom';
import './Blog.css';
import BlogPost from '../components/BlogPost/BlogPost';

const sharedContent = (
    <>
        <p>Cheating in online exams is a growing concern. Muhafiz is an AI-powered solution that helps institutions maintain integrity during remote assessments.</p>
        <p>Our platform uses advanced computer vision and audio analysis to detect suspicious behaviors, including face mismatches, multiple persons, screen switching, and background voices.</p>
        <p>Institutes can now conduct proctored exams without manual invigilation, ensuring fairness and transparency for all candidates.</p>
    </>
);

const Blog = () => {
    return (
        <div className="blog-wrapper">
            <Link to="/" className="back-btn">← Back to Home</Link>
            <h1 className="blog-title">Our Latest Insights</h1>

            <BlogPost
                title="How AI Detects Cheating in Online Exams"
                date="June 25, 2025"
                author="Team Muhafiz"
                content={sharedContent}
            />

            <BlogPost
                title="Key Benefits of Using AI for Exam Proctoring"
                date="June 20, 2025"
                author="R&D Team"
                content={sharedContent}
            />

            <BlogPost
                title="Smart Proctoring with Muhafiz: A New Standard"
                date="June 15, 2025"
                author="Integration Team"
                content={sharedContent}
            />
        </div>
        
    );
};

export default Blog;
