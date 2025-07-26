import React from 'react';
import { Link } from 'react-router-dom';
import './Pricing.css';

const plans = [
  {
    title: 'Free Plan',
    price: '₹0',
    features: [
      '1 Proctored Test',
      'Face Verification',
      'Limited Report Access',
    ],
  },
  {
    title: 'Pro Plan',
    price: '₹499/month',
    features: [
      'Unlimited Tests',
      'Multiple Person Detection',
      'Voice & Tab Switching Alerts',
      'Detailed Analytics Dashboard',
    ],
  },
  {
    title: 'Enterprise',
    price: 'Custom Pricing',
    features: [
      'Integration with LMS/Google Forms',
      'Live Admin Monitoring',
      'Dedicated Support',
    ],
  },
];

const Pricing = () => {
  return (
    <div className="pricing-wrapper">
      <Link to="/" className="back-btn">← Back to Home</Link>
      <h1 className="pricing-title">Choose the Right Plan for You
        <br/>(Not active currently)</h1>
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
  );
};

export default Pricing;
