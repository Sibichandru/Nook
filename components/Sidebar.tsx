"use client";
import { constants } from "@/lib/constants/constants";
import { Button } from "@mantine/core";

const { SIDEBAR } = constants;
export const Sidebar = () => {
  return (
    <nav className="sidebar h-[calc(100vh-56px)]">
      <div className="px-3 py-6 flex flex-col h-full justify-between">
        <div>
          {SIDEBAR?.workspaceNavigation?.map(({ text, icon: Icon }) => (
            <Button
              key={text}
              fullWidth
              justify="flex-start"
              className="flex py-3"
            >
              <Icon size={20} /> <span className="px-2.5">{text}</span>
            </Button>
          ))}
        </div>
        <div>
          {SIDEBAR?.sessionOptions?.map(({ text, icon: Icon }) => (
            <Button
              key={text}
              fullWidth
              justify="flex-start"
              className="flex py-4"
            >
              <Icon size={20} /> <span className="px-2.5">{text}</span>
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
};
