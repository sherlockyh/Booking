import { LockOutlined, MailOutlined, SmileOutlined, UserOutlined } from '@ant-design/icons';
import { Form, Input, App as AntdApp } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { getRegisterCaptcha, register } from '@/modules/user/auth/api';
import type { CaptchaResult, RegisterParams } from '@/modules/user/auth/types';
import { CaptchaButton } from '@/shared/components/CaptchaButton/CaptchaButton';
import { FormActions } from '@/shared/components/FormActions/FormActions';
import { ROUTE_PATH } from '@/shared/constants/route';
import { useRequest } from '@/shared/hooks/useRequest';
import { emailRule, passwordRule } from '@/shared/utils/validators';

export function RegisterForm() {
  const [form] = Form.useForm<RegisterParams>();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const captchaRequest = useRequest(getRegisterCaptcha, {
    onSuccess: (result: CaptchaResult) => {
      form.setFieldsValue({ captchaId: result.captchaId, captcha: result.captcha });
      message.success('验证码已生成');
    },
  });
  const registerRequest = useRequest(register, {
    onSuccess: () => {
      message.success('注册成功');
      navigate(ROUTE_PATH.login, { replace: true });
    },
  });

  const handleFinish = (values: RegisterParams) => {
    void registerRequest.run(values);
  };

  return (
    <Form<RegisterParams> form={form} layout="vertical" size="large" onFinish={handleFinish}>
      <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
        <Input prefix={<UserOutlined />} placeholder="请输入用户名" autoComplete="username" />
      </Form.Item>
      <Form.Item name="nickName" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
        <Input prefix={<SmileOutlined />} placeholder="请输入昵称" />
      </Form.Item>
      <Form.Item name="email" label="邮箱" rules={emailRule}>
        <Input prefix={<MailOutlined />} placeholder="请输入邮箱" autoComplete="email" />
      </Form.Item>
      <Form.Item name="password" label="密码" rules={passwordRule}>
        <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" autoComplete="new-password" />
      </Form.Item>
      <Form.Item name="captchaId" hidden>
        <Input />
      </Form.Item>
      <Form.Item label="验证码" required>
        <Input.Group compact>
          <Form.Item name="captcha" noStyle rules={[{ required: true, message: '请输入验证码' }]}>
            <Input style={{ width: 'calc(100% - 116px)' }} placeholder="请输入验证码" />
          </Form.Item>
          <CaptchaButton
            loading={captchaRequest.loading}
            expireSeconds={captchaRequest.data?.expireSeconds}
            onClick={() => captchaRequest.run()}
          />
        </Input.Group>
      </Form.Item>
      <FormActions
        submitText="注册"
        loading={registerRequest.loading}
        extra={<Link to={ROUTE_PATH.login}>已有账号，去登录</Link>}
      />
    </Form>
  );
}
