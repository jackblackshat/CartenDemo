import MapboxGL from '@rnmapbox/maps';
import { MAPBOX_TOKEN } from './api';

MapboxGL.setAccessToken(MAPBOX_TOKEN);

export default MapboxGL;
