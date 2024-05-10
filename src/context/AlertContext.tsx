import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type AlertContextType = {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  showAlert: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  hideAlert: () => void;
  visible: boolean;
};

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('success');
  const [visible, setVisible] = useState(false);

  const showAlert = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    setMessage(message);
    setType(type);
    setVisible(true);
  };

  const hideAlert = () => {
    setMessage('');
    setType('info');
    setVisible(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <AlertContext.Provider value={{ message, type, showAlert, hideAlert, visible }}>
      {children}
    </AlertContext.Provider>
  );
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlertContext = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};