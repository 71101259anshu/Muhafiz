import React from 'react';
import heroVideo from '../assets/HeroSectionVideo.mp4';

import Navbar from '../components/Navbar/Navbar';
import Hero from '../components/Hero/Hero';
import ClassroomPreview from '../components/ClassroomPreview/ClassroomPreview';
import Features from '../components/Features/Features';
import FeatureDemos from '../components/FeatureDemos/FeatureDemos';
import Footer from '../components/Footer/Footer';

import './Homepage.css';

const Homepage = () => {

  return (
    <div className="homepage-wrapper">
      {/* Single shared video for Navbar + Hero */}
      <video
        className="homepage-video-bg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src={heroVideo} type="video/mp4" />
      </video>
      <div className="homepage-video-overlay"></div>

      <Navbar />
      <Hero />
      <ClassroomPreview />
      <Features />
      <FeatureDemos />
      <Footer />
    </div>
  );
};

export default Homepage;
