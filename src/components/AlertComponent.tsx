import React from 'react';
import { useAlertContext } from '../context/AlertContext';
import { Alert } from 'flowbite-react';

export const AlertComponent: React.FC = () => {
  const { message, type, visible, hideAlert } = useAlertContext();

  return (
    <>
      {visible && (
      <div className="fixed top-0 right-0 z-50 p-4 m-4 w-80">
        <Alert color={type} onDismiss={hideAlert} rounded withBorderAccent>
          {message}
        </Alert>
      </div>
      )}
    </>
  );
};