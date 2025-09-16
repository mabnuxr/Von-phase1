import type { Meta, StoryObj } from '@storybook/react';
import { RsuitsTable } from '../components/RsuitsTable';
import type { RsuitsRowData } from '../components/RsuitsTable';

const meta = {
  title: 'Components/RsuitsTable',
  component: RsuitsTable,
} satisfies Meta<typeof RsuitsTable>;

export default meta;

type Story = StoryObj<typeof meta>;

const sampleData: RsuitsRowData[] = [
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
      {
        id: 3,
        name: 'Robert Anderson',
        title: 'VP Sales - Mid-Market',
        target: '$6.5M',
        forecast: '$3.2M',
        commit: '$2.8M',
      },
    ],
  },
];

export const Default: Story = {
  args: {
    data: sampleData,
  },
}; 