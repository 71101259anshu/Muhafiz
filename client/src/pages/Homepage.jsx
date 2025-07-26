import React from 'react';
import { Link } from 'react-router-dom';

import Navbar from '../components/Navbar/Navbar';
import Hero from '../components/Hero/Hero';
import Features from '../components/Features/Features';
import PreFooter from '../components/PreFooter/PreFooter';
import Footer from '../components/Footer/Footer';


const Homepage = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <PreFooter />
      <Footer />
    </>
  );
};

export default Homepage;
