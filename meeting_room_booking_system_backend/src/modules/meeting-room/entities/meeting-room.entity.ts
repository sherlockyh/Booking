import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({
  name: 'meeting_room',
})
export class MeetingRoom {
  @PrimaryGeneratedColumn({
    comment: '会议室ID',
  })
  id: number;

  @Column({
    length: 50,
    comment: '会议室名字',
  })
  name: string;

  @Column({
    comment: '会议室容量',
  })
  capacity: number;

  @Column({
    length: 50,
    comment: '会议室位置',
  })
  location: string;

  @Column({
    length: 50,
    comment: '设备',
    default: '',
  })
  equipment: string;

  @Column({
    length: 100,
    comment: '描述',
    default: '',
  })
  description: string;

  // isBooked 不落库：会议室是否占用取决于当前时刻有无
  // 申请中/审批通过且覆盖现在的预订，由查询时实时计算

  @CreateDateColumn({
    comment: '创建时间',
  })
  createTime: Date;

  @UpdateDateColumn({
    comment: '更新时间',
  })
  updateTime: Date;
}
