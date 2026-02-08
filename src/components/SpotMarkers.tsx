import React, { useMemo } from 'react';
import MapboxGL from '@rnmapbox/maps';
import type { DetectedSpot } from '../types';

interface Props {
  spots: DetectedSpot[];
  selectedSpotId?: string | null;
  onSpotPress?: (spotId: string) => void;
}

export default function SpotMarkers({ spots, selectedSpotId, onSpotPress }: Props) {
  const geoJSON: GeoJSON.FeatureCollection = useMemo(() => ({
    type: 'FeatureCollection',
    features: spots.map((spot) => ({
      type: 'Feature' as const,
      id: spot.id,
      properties: {
        id: spot.id,
        isEmpty: spot.label === 'empty',
        isSelected: spot.id === selectedSpotId,
        color: spot.label === 'empty' ? '#7FA98E' : '#B87C7C',
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [spot.lng, spot.lat],
      },
    })),
  }), [spots, selectedSpotId]);

  const handlePress = (e: any) => {
    const feature = e?.features?.[0];
    if (feature?.properties?.id && onSpotPress) {
      onSpotPress(feature.properties.id);
    }
  };

  return (
    <MapboxGL.ShapeSource
      id="intelligenceSpots"
      shape={geoJSON}
      onPress={handlePress}
    >
      <MapboxGL.CircleLayer
        id="intelligenceSpotsCircle"
        style={{
          circleRadius: [
            'case',
            ['get', 'isSelected'], 14,
            8,
          ],
          circleColor: ['get', 'color'],
          circleStrokeWidth: [
            'case',
            ['get', 'isSelected'], 3,
            2,
          ],
          circleStrokeColor: '#FFFFFF',
          circleOpacity: [
            'case',
            ['get', 'isEmpty'], 1,
            0.6,
          ],
        }}
      />
    </MapboxGL.ShapeSource>
  );
}
