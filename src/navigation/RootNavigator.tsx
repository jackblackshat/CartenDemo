import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useDarkMode } from '../context/DarkModeContext';

import MapHomeScreen from '../screens/MapHomeScreen';
import SearchResultsScreen from '../screens/SearchResultsScreen';
import SpotDetailScreen from '../screens/SpotDetailScreen';
import NavigationScreen from '../screens/NavigationScreen';
import GaragePaidScreen from '../screens/GaragePaidScreen';
import HeatmapScreen from '../screens/HeatmapScreen';
import EmptyStateScreen from '../screens/EmptyStateScreen';
import ActivityScreen from '../screens/ActivityScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import MoreSettingsScreen from '../screens/MoreSettingsScreen';

import type { RootTabParamList, MapStackParamList, ProfileStackParamList } from './types';

const defaultTabBarStyle = (isDark: boolean) => ({
  position: 'absolute' as const,
  bottom: 8,
  left: 48,
  right: 48,
  height: 64,
  borderRadius: 32,
  borderTopWidth: 0,
  backgroundColor: 'transparent',
  shadowColor: isDark ? '#000' : '#8A8D91',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: isDark ? 0.4 : 0.2,
  shadowRadius: 24,
  elevation: 12,
  borderWidth: 1,
  borderColor: isDark
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(255, 255, 255, 0.6)',
  paddingBottom: 0,
});

const Tab = createBottomTabNavigator<RootTabParamList>();
const MapStack = createNativeStackNavigator<MapStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function MapStackNavigator() {
  return (
    <MapStack.Navigator screenOptions={{ headerShown: false }}>
      <MapStack.Screen name="MapHome" component={MapHomeScreen} />
      <MapStack.Screen name="SearchResults" component={SearchResultsScreen} />
      <MapStack.Screen name="SpotDetail" component={SpotDetailScreen} />
      <MapStack.Screen name="Navigation" component={NavigationScreen} />
      <MapStack.Screen name="GaragePaid" component={GaragePaidScreen} />
      <MapStack.Screen name="Heatmap" component={HeatmapScreen} />
      <MapStack.Screen name="EmptyState" component={EmptyStateScreen} />
    </MapStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <ProfileStack.Screen name="MoreSettings" component={MoreSettingsScreen} />
    </ProfileStack.Navigator>
  );
}

function TabBarBackground() {
  const { isDark } = useDarkMode();
  return (
    <View style={[StyleSheet.absoluteFill, { borderRadius: 32, overflow: 'hidden' }]}>
      <BlurView
        intensity={60}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      {/* Tinted glass overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark
              ? 'rgba(30, 30, 32, 0.45)'
              : 'rgba(255, 255, 255, 0.35)',
          },
        ]}
      />
      {/* Top highlight edge */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 12,
          right: 12,
          height: 1,
          backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.15)'
            : 'rgba(255, 255, 255, 0.8)',
        }}
      />
    </View>
  );
}

export default function RootNavigator() {
  const { isDark } = useDarkMode();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#7FA98E',
        tabBarInactiveTintColor: isDark ? '#AEAEB2' : '#8A8D91',
        tabBarStyle: defaultTabBarStyle(isDark),
        tabBarBackground: () => <TabBarBackground />,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginBottom: 8,
        },
        tabBarIconStyle: {
          marginTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="MapTab"
        component={MapStackNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'MapHome';
          return {
            tabBarLabel: 'Map',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="map" size={size} color={color} />
            ),
            tabBarStyle:
              routeName === 'MapHome'
                ? defaultTabBarStyle(isDark)
                : { display: 'none' as const },
          };
        }}
      />
      <Tab.Screen
        name="ActivityTab"
        component={ActivityScreen}
        options={{
          tabBarLabel: 'Activity',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'ProfileMain';
          return {
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
            tabBarStyle:
              routeName === 'ProfileMain'
                ? defaultTabBarStyle(isDark)
                : { display: 'none' as const },
          };
        }}
      />
    </Tab.Navigator>
  );
}
