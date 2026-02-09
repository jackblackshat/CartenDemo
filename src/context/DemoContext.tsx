import React, { createContext, useContext, useState, useCallback } from 'react';

export type DemoOverrides = {
  occupancy: number | null;       // 0-100 percentage, null = no override
  traffic: 'light' | 'moderate' | 'heavy' | null;
  forceReroute: boolean;
  cameraSpotAvailable: boolean | null;  // true = available, false = unavailable, null = auto
  phoneSpotFree: boolean | null;        // true = no one in spot, false = someone, null = auto
  workScenario: boolean;                // enables legal/regulatory stages 9-10
  parkingDuration: number | null;       // minutes, null = default (120)
};

type DemoContextType = {
  overrides: DemoOverrides;
  setOccupancy: (value: number | null) => void;
  setTraffic: (value: DemoOverrides['traffic']) => void;
  setForceReroute: (value: boolean) => void;
  setCameraSpotAvailable: (value: boolean | null) => void;
  setPhoneSpotFree: (value: boolean | null) => void;
  setWorkScenario: (value: boolean) => void;
  setParkingDuration: (value: number | null) => void;
  reset: () => void;
  hasOverrides: boolean;
};

const DEFAULT_OVERRIDES: DemoOverrides = {
  occupancy: null,
  traffic: null,
  forceReroute: false,
  cameraSpotAvailable: null,
  phoneSpotFree: null,
  workScenario: false,
  parkingDuration: null,
};

const DemoContext = createContext<DemoContextType>({
  overrides: DEFAULT_OVERRIDES,
  setOccupancy: () => {},
  setTraffic: () => {},
  setForceReroute: () => {},
  setCameraSpotAvailable: () => {},
  setPhoneSpotFree: () => {},
  setWorkScenario: () => {},
  setParkingDuration: () => {},
  reset: () => {},
  hasOverrides: false,
});

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<DemoOverrides>(DEFAULT_OVERRIDES);

  const setOccupancy = useCallback((value: number | null) => {
    setOverrides((prev) => ({ ...prev, occupancy: value }));
  }, []);

  const setTraffic = useCallback((value: DemoOverrides['traffic']) => {
    setOverrides((prev) => ({ ...prev, traffic: value }));
  }, []);

  const setForceReroute = useCallback((value: boolean) => {
    setOverrides((prev) => ({ ...prev, forceReroute: value }));
  }, []);

  const setCameraSpotAvailable = useCallback((value: boolean | null) => {
    setOverrides((prev) => ({ ...prev, cameraSpotAvailable: value }));
  }, []);

  const setPhoneSpotFree = useCallback((value: boolean | null) => {
    setOverrides((prev) => ({ ...prev, phoneSpotFree: value }));
  }, []);

  const setWorkScenario = useCallback((value: boolean) => {
    setOverrides((prev) => ({ ...prev, workScenario: value }));
  }, []);

  const setParkingDuration = useCallback((value: number | null) => {
    setOverrides((prev) => ({ ...prev, parkingDuration: value }));
  }, []);

  const reset = useCallback(() => {
    setOverrides(DEFAULT_OVERRIDES);
  }, []);

  const hasOverrides =
    overrides.occupancy !== null ||
    overrides.traffic !== null ||
    overrides.forceReroute ||
    overrides.cameraSpotAvailable !== null ||
    overrides.phoneSpotFree !== null ||
    overrides.workScenario ||
    overrides.parkingDuration !== null;

  return (
    <DemoContext.Provider
      value={{
        overrides,
        setOccupancy,
        setTraffic,
        setForceReroute,
        setCameraSpotAvailable,
        setPhoneSpotFree,
        setWorkScenario,
        setParkingDuration,
        reset,
        hasOverrides,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  return useContext(DemoContext);
}
