import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropMeetingRoomIsBooked1789950000000
  implements MigrationInterface
{
  name = 'DropMeetingRoomIsBooked1789950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // isBooked 落库后从未被更新过，展示的永远是 false；
    // 占用状态改为查询时按当前时刻的有效预订实时计算，删掉这列死数据
    await queryRunner.query(
      'ALTER TABLE `meeting_room` DROP COLUMN `isBooked`;',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `meeting_room` ADD `isBooked` tinyint NOT NULL DEFAULT 0 COMMENT '是否被预订';",
    );
  }
}
