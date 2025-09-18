import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavigatioNav, { type NavItem } from '../../components/Navigation/Nav/Nav';

describe('NavigatioNav Component', () => {
  const items: NavItem[] = [
    { eventKey: 'home', label: 'Home' },
    { eventKey: 'dashboard', label: 'Dashboard' },
    { eventKey: 'settings', label: 'Settings', disabled: true },
  ];

  it('renders all items', () => {
    render(<NavigatioNav items={items} />);
    items.forEach((item) => {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    });
  });

  it('sets the activeKey correctly on initial render', () => {
    render(<NavigatioNav items={items} activeKey="dashboard" />);
    const activeItem = screen.getByText('Dashboard').closest('.rs-nav-item');
    expect(activeItem).toHaveClass('rs-nav-item-active');
  });

  it('changes active item when clicked', async () => {
    const onSelectMock = jest.fn();
    render(<NavigatioNav items={items} onSelect={onSelectMock} />);

    const homeItem = screen.getByText('Home');
    const dashboardItem = screen.getByText('Dashboard');

    await userEvent.click(dashboardItem);
    expect(dashboardItem.closest('.rs-nav-item')).toHaveClass('rs-nav-item-active');
    expect(homeItem.closest('.rs-nav-item')).not.toHaveClass('rs-nav-item-active');
    expect(onSelectMock).toHaveBeenCalledWith('dashboard');
  });

  it('does not allow click on disabled items', async () => {
    const onSelectMock = jest.fn();
    render(<NavigatioNav items={items} onSelect={onSelectMock} />);

    const disabledItem = screen.getByText('Settings');
    await userEvent.click(disabledItem);

    expect(disabledItem.closest('.rs-nav-item')).not.toHaveClass('rs-nav-item-active');
    expect(onSelectMock).not.toHaveBeenCalled();
  });

  it('renders vertical orientation correctly', () => {
    render(<NavigatioNav items={items} orientation="vertical" />);
    const nav = document.querySelector('.rs-nav');
    expect(nav).toHaveClass('rs-nav-vertical');
  });

  it('renders correct appearance', () => {
    render(<NavigatioNav items={items} appearance="tabs" />);
    const nav = document.querySelector('.rs-nav');
    expect(nav).toHaveClass('rs-nav-tabs');
  });
});
