import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueAndBookingIndexes1757800000000
  implements MigrationInterface
{
  name = 'AddUniqueAndBookingIndexes1757800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 预订冲突检查的组合索引，事务里的悲观锁（SELECT ... FOR UPDATE）按此范围加锁
    await queryRunner.query(
      'CREATE INDEX `IDX_booking_room_time` ON `booking` (`roomId`, `startTime`, `endTime`);',
    );

    // 应用层"先查后插"存在并发竞态，唯一索引做数据库层兜底
    await queryRunner.query(
      'CREATE UNIQUE INDEX `IDX_users_username_unique` ON `users` (`username`);',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX `IDX_meeting_room_name_unique` ON `meeting_room` (`name`);',
    );

    // 邮箱只加普通索引：历史数据可能存在重复邮箱，
    // 直接加唯一约束会让本次迁移在存量数据上失败
    await queryRunner.query(
      'CREATE INDEX `IDX_users_email` ON `users` (`email`);',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX `IDX_users_email` ON `users`;');
    await queryRunner.query(
      'DROP INDEX `IDX_meeting_room_name_unique` ON `meeting_room`;',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_users_username_unique` ON `users`;',
    );
    await queryRunner.query('DROP INDEX `IDX_booking_room_time` ON `booking`;');
  }
}
