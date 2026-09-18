import { useMemo, useState } from 'react';
import { Avatar, Button, Popconfirm, Space, App as AntdApp } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, MailOutlined, SmileOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { deleteUser, freezeUser, getUserList, unfreezeUser } from '@/modules/admin/api';
import type { AdminUserItem, AdminUserSearchParams } from '@/modules/admin/types';
import { ResetPasswordModal } from '@/modules/admin/users/components/ResetPasswordModal';
import { ConfigFilterForm, type ConfigFilterField } from '@/shared/components/ConfigFilterForm/ConfigFilterForm';
import { ConfigTable } from '@/shared/components/ConfigTable/ConfigTable';
import { PageHeader } from '@/shared/components/PageHeader/PageHeader';
import { usePageRequest } from '@/shared/hooks/usePageRequest';
import { useRequest } from '@/shared/hooks/useRequest';
import styles from './styles/index.module.less';

const initialSearch: AdminUserSearchParams = {
  username: '',
  nickName: '',
  email: '',
};

const filterFields: ConfigFilterField<AdminUserSearchParams>[] = [
  {
    key: 'username',
    label: '用户名',
    placeholder: '请输入用户名',
    prefix: <UserOutlined />,
  },
  {
    key: 'nickName',
    label: '昵称',
    placeholder: '请输入昵称',
    prefix: <SmileOutlined />,
  },
  {
    key: 'email',
    label: '邮箱',
    placeholder: '请输入邮箱',
    prefix: <MailOutlined />,
  },
];

function formatDateTime(value?: string | number) {
  if (!value) {
    return '-';
  }

  const time = dayjs(value);
  return time.isValid() ? time.format('YYYY-MM-DD HH:mm:ss') : '-';
}

export function UserListPage() {
  const { message } = AntdApp.useApp();
  const [resetUser, setResetUser] = useState<AdminUserItem | null>(null);
  const pageRequest = usePageRequest<AdminUserItem, AdminUserSearchParams>(getUserList, initialSearch);
  const freezeRequest = useRequest(freezeUser, {
    onSuccess: () => {
      message.success('冻结成功');
      void pageRequest.reload();
    },
  });
  const unfreezeRequest = useRequest(unfreezeUser, {
    onSuccess: () => {
      message.success('解冻成功');
      void pageRequest.reload();
    },
  });
  const deleteRequest = useRequest(deleteUser, {
    onSuccess: () => {
      message.success('删除成功');
      void pageRequest.reload();
    },
  });

  const columns = useMemo<ColumnsType<AdminUserItem>>(
    () => [
      {
        title: '头像',
        dataIndex: 'headPicUrl',
        width: 88,
        render: (headPicUrl: string | undefined) => (
          <Avatar src={headPicUrl || undefined} icon={<UserOutlined />} />
        ),
      },
      {
        title: '用户名',
        dataIndex: 'username',
      },
      {
        title: '昵称',
        dataIndex: 'nickName',
      },
      {
        title: '邮箱',
        dataIndex: 'email',
      },
      {
        title: '注册时间',
        dataIndex: 'createTime',
        width: 180,
        render: formatDateTime,
      },
      {
        title: '操作',
        key: 'actions',
        width: 260,
        fixed: 'right',
        render: (_, record) => (
          <Space>
            {record.isFrozen ? (
              <Popconfirm
                title="确认解冻该用户？"
                okText="确认"
                cancelText="取消"
                onConfirm={() => void unfreezeRequest.run(record.id)}
              >
                <Button type="link" loading={unfreezeRequest.loading}>
                  解冻
                </Button>
              </Popconfirm>
            ) : (
              <Popconfirm
                title="确认冻结该用户？"
                okText="确认"
                cancelText="取消"
                onConfirm={() => void freezeRequest.run(record.id)}
              >
                <Button type="link" danger loading={freezeRequest.loading}>
                  冻结
                </Button>
              </Popconfirm>
            )}
            <Button type="link" onClick={() => setResetUser(record)}>
              重置密码
            </Button>
            <Popconfirm
              title="确认删除该用户？"
              okText="确认"
              cancelText="取消"
              onConfirm={() => void deleteRequest.run({ id: record.id })}
            >
              <Button type="link" danger  loading={deleteRequest.loading}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [freezeRequest, pageRequest, unfreezeRequest],
  );

  return (
    <div className={styles.page}>
      <PageHeader title="用户管理" description="按用户名、昵称和邮箱筛选用户，支持冻结、解冻、删除账号和重置密码" />
      <ConfigFilterForm<AdminUserSearchParams>
        fields={filterFields}
        initialValues={initialSearch}
        loading={pageRequest.loading}
        onSearch={pageRequest.submitSearch}
      />
      <div className={styles.tableWrap}>
        <ConfigTable<AdminUserItem>
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
      <ResetPasswordModal
        open={Boolean(resetUser)}
        user={resetUser}
        onCancel={() => setResetUser(null)}
        onSuccess={() => {
          setResetUser(null);
          void pageRequest.reload();
        }}
      />
    </div>
  );
}
