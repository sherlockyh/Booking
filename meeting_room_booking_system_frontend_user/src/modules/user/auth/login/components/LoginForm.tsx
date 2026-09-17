import { ArrowRightOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, App as AntdApp } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '@/modules/user/auth/api';
import type { LoginParams } from '@/modules/user/auth/types';
import { saveLoginSession } from '@/modules/user/store';
import { ROUTE_PATH } from '@/shared/constants/route';
import { FormActions } from '@/shared/components/FormActions/FormActions';
import { useRequest } from '@/shared/hooks/useRequest';

export function LoginForm() {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const { loading, run } = useRequest(login, {
    onSuccess: (result) => {
      saveLoginSession(result);
      message.success('登录成功');
      navigate(ROUTE_PATH.meetingRooms, { replace: true });
    },
  });

  const handleFinish = (values: LoginParams) => {
    void run(values);
  };

  return (
    <Form<LoginParams> layout="vertical" size="large" onFinish={handleFinish}>
      <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
        <Input prefix={<UserOutlined />} placeholder="请输入用户名" autoComplete="username" />
      </Form.Item>
      <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
        <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" autoComplete="current-password" />
      </Form.Item>
      <FormActions
        submitText="登录"
        loading={loading}
        extra={
          <>
            <Link to={ROUTE_PATH.register}>注册账号</Link>
            <Button
              type="link"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate(ROUTE_PATH.adminLogin, { replace: true })}
            >
              管理员登录
            </Button>
          </>
        }
      />
    </Form>
  );
}
