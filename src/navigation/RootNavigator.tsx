import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../constants/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navRef = createNavigationContainerRef<RootStackParamList>();

export default function RootNavigator() {
  const { user, isLoading } = useAuth();

  // Toque numa notificacao push (app aberta ou fechada): abre o ecra certo.
  const lastResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!lastResponse || !user) return;
    if (lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const data = lastResponse.notification.request.content.data as { type?: string } | undefined;
    if (data?.type !== 'chat') return;
    const go = () => navRef.navigate('Main', { screen: 'MessagesTab' });
    if (navRef.isReady()) go();
    else {
      const t = setTimeout(() => { if (navRef.isReady()) go(); }, 800);
      return () => clearTimeout(t);
    }
  }, [lastResponse, user]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? <Stack.Screen name="Main" component={MainTabNavigator} /> : <Stack.Screen name="Auth" component={AuthNavigator} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
