import { render, screen, fireEvent } from '@testing-library/react';
import EditableTable, {
  type EditableColumn,
} from '../../components/Data-grid/TableEditable/TableEditable';

beforeAll(() => {
  // Suppress RSuite warnings
  jest.spyOn(console, 'warn').mockImplementation((msg) => {
    if (typeof msg === 'string' && msg.includes('rsuite')) return;
    console.warn(msg);
  });
});

describe('EditableTable Component', () => {
  const columns: EditableColumn[] = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: 'Name', editable: true },
    { key: 'age', title: 'Age', editable: true },
  ];

  const data = [
    { id: 1, name: 'John', age: 30 },
    { id: 2, name: 'Jane', age: 25 },
  ];

  test('renders table with data', () => {
    render(<EditableTable data={data} columns={columns} />);

    // Use getByDisplayValue for editable input cells
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();

    // Non-editable cell (ID)
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('calls onChange when editable cell is modified', () => {
    const handleChange = jest.fn();
    render(<EditableTable data={data} columns={columns} onChange={handleChange} />);

    const nameInput = screen.getByDisplayValue('John');
    fireEvent.change(nameInput, { target: { value: 'Johnny' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith([
      { id: 1, name: 'Johnny', age: 30 },
      { id: 2, name: 'Jane', age: 25 },
    ]);
  });
});
