import { RegisterForm } from '@/modules/user/auth/register/components/RegisterForm';
import styles from './styles/index.module.less';

export function RegisterPage() {
  return (
    <div className={styles.page}>
      <div className={styles.title}>
        <h2>创建账号</h2>
        <p>填写基础信息后即可注册</p>
      </div>
      <RegisterForm />
    </div>
  );
}
