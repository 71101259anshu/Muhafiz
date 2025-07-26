// src/components/BlogPost/BlogPost.jsx
import React from 'react';
import './BlogPost.css';

const BlogPost = ({ title, date, author, content }) => {
  return (
    <article className="blog-post">
      <h2>{title}</h2>
      <p className="meta">
        {date} | by <span>{author}</span>
      </p>
      <div className="content">{content}</div>
    </article>
  );
};

export default BlogPost;
