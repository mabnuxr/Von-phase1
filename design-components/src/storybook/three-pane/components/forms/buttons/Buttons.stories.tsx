import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  PlusIcon,
  SidebarSimpleIcon,
  ArrowsInLineVerticalIcon,
  ArrowLeftIcon,
  DotsThreeIcon,
} from '@phosphor-icons/react';
import {
  HeroButton,
  HeroIconButton,
  PrimaryButton,
  SecondaryButton,
  GhostButton,
  PillButton,
  AddButton,
  PrimaryIconButton,
  SecondaryIconButton,
  TertiaryIconButton,
} from '../../../../../components/forms/buttons';

// Generic component for stories that showcase multiple button types
const ButtonShowcase = () => <div>Button Components</div>;

const meta = {
  title: 'Components/Forms/Buttons',
  component: ButtonShowcase,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'white',
      values: [{ name: 'white', value: '#ffffff' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ButtonShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Button Hierarchy Overview
// ============================================================================

/**
 * All Buttons
 *
 * Complete button hierarchy from highest to lowest prominence:
 * 1. HeroButton - Main CTA with gradient (e.g., "New chat")
 * 2. PrimaryButton - Dark solid button (e.g., "Save")
 * 3. SecondaryButton - Outlined button (e.g., alternative actions)
 * 4. GhostButton - Subtle gray button (e.g., "Discard", "Cancel")
 * 5. PillButton - Small inline action (e.g., "Add Filter")
 */
export const AllButtons: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <HeroButton icon={<PlusIcon size={14} weight="bold" />}>Hero Button</HeroButton>
        <span className="text-xs text-gray-500">Main CTA - highest prominence</span>
      </div>
      <div className="flex items-center gap-4">
        <PrimaryButton>Primary Button</PrimaryButton>
        <span className="text-xs text-gray-500">Primary actions - Save, Confirm</span>
      </div>
      <div className="flex items-center gap-4">
        <SecondaryButton>Secondary Button</SecondaryButton>
        <span className="text-xs text-gray-500">Secondary actions - outlined</span>
      </div>
      <div className="flex items-center gap-4">
        <GhostButton>Ghost Button</GhostButton>
        <span className="text-xs text-gray-500">Tertiary actions - Discard, Cancel</span>
      </div>
      <div className="flex items-center gap-4">
        <PillButton icon={<PlusIcon size={10} weight="bold" />}>Pill Button</PillButton>
        <span className="text-xs text-gray-500">Small inline actions</span>
      </div>
    </div>
  ),
};

// ============================================================================
// Hero Button
// ============================================================================

/**
 * Hero Button
 *
 * Primary CTA button with orange-amber gradient and icon.
 * Used for main actions like "New chat" button.
 */
export const HeroButtonDefault: Story = {
  render: () => <HeroButton icon={<PlusIcon size={14} weight="bold" />}>New chat</HeroButton>,
};

/**
 * Hero Icon Button
 *
 * Icon-only gradient button for collapsed states.
 */
export const HeroIconButtonDefault: Story = {
  render: () => <HeroIconButton icon={<PlusIcon size={16} weight="bold" />} title="New Chat" />,
};

// ============================================================================
// Primary Button
// ============================================================================

/**
 * Primary Button
 *
 * Dark solid button for primary actions like Save, Confirm, Submit.
 */
export const PrimaryButtonDefault: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <PrimaryButton>Save</PrimaryButton>
      <PrimaryButton>Confirm</PrimaryButton>
      <PrimaryButton>Submit</PrimaryButton>
    </div>
  ),
};

/**
 * Primary Button Full Width
 *
 * Primary button taking full width of container.
 */
export const PrimaryButtonFullWidth: Story = {
  render: () => (
    <div style={{ width: '280px' }}>
      <PrimaryButton fullWidth>Save Changes</PrimaryButton>
    </div>
  ),
};

// ============================================================================
// Secondary Button
// ============================================================================

/**
 * Secondary Button
 *
 * Outlined button with transparent background for secondary actions.
 */
export const SecondaryButtonDefault: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <SecondaryButton>View Details</SecondaryButton>
      <SecondaryButton>Learn More</SecondaryButton>
    </div>
  ),
};

// ============================================================================
// Ghost Button
// ============================================================================

/**
 * Ghost Button
 *
 * Subtle button with gray background for cancel/dismiss actions.
 */
export const GhostButtonDefault: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <GhostButton>Discard</GhostButton>
      <GhostButton>Cancel</GhostButton>
    </div>
  ),
};

// ============================================================================
// Primary + Ghost Pair
// ============================================================================

/**
 * Primary & Ghost Pair
 *
 * Common pattern for form actions - Save/Discard buttons.
 */
export const PrimaryGhostPair: Story = {
  render: () => (
    <div className="flex items-center gap-2" style={{ width: '280px' }}>
      <GhostButton fullWidth>Discard</GhostButton>
      <PrimaryButton fullWidth>Save</PrimaryButton>
    </div>
  ),
};

// ============================================================================
// Pill Button / Add Button
// ============================================================================

/**
 * Pill Button
 *
 * Small pill-shaped button for inline actions.
 */
export const PillButtonDefault: Story = {
  render: () => <PillButton icon={<PlusIcon size={10} weight="bold" />}>Add new</PillButton>,
};

/**
 * Add Button
 *
 * PillButton with a plus icon, specifically for adding items.
 */
export const AddButtonDefault: Story = {
  render: () => <AddButton>Add Filter</AddButton>,
};

// ============================================================================
// Icon Buttons
// ============================================================================

/**
 * All Icon Buttons
 *
 * Icon button hierarchy from highest to lowest prominence:
 * 1. PrimaryIconButton - Dark filled (e.g., more options menu)
 * 2. SecondaryIconButton - Bordered (e.g., collapse all)
 * 3. TertiaryIconButton - Ghost (e.g., sidebar toggle, back)
 */
export const AllIconButtons: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <PrimaryIconButton icon={<DotsThreeIcon size={16} weight="bold" />} title="More options" />
        <span className="text-xs text-gray-500">Primary - dark filled (more options)</span>
      </div>
      <div className="flex items-center gap-4">
        <SecondaryIconButton
          icon={<ArrowsInLineVerticalIcon size={14} weight="regular" className="text-gray-600" />}
          title="Collapse all"
        />
        <span className="text-xs text-gray-500">Secondary - bordered (collapse all)</span>
      </div>
      <div className="flex items-center gap-4">
        <TertiaryIconButton
          icon={<SidebarSimpleIcon size={16} weight="regular" className="text-gray-800" />}
          title="Toggle sidebar"
        />
        <span className="text-xs text-gray-500">Tertiary - ghost (sidebar toggle, back)</span>
      </div>
    </div>
  ),
};

/**
 * Primary Icon Button
 *
 * Dark filled button for high-prominence icon actions like more options.
 */
export const PrimaryIconButtonDefault: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <PrimaryIconButton icon={<DotsThreeIcon size={16} weight="bold" />} visible={true} />
      <span className="text-sm text-gray-500">More options trigger</span>
    </div>
  ),
};

/**
 * Secondary Icon Button
 *
 * Bordered button for medium-prominence icon actions like collapse all.
 */
export const SecondaryIconButtonDefault: Story = {
  render: () => (
    <SecondaryIconButton
      icon={<ArrowsInLineVerticalIcon size={14} weight="regular" className="text-gray-600" />}
      title="Collapse all"
    />
  ),
};

/**
 * Tertiary Icon Button
 *
 * Ghost button for low-prominence icon actions like sidebar toggle, back navigation.
 */
export const TertiaryIconButtonDefault: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <TertiaryIconButton
        icon={<SidebarSimpleIcon size={16} weight="regular" className="text-gray-800" />}
        title="Toggle sidebar"
      />
      <TertiaryIconButton icon={<ArrowLeftIcon size={16} weight="bold" />} title="Go back" />
    </div>
  ),
};
