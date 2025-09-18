import type { Meta, StoryObj } from '@storybook/react-vite';
import InteractiveTreeTable, {
  type InteractiveTreeTableProps,
} from '../../components/Data-grid/TreeTable/TreeTable';

const meta = {
  title: 'Data-grid/Table Tree Interactive',
  component: InteractiveTreeTable,
} satisfies Meta<typeof InteractiveTreeTable>;

export default meta;
type Story = StoryObj<typeof InteractiveTreeTable>;

// Sample hierarchical data
const sampleData = [
  {
    id: 1,
    name: 'Parent 1',
    age: 50,
    email: 'parent1@example.com',
    children: [
      { id: 11, name: 'Child 1-1', age: 20, email: 'child1-1@example.com' },
      { id: 12, name: 'Child 1-2', age: 22, email: 'child1-2@example.com' },
    ],
  },
  {
    id: 2,
    name: 'Parent 2',
    age: 48,
    email: 'parent2@example.com',
    children: [{ id: 21, name: 'Child 2-1', age: 18, email: 'child2-1@example.com' }],
  },
];

const sampleColumns = [
  { key: 'name', title: 'Name', width: 200 },
  { key: 'age', title: 'Age', width: 100 },
  { key: 'email', title: 'Email', width: 250 },
];

export const Default: Story = {
  render: (args: InteractiveTreeTableProps) => <InteractiveTreeTable {...args} />,
  args: {
    data: sampleData,
    columns: sampleColumns,
    height: 400,
    bordered: true,
  },
};
