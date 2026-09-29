import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from './types';
import HomeScreen from '../screens/home/HomeScreen';
import SearchDestinationScreen from '../screens/search/SearchDestinationScreen';
import ChooseCategoryScreen from '../screens/trip/ChooseCategoryScreen';
import PickOnMapScreen from '../screens/search/PickOnMapScreen';
import RequestingDriverScreen from '../screens/trip/RequestingDriverScreen';
import TripInProgressScreen from '../screens/trip/TripInProgressScreen';
import TripCompletedScreen from '../screens/trip/TripCompletedScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

import AllDestinationsScreen from '../screens/search/AllDestinationsScreen';

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="SearchDestination" component={SearchDestinationScreen} />
      <Stack.Screen name="ChooseCategory" component={ChooseCategoryScreen} />
      <Stack.Screen name="PickOnMap" component={PickOnMapScreen} />
      <Stack.Screen name="RequestingDriver" component={RequestingDriverScreen} />
      <Stack.Screen name="TripInProgress" component={TripInProgressScreen} />
      <Stack.Screen name="TripCompleted" component={TripCompletedScreen} />
      <Stack.Screen name="AllDestinations" component={AllDestinationsScreen} />
    </Stack.Navigator>
  );
}


