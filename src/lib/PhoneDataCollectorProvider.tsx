import React, { createContext, useContext, useEffect, useRef } from 'react';
import { PhoneDataCollector } from './phoneData/PhoneDataCollector';

const PhoneDataCollectorContext = createContext<PhoneDataCollector | null>(null);

export function PhoneDataCollectorProvider({ children }: { children: React.ReactNode }) {
  const collectorRef = useRef<PhoneDataCollector | null>(null);

  if (!collectorRef.current) {
    collectorRef.current = new PhoneDataCollector();
  }

  useEffect(() => {
    const collector = collectorRef.current;
    if (!collector) return;
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/bb2dc183-ae2c-480c-a833-e5e9fcaa5246',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PhoneDataCollectorProvider.tsx:init',message:'PhoneDataCollector init start',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    collector.initialize().catch((err: unknown) => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/bb2dc183-ae2c-480c-a833-e5e9fcaa5246',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PhoneDataCollectorProvider.tsx:initCatch',message:'PhoneDataCollector init failed',data:{errMessage:String((err as Error)?.message)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      console.warn('PhoneDataCollector init failed:', err);
    });

    return () => {
      collector.destroy();
    };
  }, []);

  return (
    <PhoneDataCollectorContext.Provider value={collectorRef.current}>
      {children}
    </PhoneDataCollectorContext.Provider>
  );
}

export function usePhoneDataCollector(): PhoneDataCollector | null {
  return useContext(PhoneDataCollectorContext);
}
