import { ArrowLeftOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, App as AntdApp } from 'antd';
import { useNavigate } from 'react-router-dom';
import { login } from '@/modules/admin/api';
import type { LoginParams } from '@/modules/admin/types';
import { saveAdminSession } from '@/modules/admin/store';
import { ROUTE_PATH } from '@/shared/constants/route';
import { FormActions } from '@/shared/components/FormActions/FormActions';
import { useRequest } from '@/shared/hooks/useRequest';

export function AdminLoginForm() {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const { loading, run } = useRequest(login, {
    onSuccess: (result) => {
      saveAdminSession(result);
      message.success('管理员登录成功');
      navigate(ROUTE_PATH.adminUsers, { replace: true });
    },
  });

  const handleFinish = (values: LoginParams) => {
    void run(values);
  };

  return (
    <Form<LoginParams> layout="vertical" size="large" onFinish={handleFinish}>
      <Form.Item name="username" label="管理员账号" rules={[{ required: true, message: '请输入管理员账号' }]}>
        <Input prefix={<UserOutlined />} placeholder="请输入管理员账号" autoComplete="username" />
      </Form.Item>
      <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
        <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" autoComplete="current-password" />
      </Form.Item>
      <FormActions
        submitText="管理员登录"
        loading={loading}
        extra={
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(ROUTE_PATH.login, { replace: true })}
          >
            返回用户登录
          </Button>
        }
      />
    </Form>
  );
}
