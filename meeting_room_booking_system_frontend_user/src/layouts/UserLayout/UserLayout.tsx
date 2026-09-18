import { useEffect, useRef } from 'react';
import {
  BarChartOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  HistoryOutlined,
  IdcardOutlined,
  LockOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Dropdown, Layout, Menu, Space } from 'antd';
import type { MenuProps } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ROUTE_PATH } from '@/shared/constants/route';
import { clearUserSession, useUserStore } from '@/modules/user/store';
import { getAccessToken } from '@/shared/utils/token';
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

export function UserLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const userInfo = useUserStore((state) => state.userInfo);
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    if (!getAccessToken('user')) {
      navigateRef.current(ROUTE_PATH.login, { replace: true });
    }
  }, []);

  const handleLogout = () => {
    clearUserSession();
    navigate(ROUTE_PATH.login, { replace: true });
  };

  const dropdownItems: MenuProps['items'] = [
    {
      key: ROUTE_PATH.profile,
      icon: <IdcardOutlined />,
      label: '个人信息',
      onClick: () => navigate(ROUTE_PATH.profile),
    },
    {
      key: ROUTE_PATH.password,
      icon: <LockOutlined />,
      label: '修改密码',
      onClick: () => navigate(ROUTE_PATH.password),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className={styles.layout}>
      <Layout.Sider className={styles.sider} width={244} breakpoint="lg" collapsedWidth={0}>
        <div className={styles.logo}>
          <CalendarOutlined />
          <span>会议室预约</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Layout.Sider>
      <Layout className={styles.main}>
        <Layout.Header className={styles.header}>
          <div />
          <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
            <Space className={styles.userTrigger}>
              <Avatar src={userInfo?.headPicUrl || undefined} icon={<UserOutlined />} />
              <div className={styles.userText}>
                <strong>{userInfo?.nickName || userInfo?.username || '用户'}</strong>
                <span>{userInfo?.email || '未设置邮箱'}</span>
              </div>
            </Space>
          </Dropdown>
        </Layout.Header>
        <Layout.Content className={styles.content}>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
