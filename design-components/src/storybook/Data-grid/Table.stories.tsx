import type { Meta, StoryObj } from '@storybook/react-vite';
import Table, { type TableProps } from '../../components/Data-grid/Table/Table';

const meta = {
  title: 'Data-Grid/Table',
  component: Table,
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof Table>;

// Sample data
const sampleData = [
  { id: 1, name: 'Alice', age: 28, email: 'alice@example.com' },
  { id: 2, name: 'Bob', age: 34, email: 'bob@example.com' },
  { id: 3, name: 'Charlie', age: 23, email: 'charlie@example.com' },
];

const sampleColumns = [
  { key: 'name', title: 'Name', width: 150 },
  { key: 'age', title: 'Age', width: 100 },
  { key: 'email', title: 'Email', width: 250 },
];

export const Default: Story = {
  render: (args: TableProps) => <Table {...args} />,
  args: {
    data: sampleData,
    columns: sampleColumns,
    height: 400,
    bordered: true,
    virtualized: false,
  },
};

export const Loading: Story = {
  render: (args: TableProps) => <Table {...args} />,
  args: { ...Default.args, loading: true },
};

export const Virtualized: Story = {
  render: (args: TableProps) => <Table {...args} />,
  args: { ...Default.args, virtualized: true, height: 300 },
};

export const CustomRowClick: Story = {
  render: (args: TableProps) => (
    <Table
      {...args}
      onRowClick={(rowData) => alert(`Clicked: ${rowData.name}`)}
    />
  ),
  args: Default.args,
};
