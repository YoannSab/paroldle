import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import App from './components/App';
import AppChill from './componentsChill/App';
import './i18n';

ReactDOM.render(
  <ChakraProvider>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/chill" element={<AppChill />} />
      </Routes>
    </Router>
  </ChakraProvider>,
  document.getElementById('root')
);
