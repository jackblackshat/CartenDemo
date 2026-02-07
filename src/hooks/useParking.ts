import { useEffect, useState } from 'react';
import polyline from '@mapbox/polyline';
import Toast from 'react-native-toast-message';
import { API } from '../config/api';
import type { Coords } from '../types';

export default function useParking(destination: Coords | null) {
  const [geosegment, setGeosegment] = useState<number[][] | null>(null);

  useEffect(() => {
    const fetchGeosegment = async () => {
      if (!destination) return;
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/bb2dc183-ae2c-480c-a833-e5e9fcaa5246',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useParking.ts:fetchGeosegment',message:'useParking start',data:{lat:destination?.lat,lng:destination?.lng},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      const radii = [50, 100, 150, 200];
      for (const radius of radii) {
        const url = API.parking(destination, radius);
        try {
          const res = await fetch(url);
          if (!res.ok) continue;

          const json = await res.json();
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/bb2dc183-ae2c-480c-a833-e5e9fcaa5246',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useParking.ts:afterRes',message:'parking res ok',data:{hasGeoSegment:!!json?.geoSegment,status:res.status},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          const coordinates = polyline.decode(json.geoSegment, 6);
          setGeosegment(coordinates ?? null);
          return;
        } catch (err) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/bb2dc183-ae2c-480c-a833-e5e9fcaa5246',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useParking.ts:catch',message:'useParking error',data:{errMessage:String((err as Error)?.message)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          console.error('Error fetching parking', err);
        }
      }

      Toast.show({ type: 'error', text1: 'No parking data found within 200 meters.' });
    };

    fetchGeosegment();
  }, [destination]);

  return geosegment;
}
