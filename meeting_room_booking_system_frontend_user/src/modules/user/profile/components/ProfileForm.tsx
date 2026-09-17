import { MailOutlined, SmileOutlined } from '@ant-design/icons';
import { Form, Input, App as AntdApp } from 'antd';
import { getUpdateProfileCaptcha, updateProfile } from '@/modules/user/api';
import type { CaptchaResult } from '@/modules/user/auth/types';
import type { UpdateProfileParams, UserInfo } from '@/modules/user/types';
import { CaptchaButton } from '@/shared/components/CaptchaButton/CaptchaButton';
import { ImageUpload } from '@/shared/components/ImageUpload/ImageUpload';
import { useRequest } from '@/shared/hooks/useRequest';
import { emailRule } from '@/shared/utils/validators';
import styles from '../styles/index.module.less';

interface ProfileFormProps {
  userInfo: UserInfo;
  onUpdated: () => void;
  getCaptcha?: () => Promise<CaptchaResult>;
  saveProfile?: (params: UpdateProfileParams) => Promise<string>;
  uploadFile?: (file: File) => Promise<string>;
}

export function ProfileForm({
  userInfo,
  onUpdated,
  getCaptcha = getUpdateProfileCaptcha,
  saveProfile = updateProfile,
  uploadFile,
}: ProfileFormProps) {
  const [form] = Form.useForm<UpdateProfileParams>();
  const { message } = AntdApp.useApp();
  const captchaRequest = useRequest(getCaptcha, {
    onSuccess: (result) => {
      form.setFieldsValue({ captcha: result.captcha });
      message.success('验证码已生成');
    },
  });
  const updateRequest = useRequest(saveProfile, {
    onSuccess: () => {
      message.success('个人信息已保存');
      onUpdated();
    },
  });

  const handleFinish = (values: UpdateProfileParams) => {
    void updateRequest.run(values);
  };

  return (
    <Form<UpdateProfileParams>
      form={form}
      className={styles.form}
      layout="vertical"
      size="large"
      initialValues={{
        nickName: userInfo.nickName,
        email: userInfo.email,
        headPic: userInfo.headPic,
      }}
      onFinish={handleFinish}
    >
      <Form.Item name="nickName" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
        <Input prefix={<SmileOutlined />} placeholder="请输入昵称" />
      </Form.Item>
      <Form.Item name="email" label="邮箱" rules={emailRule}>
        <Input prefix={<MailOutlined />} placeholder="请输入邮箱" readOnly />
      </Form.Item>
      <Form.Item name="headPic" label="头像">
        <ImageUpload
          buttonText="上传头像"
          description="支持 png、jpg、gif 格式，上传后会自动回填保存字段"
          uploadFile={uploadFile}
        />
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
          {updateRequest.loading ? '保存中...' : '保存修改'}
        </button>
      </Form.Item>
    </Form>
  );
}
