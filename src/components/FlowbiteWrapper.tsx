import React, { useEffect } from "react";
import type { FC } from "react";
import { Flowbite, useThemeMode } from "flowbite-react";
import { Outlet } from "react-router";
import theme from "../flowbite-theme";

/**
 * Reads the persisted theme preference from localStorage.
 * Falls back to "dark" if nothing is stored (preserving previous behaviour).
 */
function getInitialThemeMode(): "light" | "dark" | "auto" {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark" || stored === "auto") {
    return stored;
  }
  return "dark";
}

const FlowbiteWrapper: FC = function () {
  const initialMode = getInitialThemeMode();

  return (
    <Flowbite theme={{ mode: initialMode, theme }}>
      <PersistFlowbiteThemeToLocalStorage />
      <Outlet />
    </Flowbite>
  );
};

/** Syncs the active Flowbite theme mode back to localStorage whenever it changes. */
const PersistFlowbiteThemeToLocalStorage: FC = function () {
  const { mode: themeMode } = useThemeMode();

  useEffect(() => {
    localStorage.setItem("theme", themeMode);
  }, [themeMode]);

  return <></>;
};

export default FlowbiteWrapper;
