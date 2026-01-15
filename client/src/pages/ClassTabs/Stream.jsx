import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { FaPaperPlane, FaUserCircle, FaPaperclip, FaFile, FaFilePdf, FaImage, FaTimes, FaTrash } from 'react-icons/fa';
import './Stream.css';
import { AuthContext } from '../../context/AuthContext';

import { io } from 'socket.io-client';

const Stream = ({ classId }) => {
    const { user } = useContext(AuthContext);
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);

    const fetchPosts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/posts/${classId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Fetched Posts:', res.data);
            setPosts(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();

        const socket = io('http://localhost:5000');

        socket.on('new_post', (post) => {
            if (post.class === classId) {
                setPosts(prev => [post, ...prev]);
            }
        });

        socket.on('update_post', (updatedPost) => {
            if (updatedPost.class === classId) {
                setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
            }
        });

        socket.on('delete_post', (deletedPostId) => {
            setPosts(prev => prev.filter(p => p._id !== deletedPostId));
        });

        return () => {
            socket.disconnect();
        };
    }, [classId]);

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handlePost = async (e) => {
        e.preventDefault();
        if (!newPost.trim() && !selectedFile) return;

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('content', newPost);
            formData.append('classId', classId);
            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            await axios.post('/api/posts', formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setNewPost('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            fetchPosts(); // Refresh posts
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to create post');
        }
    };

    const handleDelete = async (postId) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/posts/${postId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Socket will handle the removal from UI
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to delete post');
        }
    };

    const [commentInputs, setCommentInputs] = useState({});

    const handleCommentChange = (postId, value) => {
        setCommentInputs(prev => ({ ...prev, [postId]: value }));
    };

    const submitComment = async (postId) => {
        const content = commentInputs[postId]?.trim();
        if (!content) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/posts/${postId}/comment`,
                { content },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCommentInputs(prev => ({ ...prev, [postId]: '' })); // Clear input
            // Socket handles UI update, but we can fetch to be safe or rely on socket
            // fetchPosts(); // Optional if socket covers it
        } catch (err) {
            console.error(err);
            alert('Failed to add comment');
        }
    };

    const handleCommentKeyDown = (e, postId) => {
        if (e.key === 'Enter') {
            submitComment(postId);
        }
    };

    const renderAttachment = (attachment) => {
        if (!attachment) return null;
        const isImage = attachment.type && attachment.type.startsWith('image/');
        return (
            <div key={attachment._id} className="attachment-preview">
                {isImage ? (
                    <img src={attachment.url} alt={attachment.name} className="post-image" />
                ) : (
                    <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="file-link">
                        <FaFile /> {attachment.name}
                    </a>
                )}
            </div>
        );
    };

    if (loading) return <div className="loading-stream">Loading updates...</div>;

    return (
        <div className="stream-container">
            <div className="post-creator card">
                <form onSubmit={handlePost}>
                    <textarea
                        placeholder="Announce something to your class"
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                    />

                    {selectedFile && (
                        <div className="selected-file-preview">
                            <span><FaFile /> {selectedFile.name}</span>
                            <button type="button" onClick={() => {
                                setSelectedFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                            }}>
                                <FaTimes />
                            </button>
                        </div>
                    )}

                    <div className="post-actions">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                        <button type="button" className="attach-btn" onClick={() => fileInputRef.current.click()}>
                            <FaPaperclip /> Attach
                        </button>
                        <button type="submit" disabled={!newPost.trim() && !selectedFile}>
                            <FaPaperPlane /> Post
                        </button>
                    </div>
                </form>
            </div>

            <div className="stream-feed">
                {posts.length === 0 ? (
                    <div className="empty-stream">No posts yet. Be the first to start a conversation!</div>
                ) : (
                    posts.map(post => (
                        <div key={post._id} className="post-card card">
                            <div className="post-header">
                                <div className="author-avatar">
                                    {post.author?.photo ? (
                                        <img src={post.author.photo} alt={post.author.username} />
                                    ) : (
                                        <FaUserCircle />
                                    )}
                                </div>
                                <div className="post-meta">
                                    <span className="author-name">{post.author?.username || 'Unknown User'}</span>
                                    <span className="post-date">{new Date(post.createdAt).toLocaleString()}</span>
                                </div>
                                {(user?._id === post.author?._id || user?.role === 'admin') && (
                                    <button className="delete-post-btn" onClick={() => handleDelete(post._id)} title="Delete Post">
                                        <FaTrash />
                                    </button>
                                )}
                            </div>
                            <div className="post-body">
                                {post.content}
                                {post.attachments && post.attachments.map(att => renderAttachment(att))}
                            </div>
                            <div className="post-footer">
                                <div className="comments-section">
                                    {post.comments.length > 0 && (
                                        <div className="comments-list">
                                            {post.comments.map((c, idx) => (
                                                <div key={idx} className="comment">
                                                    <strong>{c.author?.username || 'Unknown'}: </strong>
                                                    {c.content}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="comment-input-wrapper">
                                        <input
                                            type="text"
                                            placeholder="Add class comment..."
                                            className="comment-input"
                                            value={commentInputs[post._id] || ''}
                                            onChange={(e) => handleCommentChange(post._id, e.target.value)}
                                            onKeyDown={(e) => handleCommentKeyDown(e, post._id)}
                                        />
                                        <button
                                            className="send-comment-btn"
                                            onClick={() => submitComment(post._id)}
                                            disabled={!commentInputs[post._id]?.trim()}
                                        >
                                            <FaPaperPlane />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Stream;
