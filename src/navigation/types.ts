import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  OtpVerification: undefined;
  Register: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  SearchDestination: undefined;
  ChooseCategory: undefined;
  PickOnMap: { target?: 'origin' | 'destination' } | undefined;
  RequestingDriver: undefined;
  TripInProgress: undefined;
  TripCompleted: undefined;
  AllDestinations: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  TripsTab: undefined;
  WalletTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}






