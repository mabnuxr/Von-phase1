import { render, screen, fireEvent } from '@testing-library/react';
import VirtualizedTable, { type VirtualizedColumn } from '../../components/Data-grid/VirtualTable/VirtualTable';

describe('VirtualizedTable Component', () => {
  const columns: VirtualizedColumn[] = [
    { key: 'id', title: 'ID', width: 100 },
    { key: 'name', title: 'Name', width: 200 },
    { key: 'age', title: 'Age', width: 100 },
  ];

  const data = [
    { id: 1, name: 'John', age: 30 },
    { id: 2, name: 'Jane', age: 25 },
  ];

  test('renders table with data', () => {
    render(<VirtualizedTable data={data} columns={columns} />);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();

    // Row values
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  test('calls onRowClick when a row is clicked', () => {
    const handleRowClick = jest.fn();
    render(<VirtualizedTable data={data} columns={columns} onRowClick={handleRowClick} />);

    const row = screen.getByText('John').closest('.rs-table-row');
    fireEvent.click(row!);

    expect(handleRowClick).toHaveBeenCalledTimes(1);
    expect(handleRowClick).toHaveBeenCalledWith(expect.objectContaining({ id: 1, name: 'John', age: 30 }), expect.any(Object));
  });

  test('renders loader when loading is true', () => {
    render(<VirtualizedTable data={data} columns={columns} loading />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });
});
