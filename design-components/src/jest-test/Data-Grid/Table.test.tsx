import { render, screen } from '@testing-library/react';
import Table from '../../components/Data-grid/Table/Table';

const columns = [
  { key: 'id', title: 'ID' },
  { key: 'name', title: 'Name' },
  { key: 'age', title: 'Age' },
];

describe('Table component', () => {
  test('shows loading state', () => {
    render(<Table data={[]} columns={columns} loading />);
    
    // Look for RSuite loader by class
    const loader = document.querySelector('.rs-table-loader');
    expect(loader).toBeInTheDocument();
    expect(loader).toHaveTextContent('Loading...');
  });

  test('renders rows correctly', () => {
    const data = [{ id: 1, name: 'Alice', age: 25 }];
    render(<Table data={data} columns={columns} />);
    
    // Check if header cells are rendered
    columns.forEach(col => {
      expect(screen.getByText(col.title)).toBeInTheDocument();
    });

    // Check if row data is rendered
    data.forEach(row => {
      expect(screen.getByText(String(row.id))).toBeInTheDocument();
      expect(screen.getByText(row.name)).toBeInTheDocument();
      expect(screen.getByText(String(row.age))).toBeInTheDocument();
    });
  });
});
