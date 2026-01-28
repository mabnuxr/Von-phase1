import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useRef } from 'react';
import {
  PencilSimpleIcon,
  TrashIcon,
  UploadSimpleIcon,
  AtomIcon,
  CheckIcon,
  ChatTextIcon,
  BuildingOfficeIcon,
  UserSquareIcon,
} from '@phosphor-icons/react';
import { ContextMenu, type ContextMenuItem } from '../../../../components/popups';
import { SecondaryIconButton, PrimaryButton } from '../../../../components/forms/buttons';
import { PlusIcon, DotsThreeIcon } from '@phosphor-icons/react';

const meta = {
  title: '3-Pane/Components/Popups/ContextMenu',
  component: ContextMenu,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'gray',
      values: [{ name: 'gray', value: '#f5f5f5' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Context Menu (Fixed Position - like right-click menus)
// ============================================================================

/**
 * Default
 *
 * Used for right-click context menus or "more options" menus.
 * Uses fixedPosition to appear at a specific location.
 */
export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    const items: ContextMenuItem[] = [
      { id: 'rename', label: 'Rename', icon: <PencilSimpleIcon size={14} /> },
      { id: 'delete', label: 'Delete', icon: <TrashIcon size={14} />, variant: 'danger' },
    ];

    const handleOpen = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({ top: rect.bottom + 8, left: rect.left });
      }
      setIsOpen(true);
    };

    return (
      <div className="p-8">
        <button
          ref={buttonRef}
          onClick={handleOpen}
          className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
        >
          <DotsThreeIcon size={16} weight="bold" />
        </button>

        <ContextMenu
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          items={items}
          fixedPosition={position}
          width={144}
          onItemClick={(item) => {
            console.log('Clicked:', item.id);
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
};

// ============================================================================
// Plus Button Menu (Like StandardChatInput)
// ============================================================================

/**
 * Plus Button Menu
 *
 * Used for the plus button in chat input, showing options like upload and deep research.
 * Positioned above the button (top-start).
 */
export const PlusButtonMenu: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDeepResearch, setIsDeepResearch] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const items: ContextMenuItem[] = [
      {
        id: 'upload',
        label: 'Upload files and photos',
        icon: <UploadSimpleIcon size={16} />,
      },
      {
        id: 'deep-research',
        label: 'Deep research',
        icon: <AtomIcon size={16} />,
        active: isDeepResearch,
        rightContent: isDeepResearch ? (
          <CheckIcon size={14} weight="bold" className="text-green-600" />
        ) : undefined,
      },
    ];

    return (
      <div className="p-8 pt-48">
        <div className="relative">
          <SecondaryIconButton
            ref={buttonRef}
            icon={<PlusIcon size={16} weight="bold" className="text-gray-800" />}
            onClick={() => setIsOpen(true)}
            title="More options"
            className="w-8.5 h-8.5 rounded-xl"
          />

          <ContextMenu
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            items={items}
            anchorRef={buttonRef}
            position="top-start"
            width={208}
            onItemClick={(item) => {
              if (item.id === 'deep-research') {
                setIsDeepResearch(!isDeepResearch);
              }
              setIsOpen(false);
            }}
          />
        </div>
      </div>
    );
  },
};

// ============================================================================
// Sidebar Item Menu (Like ChatSidebar context menu)
// ============================================================================

/**
 * Sidebar Item Menu
 *
 * Context menu for sidebar items, positioned to the right of the trigger.
 */
export const SidebarItemMenu: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const items: ContextMenuItem[] = [
      { id: 'rename', label: 'Rename', icon: <PencilSimpleIcon size={14} /> },
      { id: 'delete', label: 'Delete', icon: <TrashIcon size={14} />, variant: 'danger' },
    ];

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      setPosition({ top: e.clientY, left: e.clientX + 8 });
      setIsOpen(true);
    };

    return (
      <div className="p-8">
        <div
          className="flex items-center gap-2.5 px-3 py-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 w-64"
          onContextMenu={handleContextMenu}
        >
          <ChatTextIcon size={16} weight="regular" className="text-gray-700" />
          <span className="text-sm text-gray-900">Right-click me for menu</span>
        </div>

        <ContextMenu
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          items={items}
          fixedPosition={position}
          width={128}
          onItemClick={(item) => {
            console.log('Clicked:', item.id);
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
};

// ============================================================================
// All Positions Demo
// ============================================================================

/**
 * Position Variants
 *
 * Demonstrates all 12 possible positions around an anchor element.
 */
export const PositionVariants: Story = {
  render: () => {
    const [openPosition, setOpenPosition] = useState<string | null>(null);
    const refs = {
      'top-start': useRef<HTMLButtonElement>(null),
      top: useRef<HTMLButtonElement>(null),
      'top-end': useRef<HTMLButtonElement>(null),
      'bottom-start': useRef<HTMLButtonElement>(null),
      bottom: useRef<HTMLButtonElement>(null),
      'bottom-end': useRef<HTMLButtonElement>(null),
      'left-start': useRef<HTMLButtonElement>(null),
      left: useRef<HTMLButtonElement>(null),
      'left-end': useRef<HTMLButtonElement>(null),
      'right-start': useRef<HTMLButtonElement>(null),
      right: useRef<HTMLButtonElement>(null),
      'right-end': useRef<HTMLButtonElement>(null),
    };

    const items: ContextMenuItem[] = [
      { id: 'option-1', label: 'Option 1' },
      { id: 'option-2', label: 'Option 2' },
    ];

    const positions = Object.keys(refs) as Array<keyof typeof refs>;

    return (
      <div className="p-16 grid grid-cols-4 gap-8">
        {positions.map((pos) => (
          <div key={pos} className="flex flex-col items-center gap-2">
            <span className="text-xs text-gray-500">{pos}</span>
            <PrimaryButton
              ref={refs[pos]}
              onClick={() => setOpenPosition(openPosition === pos ? null : pos)}
            >
              {pos}
            </PrimaryButton>

            <ContextMenu
              isOpen={openPosition === pos}
              onClose={() => setOpenPosition(null)}
              items={items}
              anchorRef={refs[pos]}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              position={pos as any}
              width={120}
              onItemClick={() => setOpenPosition(null)}
            />
          </div>
        ))}
      </div>
    );
  },
};

// ============================================================================
// With Header and Footer
// ============================================================================

/**
 * With Header and Footer
 *
 * ContextMenu with optional header and footer content.
 */
export const WithHeaderAndFooter: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const items: ContextMenuItem[] = [
      { id: 'chat-1', label: 'Sales Pipeline Q4', icon: <ChatTextIcon size={16} /> },
      { id: 'chat-2', label: 'Customer Onboarding', icon: <ChatTextIcon size={16} /> },
      { id: 'dash-1', label: 'Revenue Dashboard', icon: <BuildingOfficeIcon size={16} /> },
      { id: 'dash-2', label: 'Team Metrics', icon: <UserSquareIcon size={16} /> },
    ];

    return (
      <div className="p-8 pt-64">
        <PrimaryButton ref={buttonRef} onClick={() => setIsOpen(true)}>
          Open with header/footer
        </PrimaryButton>

        <ContextMenu
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          items={items}
          anchorRef={buttonRef}
          position="bottom-start"
          width={224}
          header={
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
              Recent
            </span>
          }
          footer={<span className="text-[11px] text-gray-500">+4 more items</span>}
          onItemClick={(item) => {
            console.log('Selected:', item.label);
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
};

// ============================================================================
// Active/Selected State
// ============================================================================

/**
 * Active/Selected State
 *
 * Shows how items can have an active state with checkmark.
 */
export const ActiveState: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedId, setSelectedId] = useState('option-2');
    const buttonRef = useRef<HTMLButtonElement>(null);

    const items: ContextMenuItem[] = [
      {
        id: 'option-1',
        label: 'Option 1',
        active: selectedId === 'option-1',
        rightContent:
          selectedId === 'option-1' ? (
            <CheckIcon size={14} weight="bold" className="text-green-600" />
          ) : undefined,
      },
      {
        id: 'option-2',
        label: 'Option 2',
        active: selectedId === 'option-2',
        rightContent:
          selectedId === 'option-2' ? (
            <CheckIcon size={14} weight="bold" className="text-green-600" />
          ) : undefined,
      },
      {
        id: 'option-3',
        label: 'Option 3',
        active: selectedId === 'option-3',
        rightContent:
          selectedId === 'option-3' ? (
            <CheckIcon size={14} weight="bold" className="text-green-600" />
          ) : undefined,
      },
    ];

    return (
      <div className="p-8 pt-48">
        <PrimaryButton ref={buttonRef} onClick={() => setIsOpen(true)}>
          Select Option
        </PrimaryButton>

        <ContextMenu
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          items={items}
          anchorRef={buttonRef}
          position="bottom-start"
          width={160}
          onItemClick={(item) => {
            setSelectedId(item.id);
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
};
