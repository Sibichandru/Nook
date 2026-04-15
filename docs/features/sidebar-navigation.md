# Sidebar & Navigation

The dashboard uses a fixed sidebar for workspace navigation and a top navbar for branding and user actions.

## Layout Structure

The dashboard layout (`app/(dashboard)/dashboard/layout.tsx`) renders:

```
+------------------------------------------+
|  Navbar: [Nook logo]    [Theme] [Profile] |
+--------+---------------------------------+
|        |                                 |
| Sidebar|         Main Content            |
|        |                                 |
|        |                                 |
+--------+---------------------------------+
```

- **Navbar**: Fixed top bar with the "Nook" logo (links to `/dashboard`), theme toggle, and user profile icon.
- **Sidebar**: 256px wide (`w-64`), full height below the navbar, with a right border.
- **Main content**: Flex-1, scrollable area where page content renders.

## Sidebar Navigation Items

Navigation items are defined in `lib/constants/constants.ts` and split into two groups:

### Workspace Navigation (top)

| Item | Icon |
| --- | --- |
| Dashboard | LayoutDashboard |
| App Directory | Grip |
| Settings | Settings |

### Session Options (bottom)

| Item | Icon |
| --- | --- |
| Help | HelpCircle |
| Logout | LogOut |

Items are rendered as Mantine `Button` components with `subtle` variant, left-aligned with an icon and label.

## Key Files

| File | Purpose |
| --- | --- |
| `app/(dashboard)/dashboard/layout.tsx` | Dashboard shell layout |
| `components/Sidebar.tsx` | Sidebar component |
| `lib/constants/constants.ts` | Navigation item definitions |
| `components/ThemeToggle.tsx` | Theme toggle in navbar |
| `app/(dashboard)/dashboard/dashboard.css` | Dashboard layout styles |
