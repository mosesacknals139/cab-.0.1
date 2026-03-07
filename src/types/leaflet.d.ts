declare module "leaflet" {
  export type LatLngTuple = [number, number];

  export interface LeafletMouseEvent {
    latlng: {
      lat: number;
      lng: number;
    };
  }

  export interface MapOptions {
    center: LatLngTuple;
    zoom: number;
    zoomControl?: boolean;
  }

  export interface FitBoundsOptions {
    padding?: [number, number];
  }

  export interface FlyToOptions {
    duration?: number;
  }

  export interface DivIconOptions {
    className?: string;
    html?: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
  }

  export interface TileLayerOptions {
    attribution?: string;
  }

  export interface MarkerOptions {
    icon?: DivIcon;
  }

  export interface CircleMarkerOptions {
    radius?: number;
    color?: string;
    fillColor?: string;
    fillOpacity?: number;
  }

  export interface PolylineOptions {
    color?: string;
    weight?: number;
    opacity?: number;
  }

  export class Map {
    on(event: "click", handler: (event: LeafletMouseEvent) => void): this;
    off(event: "click", handler: (event: LeafletMouseEvent) => void): this;
    remove(): void;
    invalidateSize(): this;
    fitBounds(bounds: [LatLngTuple, LatLngTuple], options?: FitBoundsOptions): this;
    flyTo(center: LatLngTuple, zoom?: number, options?: FlyToOptions): this;
  }

  export class DivIcon {}

  export class TileLayer {
    addTo(map: Map): this;
  }

  export class Marker {
    addTo(map: Map): this;
    remove(): this;
  }

  export class CircleMarker {
    addTo(map: Map): this;
    remove(): this;
  }

  export class Polyline {
    addTo(map: Map): this;
    remove(): this;
  }

  export function map(container: HTMLElement, options: MapOptions): Map;
  export function divIcon(options: DivIconOptions): DivIcon;
  export function tileLayer(urlTemplate: string, options?: TileLayerOptions): TileLayer;
  export function marker(latlng: LatLngTuple, options?: MarkerOptions): Marker;
  export function circleMarker(latlng: LatLngTuple, options?: CircleMarkerOptions): CircleMarker;
  export function polyline(latlngs: LatLngTuple[], options?: PolylineOptions): Polyline;

  const L: {
    map: typeof map;
    divIcon: typeof divIcon;
    tileLayer: typeof tileLayer;
    marker: typeof marker;
    circleMarker: typeof circleMarker;
    polyline: typeof polyline;
  };

  export default L;
}
