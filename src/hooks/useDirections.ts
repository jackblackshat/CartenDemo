import { useEffect, useState } from 'react';
import { API } from '../config/api';
import type { Coords, RouteGeometry } from '../types';

export default function useDirections(
  origin: Coords | null,
  destination: number[][] | null,
) {
  const [route, setRoute] = useState<RouteGeometry | null>(null);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!origin || !destination) return;
      // #region agent log
      const destFirst = destination?.[0];
      const hasValidDest = Array.isArray(destFirst) && destFirst.length >= 2;
      fetch('http://127.0.0.1:7243/ingest/bb2dc183-ae2c-480c-a833-e5e9fcaa5246',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDirections.ts:fetchRoute',message:'useDirections start',data:{hasOrigin:!!origin,hasDestination:!!destination,destLen:destination?.length,hasValidDest},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      if (!hasValidDest) return;
      const url = API.routing(
        origin.lng,
        origin.lat,
        destination[0][1],
        destination[0][0],
      );

      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.error('Routing fetch failed', res.status);
          return;
        }
        const json = await res.json();
        setRoute(json.routes?.[0]?.geometry ?? null);
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/bb2dc183-ae2c-480c-a833-e5e9fcaa5246',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDirections.ts:catch',message:'useDirections error',data:{errMessage:String((err as Error)?.message)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        console.error('Error fetching route', err);
      }
    };

    fetchRoute();
  }, [destination]);

  return route;
}
