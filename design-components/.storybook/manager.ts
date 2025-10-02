import { addons } from 'storybook/internal/manager-api';
import appleTheme from './apple-theme';

// Apply the Apple-inspired theme with Von logo to Storybook UI
addons.setConfig({
  theme: appleTheme,
});
