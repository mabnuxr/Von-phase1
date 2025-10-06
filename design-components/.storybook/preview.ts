import type { Preview } from '@storybook/react-vite';
import React from 'react';

// Global decorator to apply design system styles
const withDesignSystem = (Story: React.ComponentType) => {
  return React.createElement(
    'div',
    {
      style: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
        fontSize: '1.0625rem', // 17px - Apple's preferred body size
        lineHeight: '1.47059',
        color: '#1d1d1f',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
    },
    React.createElement(Story)
  );
};

const preview: Preview = {
  decorators: [withDesignSystem],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },

    // Apple-inspired backgrounds
    backgrounds: {
      default: 'white',
      values: [
        {
          name: 'white',
          value: '#ffffff',
        },
        {
          name: 'light gray',
          value: '#f5f5f7',
        },
        {
          name: 'very light gray',
          value: '#fbfbfd',
        },
        {
          name: 'near black',
          value: '#1d1d1f',
        },
      ],
    },

    // Layout options
    layout: 'padded',

    // Story sorting - Atomic Design order
    options: {
      storySort: {
        order: [
          'Documentation',
          ['Introduction', 'Getting Started', '*'],
          'Atoms',
          ['Display', 'Forms', 'Layout', 'Typography', '*'],
          'Molecules',
          'Organisms',
          'Templates',
          'Pages',
          'Examples',
          '*',
        ],
      },
    },
  },
};

export default preview;