export type TourGroup = "living" | "dining" | "kitchen" | "bedrooms" | "balcony";
export type TourViewId = "living" | "dining" | "kitchen" | "master" | "bed3" | "bed2" | "balcony";

export interface TourWindow {
  position: [number, number, number];
  target: [number, number, number];
  width: number;
  height: number;
  intensity: number;
  color?: number;
}

export interface TourViewDef {
  id: TourViewId;
  group: TourGroup;
  index: string;
  label: string;
  description: string;
  eye: [number, number];
  target: [number, number, number];
  windows: TourWindow[];
  exposure?: number;
}

export const TOUR_VIEWS: Record<TourViewId, TourViewDef> = {
  living: {
    id: "living",
    group: "living",
    index: "01",
    label: "Living Room",
    description: "Garden outlook · soft west light",
    eye: [-2.4, -2.6],
    target: [-5.6, 1.2, -6.2],
    exposure: 1.04,
    windows: [
      { position: [-6.5, 2.2, -5.75], target: [-4, 1.6, -5.75], width: 3.1, height: 2.7, intensity: 6 },
      { position: [-4.15, 2.2, -8.5], target: [-4.15, 1.6, -6], width: 2.8, height: 2.6, intensity: 4.5 },
    ],
  },
  dining: {
    id: "dining",
    group: "dining",
    index: "02",
    label: "Dining Area",
    description: "Open-plan living · westward garden window",
    eye: [-2.1, 2.2],
    target: [-5.5, 1.3, 1.1],
    exposure: 1.07,
    windows: [
      { position: [-6.5, 2.1, -1.7], target: [-4.2, 1.5, -1.7], width: 1.9, height: 2.1, intensity: 4.4 },
    ],
  },
  kitchen: {
    id: "kitchen",
    group: "kitchen",
    index: "03",
    label: "Kitchen",
    description: "Garden-facing sink · stone and timber",
    eye: [-2.95, 4.35],
    target: [-4.2, 1.2, 7.4],
    exposure: 1.04,
    windows: [
      { position: [-3.25, 2.2, 8.5], target: [-3.25, 1.6, 6.2], width: 1.7, height: 2.1, intensity: 5 },
    ],
  },
  master: {
    id: "master",
    group: "bedrooms",
    index: "04",
    label: "Master Bedroom",
    description: "Garden aspect · calm, private suite",
    eye: [2.25, -3.9],
    target: [5.5, 1.3, -6.2],
    exposure: 1.04,
    windows: [
      { position: [4.1, 2.2, -8.5], target: [4.1, 1.6, -5.8], width: 2.9, height: 2.3, intensity: 6 },
      { position: [6.5, 2.1, -5.5], target: [4.5, 1.6, -5.5], width: 1.0, height: 2.0, intensity: 3 },
    ],
  },
  bed3: {
    id: "bed3",
    group: "bedrooms",
    index: "04",
    label: "Bedroom 3",
    description: "Private garden access · soft eastern light",
    eye: [2.35, 2.6],
    target: [5.8, 1.25, 1.3],
    exposure: 1.06,
    windows: [
      { position: [6.5, 2.0, 0.7], target: [4.6, 1.6, 0.7], width: 1.0, height: 2.6, intensity: 4 },
    ],
  },
  bed2: {
    id: "bed2",
    group: "bedrooms",
    index: "04",
    label: "Bedroom 2",
    description: "Leafy garden outlook · quiet rear corner",
    eye: [2.3, 6.3],
    target: [5.6, 1.25, 7.6],
    exposure: 1.06,
    windows: [
      { position: [4.35, 2.2, 8.5], target: [4.35, 1.6, 6.4], width: 2.8, height: 2.3, intensity: 5 },
      { position: [6.5, 2.05, 5.7], target: [4.7, 1.6, 5.7], width: 1.8, height: 2.1, intensity: 3.5 },
    ],
  },
  balcony: {
    id: "balcony",
    group: "balcony",
    index: "05",
    label: "Balcony",
    description: "Covered sit-out · garden edge",
    eye: [2.8, -9.6],
    target: [-2.6, 1.45, -10.2],
    windows: [],
    exposure: 1.12,
  },
};

export const TOUR_ORDER: TourViewId[] = ["living", "dining", "kitchen", "master", "bed2", "bed3", "balcony"];

export interface TourTab {
  group: TourGroup;
  index: string;
  label: string;
  views: TourViewId[];
}

export const TOUR_TABS: TourTab[] = [
  { group: "living", index: "01", label: "Living Room", views: ["living"] },
  { group: "dining", index: "02", label: "Dining Area", views: ["dining"] },
  { group: "kitchen", index: "03", label: "Kitchen", views: ["kitchen"] },
  { group: "bedrooms", index: "04", label: "Bedrooms", views: ["master", "bed2", "bed3"] },
  { group: "balcony", index: "05", label: "Balcony", views: ["balcony"] },
];
