import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import HomeStackNavigator from './HomeStackNavigator';
import TripHistoryScreen from '../screens/history/TripHistoryScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import MessagesScreen from '../screens/messages/MessagesScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { colors, typography } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, { active: any; inactive: any }> = {
  HomeTab: { active: 'home', inactive: 'home-outline' },
  TripsTab: { active: 'car', inactive: 'car-outline' },
  WalletTab: { active: 'wallet', inactive: 'wallet-outline' },
  MessagesTab: { active: 'chatbubble', inactive: 'chatbubble-outline' },
  ProfileTab: { active: 'person', inactive: 'person-outline' },
};

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.55)',
        tabBarStyle: {
          backgroundColor: colors.inkDeep,
          borderTopColor: colors.inkDeep,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontFamily: typography.captionMedium.fontFamily, fontSize: 11 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = ICONS[route.name as keyof MainTabParamList];
          return <Ionicons name={focused ? icons.active : icons.inactive} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Início' }} />
      <Tab.Screen name="TripsTab" component={TripHistoryScreen} options={{ title: 'Viagens' }} />
      <Tab.Screen name="WalletTab" component={WalletScreen} options={{ title: 'Carteira' }} />
      <Tab.Screen name="MessagesTab" component={MessagesScreen} options={{ title: 'Mensagens' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}



