import { CalendarOutlined, CheckOutlined } from '@ant-design/icons';
import { AdminLoginForm } from '@/modules/admin/login/components/AdminLoginForm';
import styles from './styles/index.module.less';

const highlights = ['统一管理人员、空间与预约', '审批会议室申请，掌握使用情况', '多维数据视图辅助日常运营'];

export function AdminLoginPage() {
  return (
    <main className={styles.shell}>
      <section className={styles.brand}>
        <div className={styles.brandTop}>
          <div className={styles.logo}>
            <CalendarOutlined />
          </div>
          <div>
            <p className={styles.eyebrow}>管理控制台</p>
            <h1>会议室预约系统</h1>
            <p className={styles.subtitle}>管理端 · 统筹空间资源，提升协作效率</p>
          </div>
        </div>

        <ul className={styles.points}>
          {highlights.map((item) => (
            <li key={item}>
              <CheckOutlined className={styles.pointIcon} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.panel}>
        <div className={styles.title}>
          <h2>管理员登录</h2>
          <p>请使用管理员账号进入后台管理</p>
        </div>
        <AdminLoginForm />
      </section>
    </main>
  );
}
