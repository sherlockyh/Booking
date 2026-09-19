import { useEffect } from 'react';
import { Checkbox, Form, Input, Modal, App as AntdApp } from 'antd';
import { createRole, getPermissionList, updateRole } from '@/modules/admin/api';
import type {
  CreateRoleParams,
  PermissionItem,
  RoleItem,
} from '@/modules/admin/types';
import { useRequest } from '@/shared/hooks/useRequest';

interface RoleFormModalProps {
  open: boolean;
  record: RoleItem | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export function RoleFormModal({
  open,
  record,
  onCancel,
  onSuccess,
}: RoleFormModalProps) {
  const [form] = Form.useForm<CreateRoleParams>();
  const { message } = AntdApp.useApp();

  // 权限码列表打开弹窗时才拉取，供勾选
  const permissionRequest = useRequest(getPermissionList);

  const createRequest = useRequest(createRole, {
    onSuccess: () => {
      message.success('创建成功');
      onSuccess();
    },
  });

  const updateRequest = useRequest(updateRole, {
    onSuccess: () => {
      message.success('更新成功');
      onSuccess();
    },
  });

  const isEdit = Boolean(record);
  const loading = createRequest.loading || updateRequest.loading;
  const { run: loadPermissions } = permissionRequest;

  useEffect(() => {
    if (open) {
      void loadPermissions();
      if (record) {
        form.setFieldsValue({
          name: record.name,
          permissionCodes: record.permissions,
        });
      } else {
        form.resetFields();
      }
    }
    // loadPermissions 来自 useRequest，内部 useCallback 依赖为空、引用稳定
  }, [form, open, record, loadPermissions]);

  const handleOk = () => {
    form.submit();
  };

  const handleFinish = (values: CreateRoleParams) => {
    if (isEdit && record) {
      void updateRequest.run({ ...values, id: record.id });
    } else {
      void createRequest.run(values);
    }
  };

  const permissions: PermissionItem[] = permissionRequest.data ?? [];

  return (
    <Modal
      title={isEdit ? '编辑角色' : '新增角色'}
      open={open}
      confirmLoading={loading}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form<CreateRoleParams>
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Form.Item
          name="name"
          label="角色名称"
          rules={[
            { required: true, message: '请输入角色名称' },
            { max: 20, message: '角色名称最长为 20 字符' },
          ]}
        >
          <Input placeholder="请输入角色名称" maxLength={20} />
        </Form.Item>
        <Form.Item
          name="permissionCodes"
          label="权限"
          rules={[{ required: true, message: '请至少选择一个权限' }]}
        >
          <Checkbox.Group style={{ display: 'block' }}>
            {permissions.map((permission) => (
              <Checkbox
                key={permission.code}
                value={permission.code}
                style={{ marginInlineEnd: 24, marginBlockEnd: 8 }}
              >
                {permission.description}（{permission.code}）
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
}
