import { useMemo, useState } from 'react';
import { Button, Popconfirm, Space, Tag, App as AntdApp } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, EnvironmentOutlined, ToolOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { deleteMeetingRoom, getMeetingRoomList } from '@/modules/admin/api';
import type { MeetingRoomItem, MeetingRoomSearchParams } from '@/modules/admin/types';
import { MeetingRoomFormModal } from '@/modules/admin/meetingRooms/components/MeetingRoomFormModal';
import { ConfigFilterForm, type ConfigFilterField } from '@/shared/components/ConfigFilterForm/ConfigFilterForm';
import { ConfigTable } from '@/shared/components/ConfigTable/ConfigTable';
import { PageHeader } from '@/shared/components/PageHeader/PageHeader';
import { usePageRequest } from '@/shared/hooks/usePageRequest';
import { useRequest } from '@/shared/hooks/useRequest';
import styles from './styles/index.module.less';

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
    prefix: <ToolOutlined />,
  },
];

function formatDateTime(value?: string | number) {
  if (!value) {
    return '-';
  }

  const time = dayjs(value);
  return time.isValid() ? time.format('YYYY-MM-DD HH:mm:ss') : '-';
}

export function MeetingRoomListPage() {
  const { message } = AntdApp.useApp();
  const [modalRecord, setModalRecord] = useState<MeetingRoomItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const pageRequest = usePageRequest<MeetingRoomItem, MeetingRoomSearchParams>(
    getMeetingRoomList,
    initialSearch,
  );

  const deleteRequest = useRequest(deleteMeetingRoom, {
    onSuccess: () => {
      message.success('删除成功');
      void pageRequest.reload();
    },
  });

  const handleOpenCreate = () => {
    setModalRecord(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (record: MeetingRoomItem) => {
    setModalRecord(record);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setModalRecord(null);
  };

  const handleModalSuccess = () => {
    handleCloseModal();
    void pageRequest.reload();
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
        width: 160,
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
        width: 150,
        fixed: 'right',
        render: (_, record) => (
          <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleOpenEdit(record)}
            >
              编辑
            </Button>
            <Popconfirm
              title="确认删除该会议室？"
              okText="确认"
              cancelText="取消"
              onConfirm={() => void deleteRequest.run(record.id)}
            >
              <Button type="link" danger icon={<DeleteOutlined />} loading={deleteRequest.loading}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [deleteRequest],
  );

  return (
    <div className={styles.page}>
      <PageHeader
        title="会议室管理"
        description="管理会议室，支持按名称、容量和设备筛选，支持新增、编辑和删除"
        extra={
          <Button type="primary" icon={<EnvironmentOutlined />} onClick={handleOpenCreate}>
            新增会议室
          </Button>
        }
      />
      <ConfigFilterForm<MeetingRoomSearchParams>
        fields={filterFields}
        initialValues={initialSearch}
        loading={pageRequest.loading}
        onSearch={(values) => {
          pageRequest.submitSearch({
            ...values,
            capacity: values.capacity ? String(values.capacity) : '',
          });
        }}
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
      <MeetingRoomFormModal
        open={modalOpen}
        record={modalRecord}
        onCancel={handleCloseModal}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}