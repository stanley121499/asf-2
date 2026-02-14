import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * AlertContextType
 *
 * Describes the shape of the alert context used for showing simple toast-style alerts.
 */
type AlertContextType = {
  message: string;
  type: "info" | "success" | "warning" | "error";
  showAlert: (message: string, type: "info" | "success" | "warning" | "error") => void;
  hideAlert: () => void;
  visible: boolean;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

/**
 * AlertProvider
 *
 * Stores alert message + type and exposes memoized actions to show/hide alerts.
 */
export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "success" | "warning" | "error">("success");
  const [visible, setVisible] = useState(false);

  /**
   * Shows an alert for a short period of time.
   */
  const showAlert = useCallback((nextMessage: string, nextType: "info" | "success" | "warning" | "error") => {
    // Step 1: set message/type
    setMessage(nextMessage);
    setType(nextType);

    // Step 2: make it visible
    setVisible(true);
  }, []);

  /**
   * Immediately hides and clears the current alert.
   */
  const hideAlert = useCallback(() => {
    // Step 1: clear message/type back to defaults
    setMessage("");
    setType("info");

    // Step 2: hide alert
    setVisible(false);
  }, []);

  // Auto-hide after a short delay whenever the alert becomes visible.
  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [visible]);

  // Memoize context value so consumers don't re-render unless something actually changes.
  const value = useMemo<AlertContextType>(
    () => ({
      message,
      type,
      showAlert,
      hideAlert,
      visible,
    }),
    [message, type, showAlert, hideAlert, visible]
  );

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
};

/**
 * Hook to access the Alert context.
 */
export const useAlertContext = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlertContext must be used within an AlertProvider");
  }
  return context;
};