import { Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getAdminUpdatePasswordCaptcha, updateAdminPassword } from '@/modules/admin/api';
import { clearAdminSession } from '@/modules/admin/store';
import { PasswordForm } from '@/modules/user/password/components/PasswordForm';
import { PageHeader } from '@/shared/components/PageHeader/PageHeader';
import { ROUTE_PATH } from '@/shared/constants/route';
import styles from '@/modules/user/password/styles/index.module.less';

export function AdminPasswordPage() {
  const navigate = useNavigate();

  const handleUpdated = () => {
    clearAdminSession();
    navigate(ROUTE_PATH.adminLogin, { replace: true });
  };

  return (
    <div className={styles.page}>
      <PageHeader title="修改密码" description="修改后请使用新密码重新登录" />
      <Card bordered={false}>
        <PasswordForm
          getCaptcha={getAdminUpdatePasswordCaptcha}
          savePassword={updateAdminPassword}
          onUpdated={handleUpdated}
        />
      </Card>
    </div>
  );
}
