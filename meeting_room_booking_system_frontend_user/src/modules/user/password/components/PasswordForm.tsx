import { LockOutlined } from '@ant-design/icons';
import { Form, Input, App as AntdApp } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getUpdatePasswordCaptcha, updatePassword } from '@/modules/user/api';
import type { CaptchaResult } from '@/modules/user/auth/types';
import type { UpdatePasswordParams } from '@/modules/user/types';
import { clearUserSession } from '@/modules/user/store';
import { CaptchaButton } from '@/shared/components/CaptchaButton/CaptchaButton';
import { ROUTE_PATH } from '@/shared/constants/route';
import { useRequest } from '@/shared/hooks/useRequest';
import { passwordRule } from '@/shared/utils/validators';
import styles from '../styles/index.module.less';

interface PasswordFormProps {
  getCaptcha?: () => Promise<CaptchaResult>;
  savePassword?: (params: UpdatePasswordParams) => Promise<string>;
  onUpdated?: () => void;
}

export function PasswordForm({
  getCaptcha = getUpdatePasswordCaptcha,
  savePassword = updatePassword,
  onUpdated,
}: PasswordFormProps) {
  const [form] = Form.useForm<UpdatePasswordParams>();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const captchaRequest = useRequest(getCaptcha, {
    onSuccess: (result) => {
      form.setFieldsValue({ captchaId: result.captchaId, captcha: result.captcha });
      message.success('验证码已生成');
    },
  });
  const updateRequest = useRequest(savePassword, {
    onSuccess: () => {
      message.success('密码修改成功，请重新登录');

      if (onUpdated) {
        onUpdated();
        return;
      }

      clearUserSession();
      navigate(ROUTE_PATH.login, { replace: true });
    },
  });

  const handleFinish = (values: UpdatePasswordParams) => {
    void updateRequest.run(values);
  };

  return (
    <Form<UpdatePasswordParams> form={form} className={styles.form} layout="vertical" size="large" onFinish={handleFinish}>
      <Form.Item name="password" label="新密码" rules={passwordRule}>
        <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码" autoComplete="new-password" />
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
      <Form.Item className={styles.submit}>
        <button type="submit" disabled={updateRequest.loading}>
          {updateRequest.loading ? '提交中...' : '修改密码'}
        </button>
      </Form.Item>
    </Form>
  );
}
