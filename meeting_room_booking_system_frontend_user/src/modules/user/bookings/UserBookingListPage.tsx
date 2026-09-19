import { useCallback, useMemo, useState } from 'react';
import { Button, Popconfirm, Space, Tag, App as AntdApp } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getBookingList, unbindBooking } from '@/modules/user/api';
import { useUserStore } from '@/modules/user/store';
import type { BookingItem, BookingSearchParams } from '@/modules/admin/types';
import { ConfigFilterForm, type ConfigFilterField } from '@/shared/components/ConfigFilterForm/ConfigFilterForm';
import { ConfigTable } from '@/shared/components/ConfigTable/ConfigTable';
import { PageHeader } from '@/shared/components/PageHeader/PageHeader';
import { usePageRequest } from '@/shared/hooks/usePageRequest';
import styles from './styles/index.module.less';

import { formatDateTime } from '@/shared/utils/datetime';
import { BOOKING_STATUS_CONFIG } from '@/shared/constants/bookingStatus';
export function UserBookingListPage() {
  const { message } = AntdApp.useApp();
  const userInfo = useUserStore((state) => state.userInfo);
  const [unbindId, setUnbindId] = useState<number | null>(null);

  const initialSearch: BookingSearchParams = {
    username: userInfo?.username || '',
    meetingRoomName: '',
    meetingRoomPosition: '',
    bookingTimeRangeStart: '',
    bookingTimeRangeEnd: '',
  };

  const filterFields: ConfigFilterField<BookingSearchParams>[] = [
    {
      key: 'meetingRoomName',
      label: '会议室名称',
      placeholder: '请输入会议室名称',
    },
    {
      key: 'meetingRoomPosition',
      label: '会议室位置',
      placeholder: '请输入会议室位置',
    },
    {
      key: 'bookingTimeRangeStart',
      label: '预定时间',
      type: 'dateRange',
    },
  ];

  const pageRequest = usePageRequest<BookingItem, BookingSearchParams>(
    getBookingList,
    initialSearch,
  );

  const handleUnbind = useCallback(
    async (id: number) => {
      setUnbindId(id);
      try {
        await unbindBooking(id);
        message.success('已解除');
        void pageRequest.reload();
      } catch {
        // 错误已由请求拦截器统一处理
      } finally {
        setUnbindId(null);
      }
    },
    [message, pageRequest],
  );

  const columns = useMemo<ColumnsType<BookingItem>>(
    () => [
      {
        title: '会议室',
        dataIndex: ['room', 'name'],
        width: 140,
        render: (_, record) => record.room?.name || '-',
      },
      {
        title: '位置',
        dataIndex: ['room', 'location'],
        width: 160,
        ellipsis: true,
        render: (_, record) => record.room?.location || '-',
      },
      {
        title: '开始时间',
        dataIndex: 'startTime',
        width: 180,
        render: formatDateTime,
      },
      {
        title: '结束时间',
        dataIndex: 'endTime',
        width: 180,
        render: formatDateTime,
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 100,
        render: (status: string) => {
          const config = BOOKING_STATUS_CONFIG[status];
          return config ? <Tag color={config.color}>{config.text}</Tag> : status;
        },
      },
      {
        title: '备注',
        dataIndex: 'note',
        width: 160,
        ellipsis: true,
        render: (note: string) => note || '-',
      },
      {
        title: '创建时间',
        dataIndex: 'createTime',
        width: 180,
        render: formatDateTime,
      },
      {
        title: '操作',
        key: 'actions',
        width: 100,
        fixed: 'right',
        render: (_, record) => {
          const canUnbind = record.status === '申请中' || record.status === '审批通过';
          return canUnbind ? (
            <Popconfirm
              title="确认解除该预定？"
              okText="确认"
              cancelText="取消"
              onConfirm={() => void handleUnbind(record.id)}
            >
              <Button
                type="link"
                danger
                icon={<StopOutlined />}
                loading={unbindId === record.id}
              >
                解除
              </Button>
            </Popconfirm>
          ) : (
            <span style={{ color: '#bbb' }}>—</span>
          );
        },
      },
    ],
    [handleUnbind, unbindId],
  );

  return (
    <div className={styles.page}>
      <PageHeader
        title="预定历史"
        description="查看我的预定记录，支持按会议室名称、位置和时间范围筛选"
      />
      <ConfigFilterForm<BookingSearchParams>
        fields={filterFields}
        initialValues={initialSearch}
        loading={pageRequest.loading}
        onSearch={(values) => {
          const dateRange = (values as unknown as Record<string, unknown>).bookingTimeRangeStart as [dayjs.Dayjs, dayjs.Dayjs] | null;
          pageRequest.submitSearch({
            ...values,
            username: userInfo?.username || '',
            bookingTimeRangeStart: dateRange ? String(dateRange[0].valueOf()) : '',
            bookingTimeRangeEnd: dateRange ? String(dateRange[1].valueOf()) : '',
          });
        }}
      />
      <div className={styles.tableWrap}>
        <ConfigTable<BookingItem>
          rowKey="id"
          columns={columns}
          dataSource={pageRequest.items}
          loading={pageRequest.loading}
          pagination={{
            pageNo: pageRequest.page.pageNo,
            pageSize: pageRequest.page.pageSize,
            total: pageRequest.total,
            onChange: (pageNo, pageSize) => pageRequest.setPage({ pageNo, pageSize }),
          }}
        />
      </div>
    </div>
  );
}
