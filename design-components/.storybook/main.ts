import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
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