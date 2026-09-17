import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedFreshAccounts1757700000000 implements MigrationInterface {
  name = 'SeedFreshAccounts1757700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 先清空关联表（有外键约束）
    await queryRunner.query(`DELETE FROM \`user_roles\`;`);
    // 再清空用户表
    await queryRunner.query(`DELETE FROM \`users\`;`);

    // 插入管理员账号（密码: admin123）
    await queryRunner.query(`
      INSERT INTO \`users\` (\`username\`, \`password\`, \`nick_name\`, \`email\`, \`isFrozen\`, \`isAdmin\`, \`createTime\`, \`updateTime\`)
      VALUES (
        'admin',
        '$2b$10$aCfgmtDK9pyDxdlhVFWPc.7zP6OCtBBvLJWsW8uDtUPk8EucN5/uS',
        '系统管理员',
        'admin@meeting.com',
        0,
        1,
        NOW(),
        NOW()
      );
    `);

    // 插入普通用户账号（密码: user123）
    await queryRunner.query(`
      INSERT INTO \`users\` (\`username\`, \`password\`, \`nick_name\`, \`email\`, \`isFrozen\`, \`isAdmin\`, \`createTime\`, \`updateTime\`)
      VALUES (
        'user',
        '$2b$10$1OQN4ySVLbTVaPeNzg.tIu7hCCvZP8jP/OnfOwN/rNjcVcMxpnoMS',
        '普通用户',
        'user@meeting.com',
        0,
        0,
        NOW(),
        NOW()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM \`user_roles\`;`);
    await queryRunner.query(`DELETE FROM \`users\`;`);
  }
}
