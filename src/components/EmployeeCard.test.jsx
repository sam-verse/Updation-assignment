import { render, screen } from '@testing-library/react';
import EmployeeCard from './EmployeeCard';

const mockEmployee = {
  id: '1',
  name: 'Shalin Jain',
  designation: 'CEO',
  team: 'Executive',
  managerId: null,
  email: 'ceo@happyfox.com',
  phone: '+1-555-0101',
  avatar: 'https://example.com/avatar.jpg'
};

test('renders employee details', () => {
  render(<EmployeeCard employee={mockEmployee} />);
  expect(screen.getByText(/Shalin Jain/i)).toBeInTheDocument();
  expect(screen.getByText(/CEO/i)).toBeInTheDocument();
  expect(screen.getByText(/Executive/i)).toBeInTheDocument();
}); 