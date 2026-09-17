import { CalendarOutlined, CheckOutlined } from '@ant-design/icons';
import { Outlet } from 'react-router-dom';
import styles from './styles/index.module.less';

const highlights = ['快速查看可用会议室，按需预约', '清晰管理个人预约与会议日程', '数据统计直观呈现使用趋势'];

export function AuthLayout() {
  return (
    <main className={styles.shell}>
      <section className={styles.brand}>
        <div className={styles.brandTop}>
          <div className={styles.logo}>
            <CalendarOutlined />
          </div>
          <div>
            <p className={styles.eyebrow}>会议空间管理</p>
            <h1>会议室预约系统</h1>
            <p className={styles.subtitle}>用户端 · 让每一场会议都有合适的空间</p>
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
        <Outlet />
      </section>
    </main>
  );
}
