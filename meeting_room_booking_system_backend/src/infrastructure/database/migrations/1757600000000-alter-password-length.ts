import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterPasswordLength1757600000000 implements MigrationInterface {
  name = 'AlterPasswordLength1757600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\`
      MODIFY COLUMN \`password\` varchar(255) NOT NULL COMMENT '密码';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\`
      MODIFY COLUMN \`password\` varchar(50) NOT NULL COMMENT '密码';
    `);
  }
}