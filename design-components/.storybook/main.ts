import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';

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
  async viteFinal(config) {
    // Add Tailwind CSS plugin to Storybook's Vite config
    config.plugins = config.plugins || [];

    // Check if Tailwind plugin is already registered to prevent duplicates
    const hasTailwind = config.plugins.some(
      (plugin: any) => plugin?.name === 'tailwindcss-vite'
    );

    if (!hasTailwind) {
      config.plugins.push(tailwindcss());
    }

    return config;
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