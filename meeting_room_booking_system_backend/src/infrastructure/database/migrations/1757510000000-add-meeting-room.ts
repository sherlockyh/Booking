import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMeetingRoom1757510000000 implements MigrationInterface {
  name = 'AddMeetingRoom1757510000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`meeting_room\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(50) NOT NULL COMMENT '会议室名字',
        \`capacity\` int NOT NULL COMMENT '会议室容量',
        \`location\` varchar(50) NOT NULL COMMENT '会议室位置',
        \`equipment\` varchar(50) NOT NULL DEFAULT '' COMMENT '设备',
        \`description\` varchar(100) NOT NULL DEFAULT '' COMMENT '描述',
        \`isBooked\` tinyint NOT NULL DEFAULT 0 COMMENT '是否被预订',
        \`createTime\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
        \`updateTime\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`meeting_room\`;`);
  }
}
