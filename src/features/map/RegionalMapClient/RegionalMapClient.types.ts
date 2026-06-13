// Props for RegionalMapClient — optional map config overrides

export interface RegionalMapClientProps {
  center?: [number, number]; // default [57.5, 1.5] — North Sea
  zoom?: number;             // default 5
}
