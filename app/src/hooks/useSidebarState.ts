import { useState, useEffect } from "react";

const SIDEBAR_STATE_KEY = "von-ai-sidebar-collapsed";

/**
 * Hook for managing sidebar collapse state with localStorage persistence
 * Follows Apple's principle of remembering user preferences
 */
export function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem(SIDEBAR_STATE_KEY);
    return stored === "true";
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  return {
    isCollapsed,
    toggleCollapse,
  };
}
