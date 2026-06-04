// Curated amenity suggestions powering the combobox. Owners can also add
// their own custom amenities, which are stored alongside these.

export const HOME_AMENITY_PRESETS: string[] = [
  'WiFi',
  'Free parking',
  'Air conditioning',
  'Heating',
  'Washer',
  'Dryer',
  'Full kitchen',
  'Coffee maker',
  'Dishwasher',
  'Pool',
  'Hot tub',
  'Grill / BBQ',
  'Outdoor dining',
  'Fireplace',
  'TV',
  'Workspace',
  'EV charger',
  'Pet friendly',
  'Beach access',
  'Lake access',
];

export const ROOM_AMENITY_PRESETS: string[] = [
  'Ensuite bathroom',
  'Shared bathroom',
  'Towels provided',
  'Sheets provided',
  'Hair dryer',
  'Closet',
  'Dresser',
  'Blackout curtains',
  'Air conditioning',
  'Ceiling fan',
  'TV',
  'Desk',
  'Iron',
  'Extra blankets',
  'Crib available',
];

export function amenityKey(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
