// Mapa Leaflet dentro de WebView (funciona no Expo Go). Recebe estado via window.setState(...).
export const RIDE_MAP_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  :root { --c: #0FA968; }
  html, body, #map { height: 100%; margin: 0; padding: 0; background: #EEF2EF; }
  .leaflet-control-attribution { font-size: 8px; opacity: 0.7; }
  .me { position: relative; width: 18px; height: 18px; }
  .me .dot { position: absolute; left: 0; top: 0; width: 18px; height: 18px; border-radius: 50%; background: var(--c); border: 3px solid #fff; box-sizing: border-box; box-shadow: 0 1px 4px rgba(0,0,0,0.35); }
  .me .pulse { position: absolute; left: -15px; top: -15px; width: 48px; height: 48px; border-radius: 50%; background: var(--c); animation: pulse 2s ease-out infinite; }
  @keyframes pulse { 0% { transform: scale(0.3); opacity: 0.5; } 100% { transform: scale(1); opacity: 0; } }
  .car { transform-origin: 50% 50%; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.35)); }
  .dest { width: 90px; height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3)); }
  .pill { background: #111; color: #fff; font: 600 12px -apple-system, system-ui, sans-serif; padding: 4px 9px; border-radius: 12px; margin-bottom: 3px; white-space: nowrap; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var root = document.documentElement;
var map = L.map('map', { zoomControl: false, attributionControl: true });
map.attributionControl.setPrefix(false);
var tileUrl = "__TILE_URL__";
var tileOptions = { maxZoom: 19, attribution: "__TILE_ATTRIBUTION__" };
if (tileUrl.indexOf("cartocdn") !== -1) tileOptions.subdomains = "abcd";
L.tileLayer(tileUrl, tileOptions).addTo(map);

function post(o) { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(o)); }
function rad(d) { return d * Math.PI / 180; }
function hav(a, b) {
  var R = 6371, dLat = rad(b[0] - a[0]), dLon = rad(b[1] - a[1]);
  var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
function bearing(a, b) {
  var y = Math.sin(rad(b[1] - a[1])) * Math.cos(rad(b[0]));
  var x = Math.cos(rad(a[0])) * Math.sin(rad(b[0])) - Math.sin(rad(a[0])) * Math.cos(rad(b[0])) * Math.cos(rad(b[1] - a[1]));
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
function lerpAngle(a, b, t) { var d = ((b - a + 540) % 360) - 180; return (a + d * t + 360) % 360; }
function ll(p) { return [p.latitude, p.longitude]; }
function clean(s) { return String(s).replace(/[<>&]/g, ''); }

function carSvg(color) {
  return '<svg width="26" height="44" viewBox="0 0 28 48">' +
    '<rect x="3" y="2" width="22" height="44" rx="9" fill="' + color + '" stroke="rgba(0,0,0,0.35)" stroke-width="1"/>' +
    '<path d="M7 15 L21 15 L19.5 22 L8.5 22 Z" fill="#CFE3F3"/>' +
    '<path d="M8.5 34 L19.5 34 L21 39 L7 39 Z" fill="#CFE3F3"/>' +
    '<rect x="8.5" y="22" width="11" height="12" rx="2" fill="rgba(255,255,255,0.25)"/>' +
    '<circle cx="8" cy="5.5" r="1.8" fill="#FFF3B0"/><circle cx="20" cy="5.5" r="1.8" fill="#FFF3B0"/>' +
    '</svg>';
}
function carIcon(color, angle) {
  return L.divIcon({ className: '', html: '<div class="car" style="transform:rotate(' + angle + 'deg)">' + carSvg(color) + '</div>', iconSize: [26, 44], iconAnchor: [13, 22] });
}
function rot(m, a) { var el = m.getElement(); if (el && el.firstChild) el.firstChild.style.transform = 'rotate(' + a + 'deg)'; }
function animateTo(m, to, ms) {
  var from = m.getLatLng(), t0 = null;
  if (m._raf) cancelAnimationFrame(m._raf);
  function step(ts) {
    if (t0 === null) t0 = ts;
    var k = Math.min(1, (ts - t0) / ms);
    m.setLatLng([from.lat + (to[0] - from.lat) * k, from.lng + (to[1] - from.lng) * k]);
    if (k < 1) m._raf = requestAnimationFrame(step);
  }
  m._raf = requestAnimationFrame(step);
}
function pinHtml(color, label) {
  return '<div class="dest">' + (label ? '<div class="pill">' + clean(label) + '</div>' : '') +
    '<svg width="34" height="44" viewBox="0 0 34 44"><path d="M17 0C7.6 0 0 7.5 0 16.8 0 29 17 44 17 44s17-15 17-27.2C34 7.5 26.4 0 17 0z" fill="' + color + '"/><circle cx="17" cy="16.5" r="6" fill="#fff"/></svg></div>';
}

var cur = { color: '#0FA968', cars: [] };
var inited = false, lastKey = '', routeKey = '', routeReq = 0, liveSig = '';
var originM = null, destM = null, casing = null, line = null, traveled = null, liveCar = null;
var cars = [], carsKey = '', routeCoords = null, routeInfo = null, anim = null;

function setOrigin(o) {
  if (!originM) {
    originM = L.marker(ll(o), { icon: L.divIcon({ className: '', html: '<div class="me"><div class="pulse"></div><div class="dot"></div></div>', iconSize: [18, 18], iconAnchor: [9, 9] }), zIndexOffset: 500, interactive: false }).addTo(map);
  } else { originM.setLatLng(ll(o)); }
}

function renderDest() {
  if (!cur.destination) { if (destM) { map.removeLayer(destM); destM = null; } return; }
  var label = '';
  if (cur.showEta && !cur.live) label = cur.etaLabel || (routeInfo ? routeInfo.min + ' min' : '');
  var icon = L.divIcon({ className: '', html: pinHtml(cur.color, label), iconSize: [90, 80], iconAnchor: [45, 80] });
  if (!destM) destM = L.marker(ll(cur.destination), { icon: icon, zIndexOffset: 400, interactive: false }).addTo(map);
  else { destM.setLatLng(ll(cur.destination)); destM.setIcon(icon); }
}

function stopLive() { if (anim) cancelAnimationFrame(anim); anim = null; }
function dropRoute() {
  routeReq++;
  stopLive();
  [casing, line, traveled, liveCar].forEach(function (l) { if (l) map.removeLayer(l); });
  casing = null; line = null; traveled = null; liveCar = null; routeCoords = null; routeInfo = null;
}

function applyRoute(coords, km, min) {
  routeCoords = coords;
  routeInfo = { km: km, min: Math.max(1, Math.round(min)) };
  casing = L.polyline(coords, { color: '#ffffff', weight: 10, opacity: 1, lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(map);
  line = L.polyline(coords, { color: cur.color, weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(map);
  renderDest();
  if (!cur.live || !cur.live.follow) {
    map.fitBounds(L.latLngBounds(coords), { paddingTopLeft: [36, 90], paddingBottomRight: [36, 44], animate: true });
  }
  post({ type: 'route', km: km, min: routeInfo.min });
  if (cur.live) startLive();
}

var MAPBOX_TOKEN = "__MAPBOX_TOKEN__";

function fetchMapboxRoute(o, d) {
  var url = 'https://api.mapbox.com/directions/v5/mapbox/driving/' + o.longitude + ',' + o.latitude + ';' + d.longitude + ',' + d.latitude +
    '?geometries=geojson&overview=full&access_token=' + MAPBOX_TOKEN;
  return fetch(url).then(function (r) { return r.json(); }).then(function (j) {
    var rt = j && j.routes && j.routes[0];
    if (!rt) throw new Error('sem rota mapbox');
    return { coords: rt.geometry.coordinates.map(function (c) { return [c[1], c[0]]; }), km: rt.distance / 1000, min: rt.duration / 60 };
  });
}

function fetchOsrmRoute(o, d) {
  var url = 'https://router.project-osrm.org/route/v1/driving/' + o.longitude + ',' + o.latitude + ';' + d.longitude + ',' + d.latitude + '?overview=full&geometries=geojson';
  return fetch(url).then(function (r) { return r.json(); }).then(function (j) {
    var rt = j && j.routes && j.routes[0];
    if (!rt) throw new Error('sem rota osrm');
    return { coords: rt.geometry.coordinates.map(function (c) { return [c[1], c[0]]; }), km: rt.distance / 1000, min: rt.duration / 60 };
  });
}

function loadRoute() {
  var o = cur.origin, d = cur.destination, id = ++routeReq;
  var useMapbox = MAPBOX_TOKEN && MAPBOX_TOKEN.indexOf('pk.') === 0;
  var p = useMapbox
    ? fetchMapboxRoute(o, d).catch(function () { return fetchOsrmRoute(o, d); })
    : fetchOsrmRoute(o, d);
  p.then(function (r) {
    if (id !== routeReq) return;
    applyRoute(r.coords, r.km, r.min);
  }).catch(function () {
    if (id !== routeReq) return;
    var km = hav(ll(o), ll(d));
    applyRoute([ll(o), ll(d)], km, km / 22 * 60);
  });
}
function startLive() {
  stopLive();
  if (!routeCoords || !cur.live || !line || !casing) return;
  var coords = routeCoords, cum = [0], i;
  for (i = 1; i < coords.length; i++) cum.push(cum[i - 1] + hav(coords[i - 1], coords[i]));
  var total = cum[cum.length - 1] || 0.001;
  if (!traveled) traveled = L.polyline([], { color: '#9AA5A0', weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(map);
  if (!liveCar) liveCar = L.marker(coords[0], { icon: carIcon(cur.color, 0), zIndexOffset: 1000, interactive: false }).addTo(map);
  function pointAt(d, from) {
    var j = from;
    while (j < cum.length - 2 && cum[j + 1] < d) j++;
    var a = coords[j], b = coords[j + 1] || a, seg = cum[j + 1] - cum[j];
    var t = seg > 0 ? Math.max(0, Math.min(1, (d - cum[j]) / seg)) : 0;
    return { i: j, pt: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] };
  }
  var idx = 0, t0 = null, lastDraw = 0, lastFollow = 0, hdg = null;
  if (cur.live.follow) map.setView(coords[0], 16, { animate: false });
  function frame(ts) {
    if (t0 === null) t0 = ts;
    var k = Math.min(1, (ts - t0) / cur.live.durationMs);
    var d = total * k;
    var p = pointAt(d, idx); idx = p.i;
    var ahead = pointAt(Math.min(total, d + 0.03), idx);
    if (hav(p.pt, ahead.pt) > 0.002) {
      var target = bearing(p.pt, ahead.pt);
      hdg = hdg === null ? target : lerpAngle(hdg, target, 0.2);
    }
    liveCar.setLatLng(p.pt);
    if (hdg !== null) rot(liveCar, hdg);
    if (ts - lastDraw > 200 || k >= 1) {
      traveled.setLatLngs(coords.slice(0, idx + 1).concat([p.pt]));
      line.setLatLngs([p.pt].concat(coords.slice(idx + 1)));
      lastDraw = ts;
      post({ type: 'progress', f: k });
    }
    if (cur.live.follow && ts - lastFollow > 120) { map.setView(p.pt, map.getZoom(), { animate: false }); lastFollow = ts; }
    if (k < 1) anim = requestAnimationFrame(frame);
    else { anim = null; post({ type: 'complete' }); }
  }
  anim = requestAnimationFrame(frame);
}

function setCars(list) {
  var k = JSON.stringify(list);
  if (k === carsKey) return;
  carsKey = k;
  while (cars.length > list.length) map.removeLayer(cars.pop());
  list.forEach(function (c, i) {
    var to = [c.latitude, c.longitude];
    if (!cars[i]) {
      cars[i] = L.marker(to, { icon: carIcon('#263238', (i * 97) % 360), interactive: false, zIndexOffset: 100 }).addTo(map);
    } else {
      var f = cars[i].getLatLng(), from = [f.lat, f.lng];
      if (hav(from, to) > 0.005) rot(cars[i], bearing(from, to));
      animateTo(cars[i], to, 1800);
    }
  });
}

window.setState = function (s) {
  var key = JSON.stringify(s);
  if (key === lastKey) return;
  lastKey = key;
  var prevDest = cur.destination;
  cur = s;
  root.style.setProperty('--c', s.color);

  if (!inited) {
    var c = s.center || s.origin;
    map.setView([c.latitude, c.longitude], s.zoom || 14, { animate: false });
    inited = true;
    if (s.interactive) {
      map.on('moveend', function () { var m = map.getCenter(); post({ type: 'center', latitude: m.lat, longitude: m.lng }); });
    }
  }

  if (s.live) { if (originM) { map.removeLayer(originM); originM = null; } } else { setOrigin(s.origin); }
  setCars(s.live ? [] : (s.cars || []));

  var od = s.destination ? (s.origin.latitude + ',' + s.origin.longitude + '>' + s.destination.latitude + ',' + s.destination.longitude) : '';
  var sig = JSON.stringify(s.live || null);
  if (!s.destination) {
    if (routeKey !== '') {
      dropRoute(); routeKey = '';
      if (prevDest) map.setView(ll(s.origin), s.zoom || 14);
    }
    renderDest();
  } else if (od !== routeKey) {
    dropRoute(); routeKey = od; liveSig = sig;
    renderDest();
    loadRoute();
  } else {
    if (line) line.setStyle({ color: s.color });
    renderDest();
    if (sig !== liveSig) {
      liveSig = sig;
      if (s.live) startLive(); else stopLive();
    }
  }
};

post({ type: 'ready' });
</script>
</body>
</html>`;


