import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavigationBreadcrumb from '../../components/Navigation/Breadcrumb/Breadcrumb';

describe('NavigationBreadcrumb Component', () => {
  const items = [
    { label: 'Home', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Data', href: '/data' },
  ];

  it('renders all items', () => {
    render(<NavigationBreadcrumb items={items} />);
    items.forEach((item) => {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    });
  });

  it('last item should be active', () => {
    render(<NavigationBreadcrumb items={items} />);
    const lastItem = screen.getByText('Data').closest('.rs-breadcrumb-item');
    expect(lastItem).toHaveClass('rs-breadcrumb-item-active');
  });

  it('renders custom separator', () => {
    const separator = '>';
    render(<NavigationBreadcrumb items={items} separator={separator} />);
    const separators = screen.getAllByText(separator);
    expect(separators.length).toBe(items.length - 1);
  });

  it('last item is visually disabled when disabledLast=true', () => {
    render(<NavigationBreadcrumb items={items} disabledLast />);
    const lastItem = screen.getByText('Data').closest('.rs-breadcrumb-item');

    // Visual verification
    expect(lastItem).toHaveClass('rs-breadcrumb-item-active');

    // href should be removed
    expect(lastItem?.querySelector('a')).toBeNull();
  });

  it('allows clicks on non-last items', async () => {
    const onClickMock = jest.fn();
    const clickableItems = [
      { label: 'Home', onClick: onClickMock },
      { label: 'Dashboard', onClick: onClickMock },
      { label: 'Data', onClick: onClickMock },
    ];

    render(<NavigationBreadcrumb items={clickableItems} disabledLast />);
    await userEvent.click(screen.getByText('Home'));
    await userEvent.click(screen.getByText('Dashboard'));

    expect(onClickMock).toHaveBeenCalledTimes(2);
  });

  it('last item does not have href when disabledLast=true', async () => {
    const onClickMock = jest.fn();
    const clickableItems = [
      { label: 'Home', onClick: onClickMock },
      { label: 'Dashboard', onClick: onClickMock },
      { label: 'Data', onClick: onClickMock },
    ];

    render(<NavigationBreadcrumb items={clickableItems} disabledLast />);
    const lastItem = screen.getByText('Data').closest('.rs-breadcrumb-item');

    // last item link should be removed
    expect(lastItem?.querySelector('a')).toBeNull();
  });
});
