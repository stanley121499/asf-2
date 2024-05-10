import { Flowbite, useThemeMode } from "flowbite-react";
import type { FC } from "react";
import { useEffect } from "react";
import { Outlet } from "react-router";
import theme from "../flowbite-theme";
import React from "react";

const FlowbiteWrapper: FC = function () {
  // const dark = localStorage.getItem("theme") === "dark";

  return (
    <Flowbite theme={{ mode: 'dark', theme }}>
      <PersistFlowbiteThemeToLocalStorage />
      <Outlet />
    </Flowbite>
  );
};

const PersistFlowbiteThemeToLocalStorage: FC = function () {
  const { mode: themeMode } = useThemeMode();

  useEffect(() => {
    localStorage.setItem("theme", themeMode);
  }, [themeMode]);

  return <></>;
};

export default FlowbiteWrapper;
