import React from 'react';

import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import './Pricing.css';

const plans = [
  {
    title: 'Starter',
    price: '₹0/month',
    features: [
      'Up to 5 Students per Class',
      '2 Proctored Tests Included',
      'Face Verification',
      'Limited Report Access',
    ],
  },
  {
    title: 'Standard',
    price: '₹699/month',
    features: [
      '6 to 60 Students per Class',
      '6 Proctored Tests Included',
      'Multiple Person Detection',
      'Voice & Tab Switching Alerts',
    ],
  },
  {
    title: 'Premium',
    price: '₹1699/month',
    features: [
      '61 to 160 Students per Class',
      '10 Proctored Tests Included',
      'Detailed Analytics Dashboard',
      'Live Admin Monitoring',
    ],
  },
];

const Pricing = () => {

  return (
    <div className="pricing-wrapper">
      <Navbar />
      <div className="pricing-content">
        <h1 className="pricing-title">Choose the Right Plan for You
          <br />(Not active currently)</h1>
        <div className="pricing-cards">
          {plans.map((plan, index) => (
            <div className="pricing-card" key={index}>
              <h3>{plan.title}</h3>
              <p className="price">{plan.price}</p>
              <ul>
                {plan.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
              <button className="btn pricing-btn">Get Started</button>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Pricing;
