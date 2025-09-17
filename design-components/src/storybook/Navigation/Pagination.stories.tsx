// components/NavigationPagination.stories.tsx

import React, { useState } from 'react';
import type{ Meta, Story } from '@storybook/react';
import NavigationPagination from '../../components/Navigation/Pagination/Pagination'

export default {
  title: 'Navigation/Pagination',
  component: NavigationPagination,
} as Meta;

const Template: Story<NavigationPaginationProps> = (args) => {
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
};

export const Default = Template.bind({});
Default.args = {
  total: 100,
  limit: 10,
  activePage: 1,
  size: 'md',
  layout: ['total', '-', 'pager', 'limit'],
  disabled: false,
  first: true,
  last: true,
  prev: true,
  next: true,
  boundaryLinks: true,
  ellipsis: true,
};

export const SmallSize = Template.bind({});
SmallSize.args = {
  ...Default.args,
  size: 'sm',
};

export const NoNavigationButtons = Template.bind({});
NoNavigationButtons.args = {
  ...Default.args,
  first: false,
  last: false,
  prev: false,
  next: false,
};

export const Disabled = Template.bind({});
Disabled.args = {
  ...Default.args,
  disabled: true,
};
