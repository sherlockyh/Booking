import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBooking1757520000000 implements MigrationInterface {
  name = 'AddBooking1757520000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`booking\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`startTime\` datetime NOT NULL COMMENT '会议开始时间',
        \`endTime\` datetime NOT NULL COMMENT '会议结束时间',
        \`status\` varchar(20) NOT NULL DEFAULT '申请中' COMMENT '状态（申请中、审批通过、审批驳回、已解除）',
        \`note\` varchar(100) NOT NULL DEFAULT '' COMMENT '备注',
        \`userId\` int NULL,
        \`roomId\` int NULL,
        \`createTime\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
        \`updateTime\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
        PRIMARY KEY (\`id\`),
        INDEX \`FK_userId\` (\`userId\`),
        INDEX \`FK_roomId\` (\`roomId\`),
        CONSTRAINT \`FK_booking_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_booking_roomId\` FOREIGN KEY (\`roomId\`) REFERENCES \`meeting_room\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`booking\`;`);
  }
}
