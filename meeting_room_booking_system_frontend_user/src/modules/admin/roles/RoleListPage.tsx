import { useMemo, useState } from 'react';
import { Button, Popconfirm, Space, Tag, App as AntdApp } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import { deleteRole, getRoleList } from '@/modules/admin/api';
import type { RoleItem } from '@/modules/admin/types';
import { RoleFormModal } from '@/modules/admin/roles/components/RoleFormModal';
import { ConfigTable } from '@/shared/components/ConfigTable/ConfigTable';
import { PageHeader } from '@/shared/components/PageHeader/PageHeader';
import { usePageRequest } from '@/shared/hooks/usePageRequest';
import { useRequest } from '@/shared/hooks/useRequest';
import styles from './styles/index.module.less';

export function RoleListPage() {
  const { message } = AntdApp.useApp();
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const pageRequest = usePageRequest<RoleItem, Record<string, never>>(
    getRoleList,
    {},
  );

  const deleteRequest = useRequest(deleteRole, {
    onSuccess: () => {
      message.success('删除成功');
      void pageRequest.reload();
    },
  });

  const columns = useMemo<ColumnsType<RoleItem>>(
    () => [
      {
        title: '角色名称',
        dataIndex: 'name',
        width: 160,
      },
      {
        title: '权限',
        dataIndex: 'permissions',
        render: (permissions: string[]) => (
          <Space size={[8, 8]} wrap>
            {permissions.length > 0 ? (
              permissions.map((code) => (
                <Tag key={code} color="blue">
                  {code}
                </Tag>
              ))
            ) : (
              <Tag>无权限</Tag>
            )}
          </Space>
        ),
      },
      {
        title: '操作',
        key: 'actions',
        width: 160,
        fixed: 'right',
        render: (_, record) => (
          <Space>
            <Button
              type="link"
              onClick={() => {
                setEditingRole(record);
                setModalOpen(true);
              }}
            >
              编辑
            </Button>
            <Popconfirm
              title="确认删除该角色？"
              okText="确认"
              cancelText="取消"
              onConfirm={() => void deleteRequest.run(record.id)}
            >
              <Button type="link" danger loading={deleteRequest.loading}>
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
        title="角色管理"
        description="按角色组合权限码，配合用户管理的「分配角色」控制各账号能访问的管理功能"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingRole(null);
              setModalOpen(true);
            }}
          >
            新增角色
          </Button>
        }
      />
      <div className={styles.tableWrap}>
        <ConfigTable<RoleItem>
          rowKey="id"
          columns={columns}
          dataSource={pageRequest.items}
          loading={pageRequest.loading}
          pagination={{
            pageNo: pageRequest.page.pageNo,
            pageSize: pageRequest.page.pageSize,
            total: pageRequest.total,
            onChange: (pageNo, pageSize) =>
              pageRequest.setPage({ pageNo, pageSize }),
          }}
        />
      </div>
      <RoleFormModal
        open={modalOpen}
        record={editingRole}
        onCancel={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          void pageRequest.reload();
        }}
      />
    </div>
  );
}
