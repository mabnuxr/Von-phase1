import type { Meta, StoryObj } from '@storybook/react-vite';
import EditableTable, { type EditableTableProps } from '../../components/Data-grid/TableEditable/TableEditable';
import { useState } from 'react';

const meta = {
  title: 'Data-grid/Table Editable',
  component: EditableTable,
} satisfies Meta<typeof EditableTable>;

export default meta;
type Story = StoryObj<typeof EditableTable>;

// Sample data
const sampleData = [
  { id: 1, name: 'Alice', age: 28, email: 'alice@example.com' },
  { id: 2, name: 'Bob', age: 34, email: 'bob@example.com' },
  { id: 3, name: 'Charlie', age: 23, email: 'charlie@example.com' },
];

const sampleColumns = [
  { key: 'name', title: 'Name', width: 150, editable: true },
  { key: 'age', title: 'Age', width: 100, editable: true },
  { key: 'email', title: 'Email', width: 250 },
];

export const Default: Story = {
  render: (args: EditableTableProps) => <EditableTable {...args} />,
  args: {
    data: sampleData,
    columns: sampleColumns,
    height: 400,
    bordered: true,
  },
};

export const WithChangeHandler: Story = {
  render: (args: EditableTableProps) => {
    const [data, setData] = useState(args.data);
    return (
      <EditableTable
        {...args}
        data={data}
        onChange={(updatedData) => {
          setData(updatedData);
          console.log('Updated Data:', updatedData);
        }}
      />
    );
  },
  args: Default.args,
};
