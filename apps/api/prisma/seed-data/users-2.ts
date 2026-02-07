/**
 * Seed Data - User Definitions (Part 2)
 * Remaining demo users + city data
 */

import { Gender, Language } from '@prisma/client';

/** Second batch of demo users (indices 10-19 in the final array) */
export const demoUsersBatch2 = [
  {
    email: 'demo_maria@bellor.app',
    firstName: 'Demo_Maria',
    lastName: 'Garcia',
    gender: Gender.FEMALE,
    preferredLanguage: Language.SPANISH,
    bio: 'Life lover! Loves dancing, traveling and meeting new people.',
    birthDate: new Date('1994-09-28'),
    lookingFor: [Gender.MALE, Gender.FEMALE],
    profileImages: ['https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400'],
  },
  {
    email: 'demo_carlos@bellor.app',
    firstName: 'Demo_Carlos',
    lastName: 'Rodriguez',
    gender: Gender.MALE,
    preferredLanguage: Language.SPANISH,
    bio: 'Professional photographer. Always searching for the perfect light and new adventures.',
    birthDate: new Date('1991-12-03'),
    lookingFor: [Gender.FEMALE],
    profileImages: ['https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400'],
  },
  {
    email: 'demo_anna@bellor.app',
    firstName: 'Demo_Anna',
    lastName: 'Schmidt',
    gender: Gender.FEMALE,
    preferredLanguage: Language.GERMAN,
    bio: 'Teacher and yoga instructor. Love nature, meditation and good conversations.',
    birthDate: new Date('1993-04-17'),
    lookingFor: [Gender.MALE],
    profileImages: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400'],
  },
  {
    email: 'demo_thomas@bellor.app',
    firstName: 'Demo_Thomas',
    lastName: 'Mueller',
    gender: Gender.MALE,
    preferredLanguage: Language.GERMAN,
    bio: 'Architect with passion for design and art. Love to travel!',
    birthDate: new Date('1989-08-25'),
    lookingFor: [Gender.FEMALE],
    profileImages: ['https://images.unsplash.com/photo-1463453091185-61582044d556?w=400'],
  },
  {
    email: 'demo_sophie@bellor.app',
    firstName: 'Demo_Sophie',
    lastName: 'Dubois',
    gender: Gender.FEMALE,
    preferredLanguage: Language.FRENCH,
    bio: 'Passionate about cooking and literature. Love long walks.',
    birthDate: new Date('1997-02-14'),
    lookingFor: [Gender.MALE],
    profileImages: ['https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400'],
  },
  {
    email: 'demo_pierre@bellor.app',
    firstName: 'Demo_Pierre',
    lastName: 'Martin',
    gender: Gender.MALE,
    preferredLanguage: Language.FRENCH,
    bio: 'Chef and wine enthusiast. Always searching for new flavors!',
    birthDate: new Date('1988-10-30'),
    lookingFor: [Gender.FEMALE],
    profileImages: ['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'],
  },
  {
    email: 'demo_noa@bellor.app',
    firstName: 'Demo_Noa',
    lastName: 'Avraham',
    gender: Gender.FEMALE,
    preferredLanguage: Language.HEBREW,
    bio: 'Psychology student, loves good coffee and deep conversations.',
    birthDate: new Date('2000-01-20'),
    lookingFor: [Gender.MALE],
    profileImages: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400'],
  },
  {
    email: 'demo_omer@bellor.app',
    firstName: 'Demo_Omer',
    lastName: 'Ben-David',
    gender: Gender.MALE,
    preferredLanguage: Language.HEBREW,
    bio: 'Musician and creator. Plays guitar and piano. Loves cooking and experimenting.',
    birthDate: new Date('1997-07-04'),
    lookingFor: [Gender.FEMALE],
    profileImages: ['https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400'],
  },
];

/** City data for assigning locations to users */
export const cities = [
  { city: 'Tel Aviv', country: 'Israel', lat: 32.0853, lng: 34.7818 },
  { city: 'Jerusalem', country: 'Israel', lat: 31.7683, lng: 35.2137 },
  { city: 'Haifa', country: 'Israel', lat: 32.7940, lng: 34.9896 },
  { city: 'Beer Sheva', country: 'Israel', lat: 31.2518, lng: 34.7913 },
  { city: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060 },
  { city: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
  { city: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
  { city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  { city: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038 },
  { city: 'Barcelona', country: 'Spain', lat: 41.3874, lng: 2.1686 },
];
