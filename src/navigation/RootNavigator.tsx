import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
    <BlurView
      intensity={90}
      tint={isDark ? 'dark' : 'light'}
      style={StyleSheet.absoluteFill}
    />
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
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          height: 64,
          borderRadius: 32,
          borderTopWidth: 0,
          backgroundColor: isDark
            ? 'rgba(44, 44, 46, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 8,
          borderWidth: 1,
          borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
          paddingBottom: 0,
        },
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
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
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
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
