jest.mock('jspdf', () => {
  return function () {
    return { save: jest.fn() };
  };
});

jest.mock('html2canvas', () => {
  return () => Promise.resolve({}); // Return a simple mock object
});

import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app without crashing', () => {
  render(<App />);
  
  // Check that the app renders (look for the logo or header)
  const logos = screen.getAllByAltText(/HappyFox Logo/i);
  expect(logos.length).toBeGreaterThan(0);
  expect(screen.getByText(/happyfox/i)).toBeInTheDocument();
}); 