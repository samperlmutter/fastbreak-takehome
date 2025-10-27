/**
 * Sport types available for events
 * Single source of truth for sport type dropdowns across the application
 */
export const SPORT_TYPES = [
  'Robotics',
  'Soccer',
  'Basketball',
  'Tennis',
  'Baseball',
  'Football',
  'Volleyball',
  'Hockey',
  'Cricket',
  'Rugby',
  'Swimming',
] as const

export type SportType = (typeof SPORT_TYPES)[number]
