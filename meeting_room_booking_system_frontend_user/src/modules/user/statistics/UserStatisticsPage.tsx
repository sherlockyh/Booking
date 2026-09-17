import { useCallback } from 'react';
import { getUserBookingCount, getMeetingRoomUsedCount } from '@/modules/user/api';
import { StatisticsPage } from '@/shared/components/StatisticsPage/StatisticsPage';

export function UserStatisticsPage() {
  const fetchUserBookingCount = useCallback(
    (params: { startTime: string; endTime: string }) => getUserBookingCount(params),
    [],
  );
  const fetchMeetingRoomUsedCount = useCallback(
    (params: { startTime: string; endTime: string }) => getMeetingRoomUsedCount(params),
    [],
  );

  return (
    <StatisticsPage
      title="数据统计"
      description="查看用户预定统计和会议室使用统计，支持按时间范围筛选"
      fetchUserBookingCount={fetchUserBookingCount}
      fetchMeetingRoomUsedCount={fetchMeetingRoomUsedCount}
    />
  );
}
