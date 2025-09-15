
import { render, screen, fireEvent } from '@testing-library/react';
import Table from '../components/Table/Table';

const mockData = [
  {
    id: 1,
    name: 'John Mitchell',
    title: 'CRO',
    target: '$26.4M',
    forecast: '$20.4M',
    commit: '$18.1M',
    children: [
      {
        id: 2,
        name: 'Maria Thompson',
        title: 'VP Sales - Enterprise',
        target: '$18.5M',
        forecast: '$7.8M',
        commit: '$7.0M',
      },
    ],
  },
];

describe('Table Component', () => {
  test('renders table headers correctly', () => {
    render(<Table data={mockData} />);
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Target')).toBeInTheDocument();
    expect(screen.getByText('AI Forecast')).toBeInTheDocument();
    expect(screen.getByText('Seller Commit')).toBeInTheDocument();
  });

  test('renders parent row data', () => {
    render(<Table data={mockData} />);
    expect(screen.getByText('John Mitchell')).toBeInTheDocument();
    expect(screen.getByText('CRO')).toBeInTheDocument();
    expect(screen.getByDisplayValue('$26.4M')).toBeInTheDocument();
  });

  test('does not render children by default', () => {
    render(<Table data={mockData} />);
    expect(screen.queryByText('Maria Thompson')).not.toBeInTheDocument();
  });

  test('renders children when expanded', () => {
    render(<Table data={mockData} />);
    const expandButton = screen.getByRole('button');
    fireEvent.click(expandButton);
    expect(screen.getByText('Maria Thompson')).toBeInTheDocument();
  });

  test('hides children when collapsed again', () => {
    render(<Table data={mockData} />);
    const expandButton = screen.getByRole('button');
    fireEvent.click(expandButton); // Expand
    fireEvent.click(expandButton); // Collapse
    expect(screen.queryByText('Maria Thompson')).not.toBeInTheDocument();
  });

  test('allows editing input values', () => {
    render(<Table data={mockData} />);
    const targetInput = screen.getByDisplayValue('$26.4M');
    fireEvent.change(targetInput, { target: { value: '$99.9M' } });
    expect(targetInput).toHaveValue('$99.9M');
  });

  test('renders flat data without crashing', () => {
    const flatData = [
      {
        id: 10,
        name: 'Solo Row',
        title: 'Individual Contributor',
        target: '$5.0M',
        forecast: '$4.0M',
        commit: '$3.0M',
      },
    ];
    render(<Table data={flatData} />);
    expect(screen.getByText('Solo Row')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument(); // No expand
  });

  test('handles deeply nested rows', () => {
    const deepData = [
      {
        id: 1,
        name: 'Level 1',
        title: '',
        target: '1',
        forecast: '1',
        commit: '1',
        children: [
          {
            id: 2,
            name: 'Level 2',
            title: '',
            target: '2',
            forecast: '2',
            commit: '2',
            children: [
              {
                id: 3,
                name: 'Level 3',
                title: '',
                target: '3',
                forecast: '3',
                commit: '3',
              },
            ],
          },
        ],
      },
    ];

    render(<Table data={deepData} />);

    // Expand to Level 2
    fireEvent.click(screen.getByRole('button', { name: /▸/ }));
    // Expand to Level 3
    fireEvent.click(screen.getAllByRole('button', { name: /▸/ })[0]);

    expect(screen.getByText('Level 3')).toBeInTheDocument();
  });
});
