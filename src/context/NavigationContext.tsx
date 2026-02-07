import React, { createContext, useContext, useState, useCallback } from 'react';

interface Destination {
  name: string;
  lat: number;
  lng: number;
}

interface NavigationContextType {
  selectedDestination: Destination | null;
  setSelectedDestination: (dest: Destination | null) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [selectedDestination, setDest] = useState<Destination | null>(null);

  const setSelectedDestination = useCallback((dest: Destination | null) => {
    setDest(dest);
  }, []);

  return (
    <NavigationContext.Provider value={{ selectedDestination, setSelectedDestination }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationContext() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigationContext must be used within a NavigationProvider');
  }
  return context;
}
