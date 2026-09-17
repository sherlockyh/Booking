import { Card } from 'antd';
import { PageHeader } from '@/shared/components/PageHeader/PageHeader';
import { PasswordForm } from '@/modules/user/password/components/PasswordForm';
import styles from './styles/index.module.less';

export function PasswordPage() {
  return (
    <div className={styles.page}>
      <PageHeader title="修改密码" description="修改后请使用新密码重新登录" />
      <Card bordered={false}>
        <PasswordForm />
      </Card>
    </div>
  );
}
