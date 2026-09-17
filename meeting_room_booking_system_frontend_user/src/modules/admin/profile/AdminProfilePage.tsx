import { useEffect } from 'react';
import { Card } from 'antd';
import {
  getAdminInfo,
  getAdminUpdateProfileCaptcha,
  updateAdminProfile,
  uploadAdminFile,
} from '@/modules/admin/api';
import { saveAdminInfo } from '@/modules/admin/store';
import { ProfileForm } from '@/modules/user/profile/components/ProfileForm';
import { PageHeader } from '@/shared/components/PageHeader/PageHeader';
import { useRequest } from '@/shared/hooks/useRequest';
import styles from '@/modules/user/profile/styles/index.module.less';

export function AdminProfilePage() {
  const userRequest = useRequest(getAdminInfo, {
    onSuccess: saveAdminInfo,
  });

  useEffect(() => {
    void userRequest.run();
  }, [userRequest.run]);

  return (
    <div className={styles.page}>
      <PageHeader title="个人信息" description="维护管理员昵称、头像和邮箱验证码信息" />
      <Card bordered={false} loading={userRequest.loading}>
        {userRequest.data ? (
          <ProfileForm
            userInfo={userRequest.data}
            onUpdated={() => void userRequest.run()}
            getCaptcha={getAdminUpdateProfileCaptcha}
            saveProfile={updateAdminProfile}
            uploadFile={uploadAdminFile}
          />
        ) : null}
      </Card>
    </div>
  );
}
