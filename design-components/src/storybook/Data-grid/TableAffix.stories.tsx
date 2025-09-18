import type { Meta, StoryObj } from '@storybook/react-vite';
import AffixTable, {
  type AffixTableProps,
} from '../../components/Data-grid/Table-Affix/TableAffix';

const meta = {
  title: 'Data-grid/Table Affix',
  component: AffixTable,
} satisfies Meta<typeof AffixTable>;

export default meta;
type Story = StoryObj<typeof AffixTable>;

// Sample data
const sampleData = Array.from({ length: 50 }, (_, i) => ({
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
  render: (args: AffixTableProps) => <AffixTable {...args} />,
  args: {
    data: sampleData,
    columns: sampleColumns,
    height: 400,
    bordered: true,
    affixHeader: true,
    affixHorizontalScrollbar: true,
  },
};

export const Loading: Story = {
  render: (args: AffixTableProps) => <AffixTable {...args} />,
  args: { ...Default.args, loading: true },
};

export const CustomRowClick: Story = {
  render: (args: AffixTableProps) => (
    <AffixTable {...args} onRowClick={(rowData) => alert(`Clicked: ${rowData.name}`)} />
  ),
  args: Default.args,
};
