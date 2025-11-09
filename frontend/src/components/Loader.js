import React from 'react';
import './Loader.css';

const Loader = () => (
  <div className="loader">
    <div className="loader-spinner" aria-hidden="true" />
    <span className="loader-text">Loading…</span>
  </div>
);

export default Loader;
