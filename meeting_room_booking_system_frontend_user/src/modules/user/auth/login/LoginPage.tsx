import { LoginForm } from '@/modules/user/auth/login/components/LoginForm';
import styles from './styles/index.module.less';

export function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.title}>
        <h2>欢迎登录</h2>
        <p>请使用用户账号进入预约系统</p>
      </div>
      <LoginForm />
    </div>
  );
}
