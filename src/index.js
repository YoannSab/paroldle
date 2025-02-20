import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './components/App';
import AppChill from './componentsChill/App';
import './compare_words';

ReactDOM.render(
  <ChakraProvider>
    <Router>
      <Routes>
        <Route path="/paroldle" element={<App />} />
        <Route path="/paroldle/chill" element={<AppChill />} />
      </Routes>
    </Router>
  </ChakraProvider>,
  document.getElementById('root')
);
