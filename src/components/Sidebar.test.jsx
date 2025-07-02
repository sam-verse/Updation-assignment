import { render, screen } from '@testing-library/react';
import Sidebar from './Sidebar';

test('renders sidebar with search and filter functionality', () => {
  render(<Sidebar />);
  
  // Check that the sidebar renders with expected elements
  expect(screen.getByRole('heading', { name: /Employees/i })).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Search employees/i)).toBeInTheDocument();
  expect(screen.getByText(/All Teams/i)).toBeInTheDocument();
  expect(screen.getByText(/No employees found/i)).toBeInTheDocument();
  expect(screen.getByText(/0 employees/i)).toBeInTheDocument();
});

test('has add employee button', () => {
  render(<Sidebar />);
  
  const addButton = screen.getByTitle(/Add Employee/i);
  expect(addButton).toBeInTheDocument();
}); 