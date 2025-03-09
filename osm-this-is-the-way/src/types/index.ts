// types/index.ts
export type OSMElementType = 'node' | 'way' | 'relation';

export interface OSMElement {
  id: number;
  type: OSMElementType;
  version: number;
  timestamp: string;
  changeset: number;
  user: string;
  uid: number;
  tags?: Record<string, string>;
  // Additional properties based on element type
  lat?: number;
  lon?: number;
  nodes?: number[];
  members?: Array<{type: OSMElementType, ref: number, role: string}>;
}

export interface OSMHistory {
  elements: OSMElement[];
}
