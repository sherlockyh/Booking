import { useEffect } from 'react';
import { Checkbox, Form, Modal, App as AntdApp } from 'antd';
import { assignUserRoles, getRoleList } from '@/modules/admin/api';
import type {
  AdminUserItem,
  AssignUserRolesParams,
  RoleItem,
} from '@/modules/admin/types';
import { useRequest } from '@/shared/hooks/useRequest';

interface AssignRolesModalProps {
  open: boolean;
  user: AdminUserItem | null;
  onCancel: () => void;
  onSuccess: () => void;
}

interface FormValues {
  roleIds: number[];
}

export function AssignRolesModal({
  open,
  user,
  onCancel,
  onSuccess,
}: AssignRolesModalProps) {
  const [form] = Form.useForm<FormValues>();
  const { message } = AntdApp.useApp();

  // 角色列表打开时拉取，供勾选
  const roleRequest = useRequest(
    () => getRoleList({ pageNo: 1, pageSize: 100 }),
  );
  const roles: RoleItem[] = roleRequest.data?.list ?? [];
  const { run: loadRoles } = roleRequest;

  const assignRequest = useRequest(assignUserRoles, {
    onSuccess: () => {
      message.success('分配成功');
      onSuccess();
    },
  });

  useEffect(() => {
    if (open) {
      void loadRoles();
      if (user) {
        // 回显：把角色名匹配回 id（列表接口只返回角色名数组）
        const currentIds = roles
          .filter((role) => user.roles?.includes(role.name))
          .map((role) => role.id);
        form.setFieldsValue({ roleIds: currentIds });
      } else {
        form.resetFields();
    }
    }
    // roles 在 open 变化时可能尚未返回，这里依赖它做回显匹配
  }, [form, open, user, roles, loadRoles]);

  const handleOk = () => {
    form.submit();
  };

  const handleFinish = (values: FormValues) => {
    if (!user) {
      return;
    }
    const params: AssignUserRolesParams = {
      userId: user.id,
      roleIds: values.roleIds ?? [],
    };
    void assignRequest.run(params);
  };

  return (
    <Modal
      title={`分配角色${user ? `：${user.username}` : ''}`}
      open={open}
      confirmLoading={assignRequest.loading}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form<FormValues> form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="roleIds"
          label="角色"
          extra="权限在用户下次登录后生效；不勾选表示清空该用户的角色"
        >
          <Checkbox.Group style={{ display: 'block' }}>
            {roles.map((role) => (
              <Checkbox
                key={role.id}
                value={role.id}
                style={{ marginInlineEnd: 24, marginBlockEnd: 8 }}
              >
                {role.name}
                {role.permissions.length > 0 && (
                  <span style={{ color: '#888', marginInlineStart: 4 }}>
                    （{role.permissions.join('、')}）
                  </span>
                )}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
}
