import type { Meta, StoryObj, Decorator } from '@storybook/react-vite';
import { useState, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { CaretLeftIcon, CaretRightIcon, StarIcon } from '@phosphor-icons/react';
import { StandardChatInput } from '../../../../components/Chat/StandardChatInput';
import { TopBar } from '../../../../components/TopBar';
import { ChatSidebar } from '../../../../components/ChatSidebar';
import {
  DEFAULT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type Template,
  type TemplateCategory,
} from '../../../../components/Templates';
import type { BuildMode } from '../../../../components/DashboardBuilder/types';

/**
 * FullPageDecorator - Full viewport height container
 */
const FullPageDecorator: Decorator = (Story) => (
  <div
    style={{
      height: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f5f5f7',
      overflow: 'hidden',
    }}
  >
    <Story />
  </div>
);

const meta = {
  title: '3-Pane/Components/Chat/LandingPage',
  component: StandardChatInput,
  decorators: [FullPageDecorator],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'neutral',
      values: [{ name: 'neutral', value: '#f5f5f7' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StandardChatInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Von Logo SVG Component (from ChatEmptyState)
// ============================================================================

const VonLogo = () => (
  <svg width="48" height="48" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M0 8C0 3.58172 3.58172 0 8 0H20C24.4183 0 28 3.58172 28 8V20C28 24.4183 24.4183 28 20 28H8C3.58172 28 0 24.4183 0 20V8Z"
      fill="url(#paint0_radial_landing)"
    />
    <path
      d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z"
      stroke="white"
      strokeWidth="1.33"
    />
    <circle cx="13.9932" cy="14" r="7.835" stroke="white" strokeWidth="1.33" />
    <defs>
      <radialGradient
        id="paint0_radial_landing"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(21.875 1.75) rotate(120.964) scale(30.6125)"
      >
        <stop stopColor="#FFF3EB" />
        <stop offset="0.26" stopColor="#FF9042" />
        <stop offset="1" stopColor="#854FFF" />
      </radialGradient>
    </defs>
  </svg>
);

// ============================================================================
// Helper Functions
// ============================================================================

const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
};

// ============================================================================
// Landing Page - Full Demo
// ============================================================================

/**
 * Landing Page
 *
 * Complete landing page layout matching ChatEmptyState design:
 * - TopBar with logo
 * - ChatSidebar (collapsible)
 * - Main content area with:
 *   - Von logo (gradient icon)
 *   - Greeting text ("Good afternoon, Sarah")
 *   - Subtitle ("How can I help you today?")
 *   - StandardChatInput
 *   - Category pills (Popular, Pipeline, Coaching, etc.)
 *   - Template carousel with chevron navigation
 * - Disclaimer text
 */
export const LandingPage: Story = {
  render: () => {
    const [mode, setMode] = useState<BuildMode>('ask');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [selectedId, setSelectedId] = useState<string | undefined>();
    const [inputValue, setInputValue] = useState('');

    // Template state
    const [activeCategory, setActiveCategory] = useState<TemplateCategory>('Popular');
    const templates = useMemo(() => {
      if (activeCategory === 'Popular') {
        return DEFAULT_TEMPLATES.filter((tpl) => tpl.isPopular === true);
      }
      return DEFAULT_TEMPLATES.filter((tpl) => tpl.category === activeCategory);
    }, [activeCategory]);

    // Scroll state for chevrons
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftChevron, setShowLeftChevron] = useState(false);
    const [showRightChevron, setShowRightChevron] = useState(true);

    const updateChevronVisibility = useCallback(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftChevron(scrollLeft > 0);
      setShowRightChevron(scrollLeft < scrollWidth - clientWidth - 1);
    }, []);

    useLayoutEffect(() => {
      updateChevronVisibility();
    }, [templates, updateChevronVisibility]);

    const handleScroll = useCallback(() => {
      updateChevronVisibility();
    }, [updateChevronVisibility]);

    const scrollBy = useCallback((direction: 'left' | 'right') => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const scrollAmount = 804;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }, []);

    const handleCategoryChange = useCallback((category: TemplateCategory) => {
      setActiveCategory(category);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = 0;
      }
      setShowLeftChevron(false);
      setShowRightChevron(true);
    }, []);

    const handleTemplateClick = useCallback((template: Template) => {
      setInputValue(template.prompt);
    }, []);

    const greeting = useMemo(() => getTimeBasedGreeting(), []);

    const sampleItems = [
      { id: 'chat-1', label: 'Pipeline by Stage', type: 'chat' as const },
      { id: 'chat-2', label: 'Q4 Revenue Forecast', type: 'chat' as const },
      {
        id: 'dash-1',
        label: 'Sales Overview',
        type: 'dashboard' as const,
        ownership: 'mine' as const,
      },
    ];

    const sampleFolders = [{ id: 'folder-1', label: 'Q4 Analysis', isExpanded: false, type: 'chat' as const }];

    return (
      <div className="flex flex-col h-full">
        {/* TopBar
        <TopBar
          showMenu={false}
          onLogoClick={() => console.log('Logo clicked')}
          onNewChatClick={() => console.log('New chat clicked')}
          userName="Sarah Chen"
          userEmail="sarah@company.com"
          avatarLabel="SC"
          onProfileClick={() => console.log('Profile clicked')}
          onSettingsClick={() => console.log('Settings clicked')}
          onHelpClick={() => console.log('Help clicked')}
          onSignOutClick={() => console.log('Sign out clicked')}
        /> */}

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden px-2 pb-2 gap-2">
          {/* Sidebar */}
          <div
            style={{
              width: isCollapsed ? '64px' : '260px',
              transition: 'width 0.3s ease',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
              flexShrink: 0,
            }}
          >
            <ChatSidebar
              items={sampleItems}
              folders={sampleFolders}
              selectedItemId={selectedId}
              isCollapsed={isCollapsed}
              onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
              onItemClick={(id) => setSelectedId(id)}
              onNewChatClick={() => console.log('New Chat')}
              onNewDashboardClick={() => console.log('New Dashboard')}
              onNewChatFolderClick={() => console.log('New Chat Folder')}
              onNewDashboardFolderClick={() => console.log('New Dashboard Folder')}
              onRenameItem={(id) => console.log('Rename:', id)}
              onDeleteItem={(id) => console.log('Delete:', id)}
              onFolderToggle={() => {}}
            />
          </div>

          {/* Main Chat Area */}
          <div
            className="flex-1 flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden"
            style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
          >
            {/* Scrollable Content */}
            <motion.div
              className="flex-1 flex flex-col items-center justify-start px-6 pt-6 overflow-y-auto font-sf"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Spacer */}
              <div className="pt-20" />

              {/* Von Logo */}
              <motion.div
                className="mb-6"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <VonLogo />
              </motion.div>

              {/* Greeting */}
              <motion.div
                className="text-center mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <h2 className="text-3xl text-gray-900">
                  {greeting}, Sarah
                </h2>
                <p className="text-3xl text-gray-500">How can I help you today?</p>
              </motion.div>

              {/* Chat Input */}
              <motion.div
                className="w-full max-w-3xl mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <StandardChatInput
                  placeholder="Ask von anything"
                  mode={mode}
                  onModeChange={setMode}
                  onVoiceInput={() => console.log('Voice input')}
                  value={inputValue}
                  onChange={setInputValue}
                  onSend={(message) => {
                    console.log('Send:', message);
                    setInputValue('');
                  }}
                />
              </motion.div>

              {/* Templates Section */}
              <motion.div
                className="w-full max-w-3xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                {/* Category Pills */}
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {TEMPLATE_CATEGORIES.map((category) => {
                    const isActive = category === activeCategory;
                    const isPopular = category === 'Popular';
                    return (
                      <button
                        key={category}
                        onClick={() => handleCategoryChange(category)}
                        className={`
                          px-3 py-1 text-xs font-medium rounded-full
                          transition-all duration-200 inline-flex items-center gap-1 cursor-pointer
                          ${
                            isActive
                              ? 'bg-gray-100 border border-gray-100 shadow-sm text-gray-900'
                              : 'bg-white border border-gray-100 text-gray-600 hover:border-gray-200'
                          }
                        `}
                      >
                        {isPopular && <StarIcon size={12} weight="fill" className="text-amber-500" />}
                        {category}
                      </button>
                    );
                  })}
                </div>

                {/* Templates Carousel */}
                <div className="relative">
                  {/* Left Chevron */}
                  {showLeftChevron && (
                    <button
                      onClick={() => scrollBy('left')}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      aria-label="Scroll left"
                    >
                      <CaretLeftIcon size={16} weight="bold" className="text-gray-600" />
                    </button>
                  )}

                  {/* Scrollable Container */}
                  <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex gap-3 overflow-x-auto px-1 py-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateClick(template)}
                        className="flex-shrink-0 w-48 px-4 py-2.5 shadow-xs rounded-xl bg-white border border-gray-200 text-left transition-all flex flex-col justify-start hover:border-gray-300 hover:shadow-sm cursor-pointer"
                      >
                        <div className="text-sm font-medium text-gray-700 line-clamp-3">
                          {template.shortPrompt}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Right Chevron */}
                  {showRightChevron && templates.length > 3 && (
                    <button
                      onClick={() => scrollBy('right')}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      aria-label="Scroll right"
                    >
                      <CaretRightIcon size={16} weight="bold" className="text-gray-600" />
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Disclaimer */}
              <motion.div
                className="w-full text-center pb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <p className="text-xs text-gray-500">
                  Von AI may make mistakes. Please recheck all important information.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  },
};

// ============================================================================
// Empty State (No Sidebar)
// ============================================================================

/**
 * Empty State
 *
 * Landing page without sidebar - focused view for new users or onboarding.
 */
export const EmptyState: Story = {
  render: () => {
    const [mode, setMode] = useState<BuildMode>('ask');
    const [inputValue, setInputValue] = useState('');

    // Template state
    const [activeCategory, setActiveCategory] = useState<TemplateCategory>('Popular');
    const templates = useMemo(() => {
      if (activeCategory === 'Popular') {
        return DEFAULT_TEMPLATES.filter((tpl) => tpl.isPopular === true);
      }
      return DEFAULT_TEMPLATES.filter((tpl) => tpl.category === activeCategory);
    }, [activeCategory]);

    // Scroll state for chevrons
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftChevron, setShowLeftChevron] = useState(false);
    const [showRightChevron, setShowRightChevron] = useState(true);

    const updateChevronVisibility = useCallback(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftChevron(scrollLeft > 0);
      setShowRightChevron(scrollLeft < scrollWidth - clientWidth - 1);
    }, []);

    useLayoutEffect(() => {
      updateChevronVisibility();
    }, [templates, updateChevronVisibility]);

    const handleScroll = useCallback(() => {
      updateChevronVisibility();
    }, [updateChevronVisibility]);

    const scrollBy = useCallback((direction: 'left' | 'right') => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const scrollAmount = 804;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }, []);

    const handleCategoryChange = useCallback((category: TemplateCategory) => {
      setActiveCategory(category);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = 0;
      }
      setShowLeftChevron(false);
      setShowRightChevron(true);
    }, []);

    const handleTemplateClick = useCallback((template: Template) => {
      setInputValue(template.prompt);
    }, []);

    const greeting = useMemo(() => getTimeBasedGreeting(), []);

    return (
      <div className="flex flex-col h-full">
        {/* TopBar */}
        <TopBar
          showMenu={false}
          onLogoClick={() => console.log('Logo clicked')}
          onNewChatClick={() => console.log('New chat clicked')}
          userName="Sarah Chen"
          userEmail="sarah@company.com"
          avatarLabel="SC"
          onProfileClick={() => console.log('Profile clicked')}
          onSettingsClick={() => console.log('Settings clicked')}
          onHelpClick={() => console.log('Help clicked')}
          onSignOutClick={() => console.log('Sign out clicked')}
        />

        {/* Main Content Area */}
        <motion.div
          className="flex-1 flex flex-col items-center justify-start px-6 pt-6 overflow-y-auto font-sf"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Spacer */}
          <div className="pt-24" />

          {/* Von Logo */}
          <motion.div
            className="mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <VonLogo />
          </motion.div>

          {/* Greeting */}
          <motion.div
            className="text-center mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <h2 className="text-3xl text-gray-900">{greeting}, Sarah</h2>
            <p className="text-3xl text-gray-500">How can I help you today?</p>
          </motion.div>

          {/* Chat Input */}
          <motion.div
            className="w-full max-w-3xl mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <StandardChatInput
              placeholder="Ask von anything"
              mode={mode}
              onModeChange={setMode}
              onVoiceInput={() => console.log('Voice input')}
              value={inputValue}
              onChange={setInputValue}
              onSend={(message) => {
                console.log('Send:', message);
                setInputValue('');
              }}
            />
          </motion.div>

          {/* Templates Section */}
          <motion.div
            className="w-full max-w-3xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {TEMPLATE_CATEGORIES.map((category) => {
                const isActive = category === activeCategory;
                const isPopular = category === 'Popular';
                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`
                      px-3 py-1 text-xs font-medium rounded-full
                      transition-all duration-200 inline-flex items-center gap-1 cursor-pointer
                      ${
                        isActive
                          ? 'bg-gray-100 border border-gray-100 shadow-sm text-gray-900'
                          : 'bg-white border border-gray-100 text-gray-600 hover:border-gray-200'
                      }
                    `}
                  >
                    {isPopular && <StarIcon size={12} weight="fill" className="text-amber-500" />}
                    {category}
                  </button>
                );
              })}
            </div>

            {/* Templates Carousel */}
            <div className="relative">
              {/* Left Chevron */}
              {showLeftChevron && (
                <button
                  onClick={() => scrollBy('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                  aria-label="Scroll left"
                >
                  <CaretLeftIcon size={16} weight="bold" className="text-gray-600" />
                </button>
              )}

              {/* Scrollable Container */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex gap-3 overflow-x-auto px-1 py-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateClick(template)}
                    className="flex-shrink-0 w-48 px-4 py-2.5 shadow-xs rounded-xl bg-white border border-gray-200 text-left transition-all flex flex-col justify-start hover:border-gray-300 hover:shadow-sm cursor-pointer"
                  >
                    <div className="text-sm font-medium text-gray-700 line-clamp-3">
                      {template.shortPrompt}
                    </div>
                  </button>
                ))}
              </div>

              {/* Right Chevron */}
              {showRightChevron && templates.length > 3 && (
                <button
                  onClick={() => scrollBy('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                  aria-label="Scroll right"
                >
                  <CaretRightIcon size={16} weight="bold" className="text-gray-600" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Disclaimer */}
          <motion.div
            className="w-full text-center pb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <p className="text-xs text-gray-500">
              Von AI may make mistakes. Please recheck all important information.
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  },
};
