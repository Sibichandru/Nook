import {
  LayoutDashboard,
  Grip,
  Settings,
  HelpCircle,
  LogOut,
  LucideIcon,
} from "lucide-react";

type NavItem = {
  text: string;
  icon: LucideIcon;
};

export const constants = {
  SIDEBAR: {
    workspaceNavigation: [
      { text: "Dashboard", icon: LayoutDashboard },
      { text: "App Directory", icon: Grip },
      { text: "Settings", icon: Settings },
    ] as NavItem[],
    sessionOptions: [
      { text: "Help", icon: HelpCircle },
      { text: "Logout", icon: LogOut },
    ] as NavItem[],
  },
};
