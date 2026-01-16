import React from 'react';



import Navbar from '../components/Navbar/Navbar';
import Hero from '../components/Hero/Hero';
import ClassroomPreview from '../components/ClassroomPreview/ClassroomPreview';
import Features from '../components/Features/Features';
import Footer from '../components/Footer/Footer';


import './Homepage.css';

const Homepage = () => {

  return (
    <div className="homepage-wrapper">
      <Navbar />
      <Hero />
      <ClassroomPreview />
      <Features />
      <Footer />
    </div>
  );
};

export default Homepage;
