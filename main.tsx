import React from 'react';
import ReactDOM from 'react-dom/client';
import TimezoneConverter from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <TimezoneConverter />
  </React.StrictMode>
);