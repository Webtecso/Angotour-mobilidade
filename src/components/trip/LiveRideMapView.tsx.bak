import React from 'react';
import { ViewStyle } from 'react-native';
import RideMapView from './RideMapView';
import { Coordinates } from '../../types';

interface LiveRideMapViewProps {
  from: Coordinates;
  to: Coordinates;
  durationMs?: number;
  height?: number;
  style?: ViewStyle;
  zoom?: number;
  progressColor?: string;
  onProgress?: (fraction: number) => void;
  onComplete?: () => void;
  onRouteReady?: (distanceKm: number) => void;
}

export default function LiveRideMapView({
  from, to, durationMs = 12000, height = 220, style, progressColor, onProgress, onComplete, onRouteReady,
}: LiveRideMapViewProps) {
  return (
    <RideMapView
      origin={from}
      destination={to}
      routeColor={progressColor}
      height={height}
      style={style}
      live={{ durationMs, follow: true }}
      showEta={false}
      onProgress={onProgress}
      onComplete={onComplete}
      onRouteInfo={(info) => onRouteReady?.(info.distanceKm)}
    />
  );
}
