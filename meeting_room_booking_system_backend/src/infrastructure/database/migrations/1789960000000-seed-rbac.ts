import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedRbac1789960000000 implements MigrationInterface {
  name = 'SeedRbac1789960000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 幂等：按外键依赖顺序先清关联表再清主表（不动 users）
    await queryRunner.query(`DELETE FROM \`role_permissions\`;`);
    await queryRunner.query(`DELETE FROM \`user_roles\`;`);
    await queryRunner.query(`DELETE FROM \`roles\`;`);
    await queryRunner.query(`DELETE FROM \`permissions\`;`);

    // 4 个权限码：管理类能力的最小集合，code 受 varchar(20) 限制
    await queryRunner.query(`
      INSERT INTO \`permissions\` (\`code\`, \`description\`) VALUES
        ('booking:audit', '审批/驳回预订'),
        ('room:manage', '会议室增删改'),
        ('user:manage', '用户管理与分配角色'),
        ('role:manage', '角色管理');
    `);

    // 预置角色：admin 全量权限；manager 演示普通账号被授予部分管理权限
    await queryRunner.query(`
      INSERT INTO \`roles\` (\`name\`) VALUES ('admin'), ('manager');
    `);

    await queryRunner.query(`
      INSERT INTO \`role_permissions\` (\`roleId\`, \`permissionId\`)
      SELECT r.\`id\`, p.\`id\` FROM \`roles\` r CROSS JOIN \`permissions\` p
      WHERE r.\`name\` = 'admin';
    `);

    await queryRunner.query(`
      INSERT INTO \`role_permissions\` (\`roleId\`, \`permissionId\`)
      SELECT r.\`id\`, p.\`id\` FROM \`roles\` r CROSS JOIN \`permissions\` p
      WHERE r.\`name\` = 'manager' AND p.\`code\` IN ('booking:audit', 'room:manage');
    `);

    // 给 admin 账号绑 admin 角色：isAdmin 本身走守卫的快速通道，
    // 这个绑定让登录响应里的 roles/permissions 有真实内容
    await queryRunner.query(`
      INSERT INTO \`user_roles\` (\`userId\`, \`roleId\`)
      SELECT u.\`id\`, r.\`id\` FROM \`users\` u CROSS JOIN \`roles\` r
      WHERE u.\`username\` = 'admin' AND u.\`isAdmin\` = 1 AND r.\`name\` = 'admin';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM \`role_permissions\`;`);
    await queryRunner.query(`DELETE FROM \`user_roles\`;`);
    await queryRunner.query(`DELETE FROM \`roles\`;`);
    await queryRunner.query(`DELETE FROM \`permissions\`;`);
  }
}
