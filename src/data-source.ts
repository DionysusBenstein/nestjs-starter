/*
  Migration classes are separate from the Nest application source code. Their lifecycle is maintained by the TypeORM CLI.
  Therefore, you are not able to leverage dependency injection and other Nest specific features with migrations.
 */
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  entities: ['src/**/entities/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: [],
});
