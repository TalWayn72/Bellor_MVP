/**
 * Bellor MVP - Migration Test Helpers
 * Utilities for testing database migrations
 */
import { execSync } from 'child_process';
import { Client } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface TableInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
}

export interface IndexInfo {
  indexname: string;
  tablename: string;
  indexdef: string;
}

export interface ConstraintInfo {
  constraint_name: string;
  table_name: string;
  constraint_type: string;
}

/**
 * Creates a test database with a unique name
 */
export async function createTestDatabase(baseName: string): Promise<string> {
  const timestamp = Date.now();
  const dbName = `${baseName}_${timestamp}`;

  try {
    execSync(`docker exec bellor_postgres createdb -U bellor ${dbName}`, {
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    return dbName;
  } catch (error) {
    throw new Error(`Failed to create test database: ${error}`);
  }
}

/**
 * Drops a test database
 */
export async function dropTestDatabase(dbName: string): Promise<void> {
  try {
    execSync(`docker exec bellor_postgres dropdb -U bellor ${dbName}`, {
      stdio: 'pipe',
      encoding: 'utf-8'
    });
  } catch (error) {
    console.error(`Failed to drop test database ${dbName}:`, error);
  }
}

/**
 * Creates a PostgreSQL client for the test database
 */
export function createClient(config: DatabaseConfig): Client {
  return new Client({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password
  });
}

/**
 * Gets the database URL for a specific database
 */
export function getDatabaseUrl(dbName: string): string {
  return `postgresql://bellor:bellor_dev@localhost:5432/${dbName}`;
}

/**
 * Runs Prisma migrate deploy on a database
 */
export async function runMigrations(dbName: string): Promise<string> {
  try {
    const output = execSync('npx prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: getDatabaseUrl(dbName)
      },
      cwd: path.join(__dirname, '..', '..', '..'),
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    return output;
  } catch (error: unknown) {
    const execError = error as { message: string; stdout?: string; stderr?: string };
    throw new Error(`Migration failed: ${execError.message}\n${execError.stdout || ''}\n${execError.stderr || ''}`);
  }
}

/**
 * Runs Prisma db reset (drops and recreates schema)
 */
export async function resetDatabase(dbName: string): Promise<void> {
  try {
    execSync('npx prisma migrate reset --force --skip-seed', {
      env: {
        ...process.env,
        DATABASE_URL: getDatabaseUrl(dbName)
      },
      cwd: path.join(__dirname, '..', '..', '..'),
      encoding: 'utf-8',
      stdio: 'pipe'
    });
  } catch (error: unknown) {
    const execError = error as { message: string };
    throw new Error(`Reset failed: ${execError.message}`);
  }
}

/**
 * Runs seed script on a database
 */
export async function runSeed(dbName: string): Promise<string> {
  try {
    const output = execSync('npx prisma db seed', {
      env: {
        ...process.env,
        DATABASE_URL: getDatabaseUrl(dbName)
      },
      cwd: path.join(__dirname, '..', '..', '..'),
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    return output;
  } catch (error: unknown) {
    const execError = error as { message: string; stdout?: string; stderr?: string };
    throw new Error(`Seed failed: ${execError.message}\n${execError.stdout || ''}\n${execError.stderr || ''}`);
  }
}

/**
 * Gets all tables in the database
 */
export async function getTables(client: Client): Promise<string[]> {
  const result = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  return result.rows.map(row => row.table_name);
}

/**
 * Gets all columns for a specific table
 */
export async function getTableColumns(client: Client, tableName: string): Promise<TableInfo[]> {
  const result = await client.query<TableInfo>(`
    SELECT
      table_name,
      column_name,
      data_type,
      is_nullable
    FROM information_schema.columns
    WHERE table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);
  return result.rows;
}

/**
 * Gets all indexes in the database
 */
export async function getIndexes(client: Client): Promise<IndexInfo[]> {
  const result = await client.query<IndexInfo>(`
    SELECT
      indexname,
      tablename,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `);
  return result.rows;
}

/**
 * Gets all constraints in the database
 */
export async function getConstraints(client: Client): Promise<ConstraintInfo[]> {
  const result = await client.query<ConstraintInfo>(`
    SELECT
      constraint_name,
      table_name,
      constraint_type
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
    ORDER BY table_name, constraint_name
  `);
  return result.rows;
}

/**
 * Gets the count of rows in a table
 */
export async function getTableRowCount(client: Client, tableName: string): Promise<number> {
  const result = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
  return parseInt(result.rows[0].count, 10);
}

/**
 * Checks if a table exists
 */
export async function tableExists(client: Client, tableName: string): Promise<boolean> {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = $1
    )
  `, [tableName]);
  return result.rows[0].exists;
}

/**
 * Checks if a column exists in a table
 */
export async function columnExists(
  client: Client,
  tableName: string,
  columnName: string
): Promise<boolean> {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = $1
      AND column_name = $2
    )
  `, [tableName, columnName]);
  return result.rows[0].exists;
}

/**
 * Checks if an index exists
 */
export async function indexExists(client: Client, indexName: string): Promise<boolean> {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname = $1
    )
  `, [indexName]);
  return result.rows[0].exists;
}

/**
 * Gets the current migration status from _prisma_migrations table
 */
export interface MigrationRecord {
  migration_name: string;
  finished_at: string | null;
  applied_steps_count: number;
  logs: string | null;
}

export async function getMigrationStatus(client: Client): Promise<MigrationRecord[]> {
  try {
    const result = await client.query<MigrationRecord>(`
      SELECT
        migration_name,
        finished_at,
        applied_steps_count,
        logs
      FROM _prisma_migrations
      ORDER BY started_at
    `);
    return result.rows;
  } catch {
    return [];
  }
}

/**
 * Verifies that all expected enums exist
 */
export async function getEnums(client: Client): Promise<string[]> {
  const result = await client.query(`
    SELECT typname
    FROM pg_type
    WHERE typtype = 'e'
    ORDER BY typname
  `);
  return result.rows.map(row => row.typname);
}

/**
 * Gets enum values for a specific enum type
 */
export async function getEnumValues(client: Client, enumName: string): Promise<string[]> {
  const result = await client.query(`
    SELECT enumlabel
    FROM pg_enum
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
    WHERE typname = $1
    ORDER BY enumsortorder
  `, [enumName]);
  return result.rows.map(row => row.enumlabel);
}

/**
 * Gets all foreign keys in the database
 */
export interface ForeignKeyInfo {
  table_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
  update_rule: string;
  delete_rule: string;
}

export async function getForeignKeys(client: Client): Promise<ForeignKeyInfo[]> {
  const result = await client.query<ForeignKeyInfo>(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.update_rule,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    ORDER BY tc.table_name
  `);
  return result.rows;
}

/**
 * Checks if the Docker PostgreSQL database is reachable.
 * Returns true if connection succeeds, false otherwise.
 * Used by test files to gracefully skip when no DB is available.
 */
export async function canConnectToDatabase(): Promise<boolean> {
  try {
    execSync('docker exec bellor_postgres pg_isready -U bellor', {
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 5000
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Waits for a specified amount of time
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
