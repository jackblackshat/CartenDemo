import type { NavigatorScreenParams } from '@react-navigation/native';

export type MapStackParamList = {
  MapHome: undefined;
  SearchResults: undefined;
  SpotDetail: { id: string };
  Navigation: { destination?: { name: string; lat: number; lng: number } };
  GaragePaid: { id: string };
  Heatmap: undefined;
  EmptyState: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  NotificationSettings: undefined;
  MoreSettings: undefined;
};

export type RootTabParamList = {
  MapTab: NavigatorScreenParams<MapStackParamList>;
  ActivityTab: undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};
