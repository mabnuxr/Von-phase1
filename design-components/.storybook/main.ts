import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    // Core functionality addons
    '@storybook/addon-docs',              // Documentation
    '@chromatic-com/storybook',           // Visual regression testing
    '@storybook/addon-a11y',              // Accessibility testing
    '@storybook/addon-vitest',            // Test runner integration

    // In Storybook 9, these are built-in but can be explicitly configured:
    // - Controls (argTypes) - enabled by default
    // - Actions - enabled by default
    // - Viewport - enabled by default
    // - Backgrounds - enabled by default
    // - Toolbars - enabled by default
    // - Measure - enabled by default
    // - Outline - enabled by default
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    defaultName: 'Documentation',
  },
  core: {
    disableTelemetry: true,
  },
  // Custom title and favicon with cache busting
  managerHead: (head) => `
    ${head}
    <link rel="icon" type="image/png" href="/logo.png?v=1" />
    <link rel="shortcut icon" type="image/png" href="/logo.png?v=1" />
  `,
};

export default config;