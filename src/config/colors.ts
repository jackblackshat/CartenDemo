export const Colors = {
  // Primary
  eucalyptus: '#7FA98E',
  eucalyptusLight: '#8B9D83',
  eucalyptusDark: '#5F7A61',
  eucalyptusSubtle: 'rgba(127, 169, 142, 0.2)',

  // Accent
  warmGold: '#C9A96E',
  mutedRose: '#B87C7C',
  sage: '#8FA88E',

  // Light theme
  light: {
    background: '#F5F1E8',
    card: '#FFFFFF',
    cardBorder: '#D3D5D7',
    text: '#4A4F55',
    textSecondary: '#8A8D91',
    inputBackground: '#F5F1E8',
    divider: '#D3D5D7',
    tabBarBackground: 'rgba(255, 255, 255, 0.95)',
  },

  // Dark theme
  dark: {
    background: '#1C1C1E',
    card: '#2C2C2E',
    cardBorder: '#3A3A3C',
    text: '#F5F5F7',
    textSecondary: '#AEAEB2',
    inputBackground: '#3A3A3C',
    divider: '#3A3A3C',
    tabBarBackground: 'rgba(44, 44, 46, 0.95)',
  },
} as const;
