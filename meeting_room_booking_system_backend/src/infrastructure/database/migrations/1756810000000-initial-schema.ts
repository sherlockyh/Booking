import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1756810000000 implements MigrationInterface {
  name = 'InitialSchema1756810000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`username\` varchar(50) NOT NULL,
        \`password\` varchar(50) NOT NULL,
        \`nick_name\` varchar(50) NOT NULL,
        \`email\` varchar(50) NOT NULL,
        \`headPic\` varchar(100) NULL,
        \`phoneNumber\` varchar(20) NULL,
        \`isFrozen\` tinyint NOT NULL DEFAULT 0,
        \`isAdmin\` tinyint NOT NULL DEFAULT 0,
        \`createTime\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updateTime\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`roles\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(20) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`permissions\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`code\` varchar(20) NOT NULL,
        \`description\` varchar(100) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`user_roles\` (
        \`userId\` int NOT NULL,
        \`roleId\` int NOT NULL,
        PRIMARY KEY (\`userId\`, \`roleId\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`role_permissions\` (
        \`roleId\` int NOT NULL,
        \`permissionId\` int NOT NULL,
        PRIMARY KEY (\`roleId\`, \`permissionId\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await this.renameColumnIfNeeded(
      queryRunner,
      'user_roles',
      'usersId',
      'userId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'user_roles',
      'rolesId',
      'roleId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'role_permissions',
      'rolesId',
      'roleId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'role_permissions',
      'permissionsId',
      'permissionId',
    );

    await this.addForeignKeyIfMissing(
      queryRunner,
      'user_roles',
      'FK_user_roles_userId',
      'userId',
      'users',
      'id',
    );
    await this.addForeignKeyIfMissing(
      queryRunner,
      'user_roles',
      'FK_user_roles_roleId',
      'roleId',
      'roles',
      'id',
    );
    await this.addForeignKeyIfMissing(
      queryRunner,
      'role_permissions',
      'FK_role_permissions_roleId',
      'roleId',
      'roles',
      'id',
    );
    await this.addForeignKeyIfMissing(
      queryRunner,
      'role_permissions',
      'FK_role_permissions_permissionId',
      'permissionId',
      'permissions',
      'id',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`role_permissions\`;`);
    await queryRunner.query(`DROP TABLE IF EXISTS \`user_roles\`;`);
    await queryRunner.query(`DROP TABLE IF EXISTS \`permissions\`;`);
    await queryRunner.query(`DROP TABLE IF EXISTS \`roles\`;`);
    await queryRunner.query(`DROP TABLE IF EXISTS \`users\`;`);
  }

  private async addForeignKeyIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    constraintName: string,
    columnName: string,
    referencedTableName: string,
    referencedColumnName: string,
  ) {
    const rows = (await queryRunner.query(
      `
        SELECT COUNT(1) AS count
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND CONSTRAINT_NAME = ?
      `,
      [tableName, constraintName],
    )) as Array<{ count: number | string }>;

    const exists = Number(rows[0]?.count ?? 0) > 0;
    if (exists) {
      return;
    }

    await queryRunner.query(
      `
        ALTER TABLE \`${tableName}\`
        ADD CONSTRAINT \`${constraintName}\`
        FOREIGN KEY (\`${columnName}\`) REFERENCES \`${referencedTableName}\`(\`${referencedColumnName}\`)
        ON DELETE CASCADE ON UPDATE CASCADE;
      `,
    );
  }

  private async renameColumnIfNeeded(
    queryRunner: QueryRunner,
    tableName: string,
    oldColumnName: string,
    newColumnName: string,
  ) {
    const rows = (await queryRunner.query(
      `
        SELECT
          SUM(COLUMN_NAME = ?) AS oldColumnCount,
          SUM(COLUMN_NAME = ?) AS newColumnCount
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
      `,
      [oldColumnName, newColumnName, tableName],
    )) as Array<{
      oldColumnCount: number | string | null;
      newColumnCount: number | string | null;
    }>;

    const oldColumnExists = Number(rows[0]?.oldColumnCount ?? 0) > 0;
    const newColumnExists = Number(rows[0]?.newColumnCount ?? 0) > 0;
    if (!oldColumnExists || newColumnExists) {
      return;
    }

    await queryRunner.query(
      `
        ALTER TABLE \`${tableName}\`
        CHANGE \`${oldColumnName}\` \`${newColumnName}\` int NOT NULL;
      `,
    );
  }
}
