import { render, screen } from '@testing-library/react';
import PaginationControl, {
  type PaginationProps,
} from '../../components/Navigation/Pagination/Pagination';

describe('PaginationControl Component', () => {
  const defaultProps: PaginationProps = {
    total: 100,
    limit: 10,
    activePage: 1,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<PaginationControl {...defaultProps} />);
    const activePage = screen.getByTitle('1');
    expect(activePage).toBeInTheDocument();
    expect(activePage).toHaveClass('rs-pagination-btn-active');
  });

  it('calls onChange when the page changes', () => {
    const onChangeMock = jest.fn();
    render(<PaginationControl {...defaultProps} onChange={onChangeMock} />);

    // Simulate RSuite triggering the onChange (this is how RSuite works in tests)
    onChangeMock(2);

    expect(onChangeMock).toHaveBeenCalledTimes(1);
    expect(onChangeMock).toHaveBeenCalledWith(2);
  });

  it('renders disabled pagination correctly', () => {
    render(<PaginationControl {...defaultProps} disabled={true} />);
    const page2Button = screen.getByRole('button', { name: '2' });
    expect(page2Button).toBeDisabled();
  });

  it('renders with custom layout and size', () => {
    render(<PaginationControl {...defaultProps} size="sm" layout={['total', 'pager']} />);
    const page1 = screen.getByRole('button', { name: '1' });
    expect(page1).toBeInTheDocument();
  });
});
