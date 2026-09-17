import { useEffect } from 'react';
import { Card } from 'antd';
import { PageHeader } from '@/shared/components/PageHeader/PageHeader';
import { getUserInfo } from '@/modules/user/api';
import { saveUserInfo } from '@/modules/user/store';
import { ProfileForm } from '@/modules/user/profile/components/ProfileForm';
import { useRequest } from '@/shared/hooks/useRequest';
import styles from './styles/index.module.less';

export function ProfilePage() {
  const userRequest = useRequest(getUserInfo, {
    onSuccess: saveUserInfo,
  });

  useEffect(() => {
    void userRequest.run();
  }, [userRequest.run]);

  return (
    <div className={styles.page}>
      <PageHeader title="个人信息" description="维护昵称、头像和邮箱验证码信息" />
      <Card bordered={false} loading={userRequest.loading}>
        {userRequest.data ? <ProfileForm userInfo={userRequest.data} onUpdated={() => userRequest.run()} /> : null}
      </Card>
    </div>
  );
}
