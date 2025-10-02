import type { Preview } from '@storybook/react-vite';

const preview: Preview = {
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
  },
};

export default preview;