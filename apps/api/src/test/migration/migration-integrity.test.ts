/**
 * Bellor MVP - Migration Integrity Tests
 * Tests that validate migration application and schema correctness
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from 'pg';
import {
  createTestDatabase,
  dropTestDatabase,
  createClient,
  runMigrations,
  getTables,
  getTableColumns,
  getIndexes,
  getConstraints,
  tableExists,
  columnExists,
  indexExists,
  getMigrationStatus,
  getEnums,
  getEnumValues,
  getForeignKeys
} from './migration-helpers.js';

describe('Migration Integrity Tests', () => {
  let dbName: string;
  let client: Client;

  beforeAll(async () => {
    dbName = await createTestDatabase('bellor_test_migrations');
    client = createClient({
      host: 'localhost',
      port: 5432,
      database: dbName,
      user: 'bellor',
      password: 'bellor_dev'
    });
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
    await dropTestDatabase(dbName);
  });

  describe('Migration Application', () => {
    it('should apply all migrations successfully to fresh database', async () => {
      const output = await runMigrations(dbName);
      expect(output).toBeDefined();

      const tables = await getTables(client);
      expect(tables.length).toBeGreaterThan(10);
    });

    it('should create _prisma_migrations tracking table', async () => {
      const exists = await tableExists(client, '_prisma_migrations');
      expect(exists).toBe(true);
    });

    it('should record all applied migrations', async () => {
      const migrations = await getMigrationStatus(client);
      expect(migrations.length).toBeGreaterThan(0);

      migrations.forEach(migration => {
        expect(migration.migration_name).toBeDefined();
        expect(migration.finished_at).toBeDefined();
        expect(migration.applied_steps_count).toBeGreaterThan(0);
      });
    });
  });

  describe('Core Tables', () => {
    it('should create User table with all required columns', async () => {
      const exists = await tableExists(client, 'User');
      expect(exists).toBe(true);

      const columns = await getTableColumns(client, 'User');
      const columnNames = columns.map(col => col.column_name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('email');
      expect(columnNames).toContain('passwordHash');
      expect(columnNames).toContain('firstName');
      expect(columnNames).toContain('lastName');
      expect(columnNames).toContain('gender');
      expect(columnNames).toContain('birthDate');
      expect(columnNames).toContain('location');
      expect(columnNames).toContain('createdAt');
      expect(columnNames).toContain('updatedAt');
    });

    it('should create Chat table with proper structure', async () => {
      const exists = await tableExists(client, 'Chat');
      expect(exists).toBe(true);

      const columns = await getTableColumns(client, 'Chat');
      const columnNames = columns.map(col => col.column_name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('user1Id');
      expect(columnNames).toContain('user2Id');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('isTemporary');
      expect(columnNames).toContain('isPermanent');
      expect(columnNames).toContain('expiresAt');
    });

    it('should create Message table with cascade delete', async () => {
      const exists = await tableExists(client, 'Message');
      expect(exists).toBe(true);

      const fks = await getForeignKeys(client);
      const messageFks = fks.filter(fk => fk.table_name === 'Message');

      const chatFk = messageFks.find(fk => fk.foreign_table_name === 'Chat');
      expect(chatFk).toBeDefined();
      expect(chatFk?.delete_rule).toBe('CASCADE');
    });

    it('should create Response table', async () => {
      const exists = await tableExists(client, 'Response');
      expect(exists).toBe(true);

      expect(await columnExists(client, 'Response', 'userId')).toBe(true);
      expect(await columnExists(client, 'Response', 'missionId')).toBe(true);
      expect(await columnExists(client, 'Response', 'responseType')).toBe(true);
      expect(await columnExists(client, 'Response', 'content')).toBe(true);
    });

    it('should create Mission table', async () => {
      const exists = await tableExists(client, 'Mission');
      expect(exists).toBe(true);

      expect(await columnExists(client, 'Mission', 'title')).toBe(true);
      expect(await columnExists(client, 'Mission', 'description')).toBe(true);
      expect(await columnExists(client, 'Mission', 'missionType')).toBe(true);
    });

    it('should create Story table with expiry', async () => {
      const exists = await tableExists(client, 'Story');
      expect(exists).toBe(true);

      expect(await columnExists(client, 'Story', 'expiresAt')).toBe(true);
      expect(await columnExists(client, 'Story', 'mediaType')).toBe(true);
      expect(await columnExists(client, 'Story', 'mediaUrl')).toBe(true);
    });

    it('should create Achievement and UserAchievement tables', async () => {
      expect(await tableExists(client, 'Achievement')).toBe(true);
      expect(await tableExists(client, 'UserAchievement')).toBe(true);

      expect(await columnExists(client, 'UserAchievement', 'userId')).toBe(true);
      expect(await columnExists(client, 'UserAchievement', 'achievementId')).toBe(true);
    });

    it('should create Report table with status tracking', async () => {
      const exists = await tableExists(client, 'Report');
      expect(exists).toBe(true);

      expect(await columnExists(client, 'Report', 'reporterId')).toBe(true);
      expect(await columnExists(client, 'Report', 'reportedUserId')).toBe(true);
      expect(await columnExists(client, 'Report', 'reason')).toBe(true);
      expect(await columnExists(client, 'Report', 'status')).toBe(true);
    });

    it('should create Like and Follow tables', async () => {
      expect(await tableExists(client, 'Like')).toBe(true);
      expect(await tableExists(client, 'Follow')).toBe(true);
    });

    it('should create Notification table', async () => {
      const exists = await tableExists(client, 'Notification');
      expect(exists).toBe(true);

      expect(await columnExists(client, 'Notification', 'type')).toBe(true);
      expect(await columnExists(client, 'Notification', 'isRead')).toBe(true);
    });

    it('should create subscription-related tables', async () => {
      expect(await tableExists(client, 'SubscriptionPlan')).toBe(true);
      expect(await tableExists(client, 'Subscription')).toBe(true);
      expect(await tableExists(client, 'Payment')).toBe(true);
    });

    it('should create Feedback table', async () => {
      const exists = await tableExists(client, 'Feedback');
      expect(exists).toBe(true);

      expect(await columnExists(client, 'Feedback', 'type')).toBe(true);
      expect(await columnExists(client, 'Feedback', 'rating')).toBe(true);
    });

    it('should create DeviceToken table', async () => {
      const exists = await tableExists(client, 'DeviceToken');
      expect(exists).toBe(true);

      expect(await columnExists(client, 'DeviceToken', 'token')).toBe(true);
      expect(await columnExists(client, 'DeviceToken', 'platform')).toBe(true);
    });

    it('should create Referral table', async () => {
      const exists = await tableExists(client, 'Referral');
      expect(exists).toBe(true);

      expect(await columnExists(client, 'Referral', 'referrerUserId')).toBe(true);
      expect(await columnExists(client, 'Referral', 'status')).toBe(true);
    });

    it('should create AppSetting table', async () => {
      const exists = await tableExists(client, 'AppSetting');
      expect(exists).toBe(true);

      expect(await columnExists(client, 'AppSetting', 'key')).toBe(true);
      expect(await columnExists(client, 'AppSetting', 'value')).toBe(true);
    });
  });

  describe('Enums', () => {
    it('should create all required enum types', async () => {
      const enums = await getEnums(client);

      expect(enums).toContain('Gender');
      expect(enums).toContain('Language');
      expect(enums).toContain('ChatStatus');
      expect(enums).toContain('MessageType');
      expect(enums).toContain('ResponseType');
      expect(enums).toContain('MissionType');
      expect(enums).toContain('MediaType');
      expect(enums).toContain('ContentType');
      expect(enums).toContain('ReportReason');
      expect(enums).toContain('ReportStatus');
      expect(enums).toContain('LikeType');
      expect(enums).toContain('NotificationType');
      expect(enums).toContain('SubscriptionStatus');
      expect(enums).toContain('BillingCycle');
      expect(enums).toContain('PaymentStatus');
      expect(enums).toContain('ReferralStatus');
      expect(enums).toContain('Platform');
    });

    it('should have correct Gender enum values', async () => {
      const values = await getEnumValues(client, 'Gender');
      expect(values).toContain('MALE');
      expect(values).toContain('FEMALE');
      expect(values).toContain('NON_BINARY');
      expect(values).toContain('OTHER');
    });

    it('should have correct ChatStatus enum values', async () => {
      const values = await getEnumValues(client, 'ChatStatus');
      expect(values).toContain('ACTIVE');
      expect(values).toContain('EXPIRED');
      expect(values).toContain('BLOCKED');
      expect(values).toContain('DELETED');
    });

    it('should have correct MessageType enum values', async () => {
      const values = await getEnumValues(client, 'MessageType');
      expect(values).toContain('TEXT');
      expect(values).toContain('VOICE');
      expect(values).toContain('IMAGE');
      expect(values).toContain('VIDEO');
      expect(values).toContain('DRAWING');
    });
  });

  describe('Indexes', () => {
    it('should create indexes on User table', async () => {
      expect(await indexExists(client, 'User_email_key')).toBe(true);
      expect(await indexExists(client, 'User_email_idx')).toBe(true);
      expect(await indexExists(client, 'User_lastActiveAt_idx')).toBe(true);
      expect(await indexExists(client, 'User_createdAt_idx')).toBe(true);
    });

    it('should create indexes on Chat table', async () => {
      expect(await indexExists(client, 'Chat_user1Id_idx')).toBe(true);
      expect(await indexExists(client, 'Chat_user2Id_idx')).toBe(true);
      expect(await indexExists(client, 'Chat_status_idx')).toBe(true);
    });

    it('should create indexes on Message table', async () => {
      expect(await indexExists(client, 'Message_chatId_idx')).toBe(true);
      expect(await indexExists(client, 'Message_senderId_idx')).toBe(true);
      expect(await indexExists(client, 'Message_createdAt_idx')).toBe(true);
    });

    it('should create composite index on Message', async () => {
      expect(await indexExists(client, 'Message_chatId_createdAt_idx')).toBe(true);
    });

    it('should have all expected indexes', async () => {
      const indexes = await getIndexes(client);
      expect(indexes.length).toBeGreaterThan(30);
    });
  });

  describe('Constraints', () => {
    it('should have primary key constraints on all tables', async () => {
      const constraints = await getConstraints(client);
      const pkConstraints = constraints.filter(c => c.constraint_type === 'PRIMARY KEY');

      expect(pkConstraints.length).toBeGreaterThan(15);
    });

    it('should have unique constraints where needed', async () => {
      // Prisma creates unique indexes rather than constraints in modern versions
      // Verify specific unique indexes exist
      expect(await indexExists(client, 'User_email_key')).toBe(true);
      expect(await indexExists(client, 'Chat_user1Id_user2Id_key')).toBe(true);

      // Verify the indexes enforce uniqueness
      const indexes = await getIndexes(client);
      const uniqueIndexes = indexes.filter(idx =>
        idx.indexdef && idx.indexdef.includes('UNIQUE')
      );
      expect(uniqueIndexes.length).toBeGreaterThan(5);
    });

    it('should have foreign key constraints', async () => {
      const fks = await getForeignKeys(client);
      expect(fks.length).toBeGreaterThan(10);

      const tableNames = fks.map(fk => fk.table_name);
      expect(tableNames).toContain('Chat');
      expect(tableNames).toContain('Message');
      expect(tableNames).toContain('Response');
      expect(tableNames).toContain('UserAchievement');
    });
  });

  describe('Foreign Key Relationships', () => {
    it('should have correct Chat foreign keys', async () => {
      const fks = await getForeignKeys(client);
      const chatFks = fks.filter(fk => fk.table_name === 'Chat');

      expect(chatFks.length).toBeGreaterThanOrEqual(2);
      expect(chatFks.some(fk => fk.column_name === 'user1Id')).toBe(true);
      expect(chatFks.some(fk => fk.column_name === 'user2Id')).toBe(true);
    });

    it('should have correct Message foreign keys', async () => {
      const fks = await getForeignKeys(client);
      const messageFks = fks.filter(fk => fk.table_name === 'Message');

      expect(messageFks.some(fk => fk.column_name === 'chatId')).toBe(true);
      expect(messageFks.some(fk => fk.column_name === 'senderId')).toBe(true);
    });

    it('should have correct Response foreign keys', async () => {
      const fks = await getForeignKeys(client);
      const responseFks = fks.filter(fk => fk.table_name === 'Response');

      expect(responseFks.some(fk => fk.column_name === 'userId')).toBe(true);
      expect(responseFks.some(fk => fk.column_name === 'missionId')).toBe(true);
    });

    it('should have correct UserAchievement foreign keys', async () => {
      const fks = await getForeignKeys(client);
      const uaFks = fks.filter(fk => fk.table_name === 'UserAchievement');

      expect(uaFks.some(fk => fk.column_name === 'userId')).toBe(true);
      expect(uaFks.some(fk => fk.column_name === 'achievementId')).toBe(true);
    });
  });

  describe('Data Types', () => {
    it('should use correct data types for User fields', async () => {
      const columns = await getTableColumns(client, 'User');

      const emailCol = columns.find(c => c.column_name === 'email');
      expect(emailCol?.data_type).toMatch(/character varying|text/);

      const birthDateCol = columns.find(c => c.column_name === 'birthDate');
      expect(birthDateCol?.data_type).toBe('timestamp without time zone');

      const locationCol = columns.find(c => c.column_name === 'location');
      expect(locationCol?.data_type).toBe('jsonb');

      const profileImagesCol = columns.find(c => c.column_name === 'profileImages');
      expect(profileImagesCol?.data_type).toBe('ARRAY');
    });

    it('should use timestamp for datetime fields', async () => {
      const tables = ['User', 'Chat', 'Message', 'Response'];

      for (const tableName of tables) {
        const columns = await getTableColumns(client, tableName);
        const createdAt = columns.find(c => c.column_name === 'createdAt');
        expect(createdAt?.data_type).toBe('timestamp without time zone');
      }
    });

    it('should use boolean for flag fields', async () => {
      const columns = await getTableColumns(client, 'User');

      const boolFields = ['isVerified', 'isBlocked', 'isPremium', 'isAdmin'];
      for (const field of boolFields) {
        const col = columns.find(c => c.column_name === field);
        expect(col?.data_type).toBe('boolean');
      }
    });
  });
});
