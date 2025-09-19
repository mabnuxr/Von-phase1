import { render, screen } from '@testing-library/react';
import StatusMessages from '../../components/Status/Message/Message';

describe('StatusMessages', () => {
  it('renders all four status messages', () => {
    render(<StatusMessages />);

    expect(screen.getByText(/informational message/i)).toBeInTheDocument();
    expect(screen.getByText(/successful/i)).toBeInTheDocument();
    expect(screen.getByText(/double-check your input/i)).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('renders the correct icons', () => {
    render(<StatusMessages />);

    expect(screen.getByText('ℹ️')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
    expect(screen.getByText('❌')).toBeInTheDocument();
  });
});
