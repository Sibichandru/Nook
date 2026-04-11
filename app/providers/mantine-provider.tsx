'use client';

import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

// Electric Indigo — 10-step scale matching the Kinetic Workspace spec
// Index 6 (#4b4dd8) is the primary_container / light-mode primary
// Index 2 (#c0c1ff) is the spec's primary for dark UI readability
const theme = createTheme({
  primaryColor: "electricIndigo",
  colors: {
    electricIndigo: [
      "#f0f0ff",  // 0
      "#e0e1ff",  // 1
      "#c0c1ff",  // 2 — spec "primary" (Electric Indigo light)
      "#a0a2ff",  // 3
      "#8082f0",  // 4
      "#6466e0",  // 5
      "#4b4dd8",  // 6 — spec "primary_container" / light-mode primary
      "#3d3fc0",  // 7
      "#3032b0",  // 8
      "#2225a0",  // 9
    ],
  },
  defaultRadius: "md",
  fontFamily: "var(--font-inter), system-ui, sans-serif",
  headings: {
    fontFamily: "var(--font-manrope), system-ui, sans-serif",
    fontWeight: "700",
  },
  components: {
    Button: {
      defaultProps: {
        variant: "subtle",
        color: "electricIndigo",
        size: "sm",
      },
      styles: {
        root: {
          fontWeight: 500,
          letterSpacing: "0.01em",
          transition: "background 0.15s ease, color 0.15s ease, transform 0.15s ease",
        },
      },
    },
  },
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
