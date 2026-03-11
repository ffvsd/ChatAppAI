import { DataSource } from 'typeorm';
import ormConfig from './ormconfig';

// Khi chạy migration trên dist, cần require file build
export const AppDataSource = new DataSource({
  ...ormConfig,
});
