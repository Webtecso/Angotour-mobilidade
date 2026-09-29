import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Coordinates } from '../../types';
import { colors, radius } from '../../constants/theme';
import { RIDE_MAP_HTML } from './rideMapHtml';
import { MAPBOX_ACCESS_TOKEN } from '../../constants/env';

// Mapbox Streets quando ha token configurado em src/constants/env.ts.
// Sem token, cai automaticamente no CARTO Voyager (gratuito, sem chave) -
// assim o mapa nunca fica quebrado, mesmo que a chave ainda nao exista.
const CARTO_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const CARTO_ATTRIBUTION = '&copy; OpenStreetMap &copy; CARTO';

const MAPBOX_TILE_URL = 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}@2x?access_token=' + MAPBOX_ACCESS_TOKEN;
const MAPBOX_ATTRIBUTION = '&copy; Mapbox &copy; OpenStreetMap';

const hasMapboxToken = !!MAPBOX_ACCESS_TOKEN && MAPBOX_ACCESS_TOKEN.indexOf('pk.') === 0;

const MAP_HTML = RIDE_MAP_HTML
  .replace('__TILE_URL__', hasMapboxToken ? MAPBOX_TILE_URL : CARTO_TILE_URL)
  .replace('__TILE_ATTRIBUTION__', hasMapboxToken ? MAPBOX_ATTRIBUTION : CARTO_ATTRIBUTION);

export interface RouteInfo {
  distanceKm: number;
  durationMin: number;
}

interface RideMapViewProps {
  origin: Coordinates;
  destination?: Coordinates | null;
  carMarkers?: Coordinates[];
  routeColor?: string;
  initialCenter?: Coordinates;
  height?: number;
  style?: ViewStyle;
  zoom?: number;
  onCenterChange?: (coords: Coordinates) => void;
  onRouteInfo?: (info: RouteInfo) => void;
  // Modo viagem em curso: o carro percorre a rota, a parte feita fica cinzenta.
  live?: { durationMs: number; follow?: boolean };
  onProgress?: (fraction: number) => void;
  onComplete?: () => void;
  showEta?: boolean;
  etaLabel?: string;
}

const SOURCE = { html: MAP_HTML };

export default function RideMapView({
  origin, destination, carMarkers, routeColor, initialCenter, height = 220, style, zoom = 14,
  onCenterChange, onRouteInfo, live, onProgress, onComplete, showEta = true, etaLabel,
}: RideMapViewProps) {
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  const lastSent = useRef<string | null>(null);
  const cb = useRef({ onCenterChange, onRouteInfo, onProgress, onComplete });
  cb.current = { onCenterChange, onRouteInfo, onProgress, onComplete };

  const json = JSON.stringify({
    origin,
    destination: destination ?? null,
    cars: carMarkers ?? [],
    color: routeColor ?? colors.primary,
    center: initialCenter ?? null,
    zoom,
    interactive: !!onCenterChange,
    live: live ?? null,
    showEta,
    etaLabel: etaLabel ?? null,
  });
  const jsonRef = useRef(json);
  jsonRef.current = json;

  const push = () => {
    if (!readyRef.current || lastSent.current === jsonRef.current) return;
    lastSent.current = jsonRef.current;
    webRef.current?.injectJavaScript('window.setState(' + jsonRef.current + '); true;');
  };
  const pushRef = useRef(push);
  pushRef.current = push;

  // Corre a cada render, mas so envia ao mapa quando o estado mudou de facto.
  useEffect(() => {
    push();
  });

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const m = JSON.parse(event.nativeEvent.data);
      if (m.type === 'ready') {
        readyRef.current = true;
        lastSent.current = null;
        pushRef.current();
      } else if (m.type === 'center') {
        cb.current.onCenterChange?.({ latitude: m.latitude, longitude: m.longitude });
      } else if (m.type === 'route') {
        cb.current.onRouteInfo?.({ distanceKm: m.km, durationMin: m.min });
      } else if (m.type === 'progress') {
        cb.current.onProgress?.(m.f);
      } else if (m.type === 'complete') {
        cb.current.onComplete?.();
      }
    } catch {
      // ignora mensagens invalidas
    }
  };

  return (
    <View style={[styles.container, { height, borderRadius: radius.lg }, style]}>
      <WebView
        ref={webRef}
        source={SOURCE}
        originWhitelist={['*']}
        style={StyleSheet.absoluteFill}
        onMessage={handleMessage}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden', width: '100%', backgroundColor: colors.surfaceAlt },
});




