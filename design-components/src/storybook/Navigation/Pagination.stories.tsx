// components/NavigationPagination.stories.tsx

import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import NavigationPagination from '../../components/Navigation/Pagination/Pagination'

const meta = {
  title: 'Navigation/Pagination',
  component: NavigationPagination,
} satisfies Meta<typeof NavigationPagination>;

export default meta;

type Story = StoryObj<typeof NavigationPagination>;

function WithState(args: React.ComponentProps<typeof NavigationPagination>) {
  const [page, setPage] = useState(args.activePage);

  return (
    <NavigationPagination
      {...args}
      activePage={page}
      onChange={(nextPage) => {
        setPage(nextPage);
        args.onChange?.(nextPage);
      }}
    />
  );
}

export const Default: Story = {
  render: (args) => <WithState {...args} />,
  args: {
  total: 100,
  limit: 10,
  activePage: 1,
  layout: ['total', '-', 'pager', 'limit'],
  disabled: false,
  first: true,
  last: true,
  prev: true,
  next: true,
  boundaryLinks: true,
  ellipsis: true,
  },
};

export const SmallSize: Story = {
  render: (args) => <WithState {...args} />,
  args: { ...Default.args, activePage: 1 },
};

export const NoNavigationButtons: Story = {
  render: (args) => <WithState {...args} />,
  args: { ...Default.args, first: false, last: false, prev: false, next: false },
};

export const Disabled: Story = {
  render: (args) => <WithState {...args} />,
  args: { ...Default.args, disabled: true },
};
