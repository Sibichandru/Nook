'use client';

import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

// Custom theme to match the journal design
const theme = createTheme({
  primaryColor: 'sage',
  colors: {
    sage: [
      '#f0f5f1',
      '#dfe8e1',
      '#bdd1c0',
      '#97b89c',
      '#76a37d',
      '#5d9466',
      '#4d8858',
      '#3d6b46',
      '#325a3b',
      '#264a30',
    ],
  },
  defaultRadius: 'md',
  fontFamily: 'inherit',
});

export function MantineAppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MantineProvider theme={theme}>
      {children}
    </MantineProvider>
  );
}
