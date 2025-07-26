import React from 'react';
import './CommonInput.css';

const CommonInput = ({ name, type, placeholder, value, onChange }) => {
  return (
    <div className="input-group">
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
      />
    </div>
  );
};

export default CommonInput;
