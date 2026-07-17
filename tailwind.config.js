/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'surface-container-highest': '#d3e4fe',
        'secondary': '#006a61',
        'inverse-surface': '#213145',
        'on-tertiary-fixed': '#07006c',
        'on-primary-container': '#7c839b',
        'on-primary': '#ffffff',
        'primary-container': '#131b2e',
        'on-background': '#0b1c30',
        'outline': '#76777d',
        'tertiary-container': '#07006c',
        'on-primary-fixed': '#131b2e',
        'on-primary-fixed-variant': '#3f465c',
        'tertiary-fixed': '#e1e0ff',
        'tertiary-fixed-dim': '#c0c1ff',
        'on-error-container': '#93000a',
        'on-surface': '#0b1c30',
        'secondary-container': '#86f2e4',
        'tertiary': '#000000',
        'on-tertiary-container': '#7073ff',
        'on-secondary-fixed': '#00201d',
        'background': '#f8f9ff',
        'secondary-fixed-dim': '#6bd8cb',
        'on-error': '#ffffff',
        'secondary-fixed': '#89f5e7',
        'on-secondary-fixed-variant': '#005049',
        'error': '#ba1a1a',
        'on-tertiary': '#ffffff',
        'on-secondary-container': '#006f66',
        'surface-container-low': '#eff4ff',
        'error-container': '#ffdad6',
        'inverse-on-surface': '#eaf1ff',
        'on-surface-variant': '#45464d',
        'surface': '#f8f9ff',
        'primary-fixed-dim': '#bec6e0',
        'primary': '#000000',
        'surface-container-high': '#dce9ff',
        'surface-bright': '#f8f9ff',
        'surface-tint': '#565e74',
        'surface-container-lowest': '#ffffff',
        'surface-variant': '#d3e4fe',
        'primary-fixed': '#dae2fd',
        'on-tertiary-fixed-variant': '#2f2ebe',
        'surface-container': '#e5eeff',
        'inverse-primary': '#bec6e0',
        'outline-variant': '#c6c6cd',
        'surface-dim': '#cbdbf5',
        'on-secondary': '#ffffff'
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px'
      },
      spacing: {
        xs: '4px',
        'margin-mobile': '16px',
        gutter: '24px',
        sm: '12px',
        md: '24px',
        base: '8px',
        xl: '80px',
        lg: '48px',
        'margin-desktop': '64px'
      },
      fontFamily: {
        headline: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif']
      },
      fontSize: {
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'label-sm': ['12px', { lineHeight: '16px', fontWeight: '600' }],
        'headline-xl': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '20px', letterSpacing: '0.01em', fontWeight: '500' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '600' }]
      }
    }
  },
  plugins: []
}
