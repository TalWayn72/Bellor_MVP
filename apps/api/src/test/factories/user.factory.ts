/**
 * User Test Factory
 * Mock user data creation for backend tests
 */

export interface MockUser {
  id: string;
  email: string;
  passwordHash: string | null;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  birthDate: Date;
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER';
  preferredLanguage: 'ENGLISH' | 'HEBREW' | 'SPANISH' | 'GERMAN' | 'FRENCH';
  bio: string | null;
  profileImages: string[];
  drawingUrl: string | null;
  sketchMethod: string | null;
  location: string | null;
  lookingFor: string | null;
  ageRangeMin: number;
  ageRangeMax: number;
  maxDistance: number;
  phone: string | null;
  occupation: string | null;
  education: string | null;
  interests: string[];
  showOnline: boolean;
  showDistance: boolean;
  showAge: boolean;
  privateProfile: boolean;
  doNotSell: boolean;
  notifyNewMatches: boolean;
  notifyNewMessages: boolean;
  notifyChatRequests: boolean;
  notifyDailyMissions: boolean;
  notifyEmail: boolean;
  isBlocked: boolean;
  isVerified: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date | null;
}

export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: 'test-user-id',
  email: 'test@example.com',
  passwordHash: 'hashed_password123',
  firstName: 'Test',
  lastName: 'User',
  nickname: 'testuser',
  birthDate: new Date('1990-01-01'),
  gender: 'MALE',
  preferredLanguage: 'ENGLISH',
  bio: null,
  profileImages: [],
  drawingUrl: null,
  sketchMethod: null,
  location: null,
  lookingFor: null,
  ageRangeMin: 18,
  ageRangeMax: 50,
  maxDistance: 50,
  phone: null,
  occupation: null,
  education: null,
  interests: [],
  showOnline: true,
  showDistance: true,
  showAge: true,
  privateProfile: false,
  doNotSell: false,
  notifyNewMatches: true,
  notifyNewMessages: true,
  notifyChatRequests: true,
  notifyDailyMissions: true,
  notifyEmail: true,
  isBlocked: false,
  isVerified: false,
  isPremium: false,
  isAdmin: false,
  role: 'USER',
  createdAt: new Date(),
  updatedAt: new Date(),
  lastActiveAt: new Date(),
  ...overrides,
});

/** Builder pattern for complex test user creation */
export class UserBuilder {
  private data: MockUser;

  constructor() {
    this.data = createMockUser();
  }

  withId(id: string): this { this.data.id = id; return this; }
  withEmail(email: string): this { this.data.email = email; return this; }
  withName(first: string, last: string): this {
    this.data.firstName = first;
    this.data.lastName = last;
    return this;
  }
  blocked(): this { this.data.isBlocked = true; return this; }
  verified(): this { this.data.isVerified = true; return this; }
  premium(): this { this.data.isPremium = true; return this; }
  admin(): this { this.data.role = 'ADMIN'; return this; }
  hebrew(): this { this.data.preferredLanguage = 'HEBREW'; return this; }
  build(): MockUser { return { ...this.data }; }

  static create(): UserBuilder { return new UserBuilder(); }
}
