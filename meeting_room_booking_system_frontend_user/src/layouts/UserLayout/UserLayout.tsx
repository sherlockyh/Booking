import {
  BarChartOutlined,
  EnvironmentOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { ROUTE_PATH } from '@/shared/constants/route';
import { clearUserSession, useUserStore } from '@/modules/user/store';
import { AppShell } from '@/shared/components/AppShell/AppShell';
import styles from './styles/index.module.less';

const menuItems: MenuProps['items'] = [
  {
    key: ROUTE_PATH.meetingRooms,
    icon: <EnvironmentOutlined />,
    label: '会议室列表',
  },
  {
    key: ROUTE_PATH.bookings,
    icon: <HistoryOutlined />,
    label: '预定历史',
  },
  {
    key: ROUTE_PATH.statistics,
    icon: <BarChartOutlined />,
    label: '数据统计',
  },
];

function useUserInfo() {
  return useUserStore((state) => state.userInfo);
}

export function UserLayout() {
  return (
    <AppShell
      scope="user"
      logoText="会议室预约"
      menuItems={menuItems}
      profilePath={ROUTE_PATH.profile}
      passwordPath={ROUTE_PATH.password}
      loginPath={ROUTE_PATH.login}
      fallbackName="用户"
      fallbackEmail="未设置邮箱"
      clearSession={clearUserSession}
      useUserInfo={useUserInfo}
      styles={styles}
    />
  );
}
