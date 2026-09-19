import { useMemo, useState } from 'react';
import { Button, DatePicker, Form, Input, Modal, Space, Tag, App as AntdApp } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ScheduleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { addBooking, getMeetingRoomList } from '@/modules/user/api';
import type { MeetingRoomItem, MeetingRoomSearchParams } from '@/modules/admin/types';
import { ConfigFilterForm, type ConfigFilterField } from '@/shared/components/ConfigFilterForm/ConfigFilterForm';
import { ConfigTable } from '@/shared/components/ConfigTable/ConfigTable';
import { PageHeader } from '@/shared/components/PageHeader/PageHeader';
import { usePageRequest } from '@/shared/hooks/usePageRequest';
import { useRequest } from '@/shared/hooks/useRequest';
import styles from './styles/index.module.less';

import { formatDateTime } from '@/shared/utils/datetime';
const initialSearch: MeetingRoomSearchParams = {
  name: '',
  capacity: '',
  equipment: '',
};

const filterFields: ConfigFilterField<MeetingRoomSearchParams>[] = [
  {
    key: 'name',
    label: '名称',
    placeholder: '请输入会议室名称',
  },
  {
    key: 'capacity',
    label: '容量',
    placeholder: '请输入容量',
  },
  {
    key: 'equipment',
    label: '设备',
    placeholder: '请输入设备',
  },
];

export function UserMeetingRoomListPage() {
  const { message } = AntdApp.useApp();
  const [bookingRoom, setBookingRoom] = useState<MeetingRoomItem | null>(null);
  const [form] = Form.useForm();

  const pageRequest = usePageRequest<MeetingRoomItem, MeetingRoomSearchParams>(
    getMeetingRoomList,
    initialSearch,
  );

  const bookingRequest = useRequest(addBooking, {
    onSuccess: () => {
      message.success('预定成功');
      setBookingRoom(null);
      form.resetFields();
      void pageRequest.reload();
    },
  });

  const handleOpenBooking = (record: MeetingRoomItem) => {
    setBookingRoom(record);
    form.resetFields();
  };

  const handleCloseBooking = () => {
    setBookingRoom(null);
  };

  const handleBookingSubmit = () => {
    form.validateFields().then((values) => {
      const range = values.timeRange as [dayjs.Dayjs, dayjs.Dayjs];
      void bookingRequest.run({
        meetingRoomId: bookingRoom!.id,
        startTime: range[0].valueOf(),
        endTime: range[1].valueOf(),
        note: values.note || '',
      });
    }).catch(() => {});
  };

  const columns = useMemo<ColumnsType<MeetingRoomItem>>(
    () => [
      {
        title: '名称',
        dataIndex: 'name',
        width: 140,
      },
      {
        title: '容量',
        dataIndex: 'capacity',
        width: 80,
      },
      {
        title: '位置',
        dataIndex: 'location',
        width: 160,
        ellipsis: true,
      },
      {
        title: '设备',
        dataIndex: 'equipment',
        width: 200,
        render: (equipment: string) =>
          equipment
            ? equipment.split(',').map((item) => (
                <Tag key={item} color="blue">
                  {item.trim()}
                </Tag>
              ))
            : '-',
      },
      {
        title: '描述',
        dataIndex: 'description',
        width: 200,
        ellipsis: true,
      },
      {
        title: '状态',
        dataIndex: 'isBooked',
        width: 100,
        render: (isBooked: boolean) =>
          isBooked ? <Tag color="orange">已预订</Tag> : <Tag color="green">空闲</Tag>,
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
        render: (_, record) => (
          <Button
            type="primary"
            icon={<ScheduleOutlined />}
            onClick={() => handleOpenBooking(record)}
          >
            预订
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div className={styles.page}>
      <PageHeader
        title="会议室列表"
        description="浏览所有会议室，按名称、容量和设备筛选"
      />
      <ConfigFilterForm<MeetingRoomSearchParams>
        fields={filterFields}
        initialValues={initialSearch}
        loading={pageRequest.loading}
        onSearch={pageRequest.submitSearch}
      />
      <div className={styles.tableWrap}>
        <ConfigTable<MeetingRoomItem>
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

      <Modal
        title="预定会议室"
        open={!!bookingRoom}
        onCancel={handleCloseBooking}
        onOk={handleBookingSubmit}
        confirmLoading={bookingRequest.loading}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="会议室">
            <Input value={bookingRoom?.name || ''} disabled />
          </Form.Item>
          <Form.Item
            name="timeRange"
            label="预定时间"
            rules={[{ required: true, message: '请选择预定时间' }]}
          >
            <DatePicker.RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注（选填）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}