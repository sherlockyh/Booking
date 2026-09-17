import { useEffect } from 'react';
import { Form, Input, Modal, App as AntdApp } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { resetUserPassword } from '@/modules/admin/api';
import type { AdminUserItem, ResetPasswordParams } from '@/modules/admin/types';
import { useRequest } from '@/shared/hooks/useRequest';
import { passwordRule } from '@/shared/utils/validators';

interface ResetPasswordModalProps {
  open: boolean;
  user: AdminUserItem | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export function ResetPasswordModal({
  open,
  user,
  onCancel,
  onSuccess,
}: ResetPasswordModalProps) {
  const [form] = Form.useForm<ResetPasswordParams>();
  const { message } = AntdApp.useApp();
  const { loading, run } = useRequest(resetUserPassword, {
    onSuccess: () => {
      message.success('密码重置成功');
      onSuccess();
    },
  });

  useEffect(() => {
    if (open && user) {
      form.setFieldsValue({
        id: user.id,
        password: '',
      });
    }
  }, [form, open, user]);

  const handleOk = () => {
    form.submit();
  };

  const handleFinish = (values: ResetPasswordParams) => {
    void run({
      ...values,
      id: Number(values.id),
    });
  };

  return (
    <Modal
      title={`重置密码${user ? ` - ${user.username}` : ''}`}
      open={open}
      confirmLoading={loading}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form<ResetPasswordParams> form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="id" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="password" label="新密码" rules={passwordRule}>
          <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码" autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
