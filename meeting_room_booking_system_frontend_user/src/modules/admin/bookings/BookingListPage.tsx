import { useCallback, useMemo, useState } from 'react';
import { Button, Popconfirm, Space, Tag, App as AntdApp } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckOutlined, CloseOutlined, StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  applyBooking,
  getBookingList,
  rejectBooking,
  unbindBooking,
} from '@/modules/admin/api';
import type { BookingItem, BookingSearchParams } from '@/modules/admin/types';
import { ConfigFilterForm, type ConfigFilterField } from '@/shared/components/ConfigFilterForm/ConfigFilterForm';
import { ConfigTable } from '@/shared/components/ConfigTable/ConfigTable';
import { PageHeader } from '@/shared/components/PageHeader/PageHeader';
import { usePageRequest } from '@/shared/hooks/usePageRequest';
import styles from './styles/index.module.less';

import { formatDateTime } from '@/shared/utils/datetime';
import { BOOKING_STATUS_CONFIG } from '@/shared/constants/bookingStatus';
const initialSearch: BookingSearchParams = {
  username: '',
  meetingRoomName: '',
  meetingRoomPosition: '',
  bookingTimeRangeStart: '',
  bookingTimeRangeEnd: '',
};

const filterFields: ConfigFilterField<BookingSearchParams>[] = [
  {
    key: 'username',
    label: '用户名',
    placeholder: '请输入用户名',
  },
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

type ActionType = 'apply' | 'reject' | 'unbind';

export function BookingListPage() {
  const { message } = AntdApp.useApp();
  const [operating, setOperating] = useState<{ type: ActionType; id: number } | null>(null);

  const pageRequest = usePageRequest<BookingItem, BookingSearchParams>(
    getBookingList,
    initialSearch,
  );

  const handleAction = useCallback(
    async (type: ActionType, id: number) => {
      setOperating({ type, id });
      const fn = type === 'apply' ? applyBooking : type === 'reject' ? rejectBooking : unbindBooking;
      const successMsg = type === 'apply' ? '审批通过' : type === 'reject' ? '已驳回' : '已解除';
      try {
        await fn(id);
        message.success(successMsg);
        void pageRequest.reload();
      } catch {
        // 错误已由请求拦截器统一处理
      } finally {
        setOperating(null);
      }
    },
    [message, pageRequest],
  );

  const isOperating = useCallback(
    (type: ActionType, id: number) => operating?.type === type && operating?.id === id,
    [operating],
  );

  const columns = useMemo<ColumnsType<BookingItem>>(
    () => [
      {
        title: 'ID',
        dataIndex: 'id',
        width: 60,
      },
      {
        title: '用户名',
        dataIndex: ['user', 'username'],
        width: 120,
        render: (_, record) => record.user?.username || '-',
      },
      {
        title: '昵称',
        dataIndex: ['user', 'nickName'],
        width: 120,
        render: (_, record) => record.user?.nickName || '-',
      },
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
        width: 200,
        fixed: 'right',
        render: (_, record) => {
          const status = record.status;
          const showApproveBtn = status === '申请中';
          const showUnbindBtn = status === '申请中' || status === '审批通过';

          return (
            <Space>
              {showApproveBtn && (
                <>
                  <Popconfirm
                    title="确认审批通过该预定？"
                    okText="确认"
                    cancelText="取消"
                    onConfirm={() => void handleAction('apply', record.id)}
                  >
                    <Button
                      type="link"
                      icon={<CheckOutlined />}
                      loading={isOperating('apply', record.id)}
                    >
                      通过
                    </Button>
                  </Popconfirm>
                  <Popconfirm
                    title="确认驳回该预定？"
                    okText="确认"
                    cancelText="取消"
                    onConfirm={() => void handleAction('reject', record.id)}
                  >
                    <Button
                      type="link"
                      danger
                      icon={<CloseOutlined />}
                      loading={isOperating('reject', record.id)}
                    >
                      驳回
                    </Button>
                  </Popconfirm>
                </>
              )}
              {showUnbindBtn && (
                <Popconfirm
                  title="确认解除该预定？"
                  okText="确认"
                  cancelText="取消"
                  onConfirm={() => void handleAction('unbind', record.id)}
                >
                  <Button
                    type="link"
                    danger
                    icon={<StopOutlined />}
                    loading={isOperating('unbind', record.id)}
                  >
                    解除
                  </Button>
                </Popconfirm>
              )}
              {!showApproveBtn && !showUnbindBtn && (
                <span style={{ color: '#999' }}>无可用操作</span>
              )}
            </Space>
          );
        },
      },
    ],
    [handleAction, isOperating],
  );

  return (
    <div className={styles.page}>
      <PageHeader
        title="预定管理"
        description="管理所有会议室预定，支持审批、驳回和解除操作"
      />
      <ConfigFilterForm<BookingSearchParams>
        fields={filterFields}
        initialValues={initialSearch}
        loading={pageRequest.loading}
        onSearch={(values) => {
          const dateRange = (values as unknown as Record<string, unknown>).bookingTimeRangeStart as [dayjs.Dayjs, dayjs.Dayjs] | null;
          pageRequest.submitSearch({
            ...values,
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
