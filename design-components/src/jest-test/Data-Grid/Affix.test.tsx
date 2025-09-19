import { render, screen } from '@testing-library/react';
import AffixTable, { type AffixColumn } from '../../components/Data-grid/Table-Affix/TableAffix';

beforeAll(() => {
  // Suppress specific rsuite console warnings during tests
  jest.spyOn(console, 'warn').mockImplementation((msg) => {
    if (typeof msg === 'string' && msg.includes('rsuite')) {
      return;
    }
    console.warn(msg);
  });
});

describe('AffixTable Component', () => {
  const columns: AffixColumn[] = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: 'Name' },
    { key: 'age', title: 'Age' },
  ];

  const data = [
    { id: 1, name: 'John', age: 30 },
    { id: 2, name: 'Jane', age: 25 },
  ];

  test('renders table with data', () => {
    render(<AffixTable data={data} columns={columns} />);
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });

  test('renders loading state', () => {
    render(<AffixTable data={[]} columns={columns} loading />);
    // Check if table container is present (rsuite uses aria-busy)
    const table = screen.getByRole('grid');
    expect(table).toHaveAttribute('aria-busy', 'true');
  });
});
