import {
  BarChartOutlined,
  EnvironmentOutlined,
  ScheduleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { ROUTE_PATH } from '@/shared/constants/route';
import { clearAdminSession, useAdminStore } from '@/modules/admin/store';
import { AppShell } from '@/shared/components/AppShell/AppShell';
import styles from './styles/index.module.less';

const menuItems: MenuProps['items'] = [
  {
    key: ROUTE_PATH.adminUsers,
    icon: <TeamOutlined />,
    label: '用户管理',
  },
  {
    key: ROUTE_PATH.adminMeetingRooms,
    icon: <EnvironmentOutlined />,
    label: '会议室管理',
  },
  {
    key: ROUTE_PATH.adminBookings,
    icon: <ScheduleOutlined />,
    label: '预定管理',
  },
  {
    key: ROUTE_PATH.adminStatistics,
    icon: <BarChartOutlined />,
    label: '数据统计',
  },
];

function useUserInfo() {
  return useAdminStore((state) => state.userInfo);
}

export function AdminLayout() {
  return (
    <AppShell
      scope="admin"
      logoText="预约后台"
      menuItems={menuItems}
      profilePath={ROUTE_PATH.adminProfile}
      passwordPath={ROUTE_PATH.adminPassword}
      loginPath={ROUTE_PATH.adminLogin}
      fallbackName="管理员"
      fallbackEmail="后台管理账号"
      clearSession={clearAdminSession}
      useUserInfo={useUserInfo}
      styles={styles}
    />
  );
}
