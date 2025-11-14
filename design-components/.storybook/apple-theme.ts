import { create } from 'storybook/internal/theming';

// Logo URL constant
const LOGO_URL = 'https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/vonlabs-logo.gif';

/**
 * Apple-inspired Storybook theme
 * Matches Apple's design system with clean aesthetics and SF Pro typography
 */
export default create({
  base: 'light',

  // Brand
  brandTitle: 'Von Design System',
  brandUrl: '/',
  brandTarget: '_self',
  brandImage: LOGO_URL, // Von animated logo

  // Typography - Apple SF Pro
  fontBase: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
  fontCode: 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',

  // Colors - Apple's palette
  colorPrimary: '#0071e3', // Apple blue
  colorSecondary: '#0071e3', // Apple blue

  // UI
  appBg: '#ffffff',
  appContentBg: '#ffffff',
  appPreviewBg: '#f5f5f7', // Apple's light gray
  appBorderColor: '#d2d2d7', // Apple's border gray
  appBorderRadius: 12, // Apple's rounded corners

  // Text colors
  textColor: '#1d1d1f', // Apple's primary text
  textInverseColor: '#ffffff',
  textMutedColor: '#6e6e73', // Apple's secondary text

  // Toolbar
  barTextColor: '#000000', // Pure black for visibility
  barSelectedColor: '#0071e3',
  barHoverColor: '#0071e3',
  barBg: '#fbfbfd', // Apple's elevated surface

  // Form colors
  inputBg: '#ffffff',
  inputBorder: '#d2d2d7',
  inputTextColor: '#1d1d1f',
  inputBorderRadius: 8,

  // Buttons
  buttonBg: '#0071e3',
  buttonBorder: '#0071e3',

  // Boolean
  booleanBg: '#e8e8ed',
  booleanSelectedBg: '#0071e3',
});
