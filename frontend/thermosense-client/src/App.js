// Path: frontend/thermosense-client/src/App.js

import { useEffect } from "react";
import Dashboard from "./components/Dashboard";
import "./App.css";

export default function App() {
  useEffect(() => {
    // Check for system color scheme preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = prefersDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  return <Dashboard />;
}