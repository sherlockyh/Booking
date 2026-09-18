import { Logger as TypeOrmLogger } from 'typeorm';
import { Logger as WinstonLogger } from 'winston';

// SQL 查询参数序列化，便于在文件日志（JSON）里回查执行的语句
const formatParameters = (parameters?: any[]) =>
  parameters?.length ? JSON.stringify(parameters) : '';

/**
 * TypeORM 日志适配器：把 SQL / 迁移 / schema 日志转发给 winston。
 * 传入 options.logger 后会替换默认控制台输出（不会双写），
 * logging 选项保留 true 作为总开关。
 */
export class TypeOrmWinstonLogger implements TypeOrmLogger {
  constructor(private readonly winston: WinstonLogger) {}

  logQuery(query: string, parameters?: any[]) {
    this.winston.http(query, {
      context: 'TypeORM',
      parameters: formatParameters(parameters),
    });
  }

  logQueryError(error: string, query: string, parameters?: any[]) {
    this.winston.error(`${query} — ${error}`, {
      context: 'TypeORM',
      parameters: formatParameters(parameters),
    });
  }

  logQuerySlow(time: number, query: string) {
    this.winston.warn(`${query} — 耗时 ${time}ms`, { context: 'TypeORM' });
  }

  logSchemaBuild(message: string) {
    this.winston.verbose(message, { context: 'TypeORM' });
  }

  logMigration(message: string) {
    this.winston.info(message, { context: 'TypeORM' });
  }

  log(level: 'log' | 'info' | 'warn', message: any) {
    if (level === 'warn') {
      this.winston.warn(message, { context: 'TypeORM' });
    } else {
      this.winston.info(message, { context: 'TypeORM' });
    }
  }
}
