import React, { createContext, useContext, useState } from 'react';

interface LoadingContextType {
  showLoading: boolean;
  setShowLoading: (value: boolean) => void;
}

export const LoadingContext = createContext<LoadingContextType>({
  showLoading: false,
  setShowLoading: () => {},
});

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showLoading, setShowLoading] = useState(false);
  return (
    <LoadingContext.Provider value={{ showLoading, setShowLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext); 