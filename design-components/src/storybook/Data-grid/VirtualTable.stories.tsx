import type { Meta, StoryObj } from '@storybook/react-vite';
import VirtualizedTable, {
  type VirtualizedTableProps,
} from '../../components/Data-grid/VirtualTable/VirtualTable';

const meta = {
  title: 'Data-Grid/Virtualized',
  component: VirtualizedTable,
} satisfies Meta<typeof VirtualizedTable>;

export default meta;
type Story = StoryObj<typeof VirtualizedTable>;

// Sample large dataset
const sampleData = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  age: 20 + (i % 30),
  email: `user${i + 1}@example.com`,
}));

const sampleColumns = [
  { key: 'name', title: 'Name', width: 150 },
  { key: 'age', title: 'Age', width: 100 },
  { key: 'email', title: 'Email', width: 250 },
];

export const Default: Story = {
  render: (args: VirtualizedTableProps) => <VirtualizedTable {...args} />,
  args: {
    data: sampleData,
    columns: sampleColumns,
    height: 400,
    bordered: true,
  },
};

export const Loading: Story = {
  render: (args: VirtualizedTableProps) => <VirtualizedTable {...args} />,
  args: { ...Default.args, loading: true },
};

export const CustomRowClick: Story = {
  render: (args: VirtualizedTableProps) => (
    <VirtualizedTable {...args} onRowClick={(rowData) => alert(`Clicked: ${rowData.name}`)} />
  ),
  args: Default.args,
};
