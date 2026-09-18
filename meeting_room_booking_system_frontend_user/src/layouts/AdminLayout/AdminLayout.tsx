import {
  BarChartOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  KeyOutlined,
  LogoutOutlined,
  ScheduleOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Dropdown, Layout, Menu, Space } from 'antd';
import type { MenuProps } from 'antd';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { clearAdminSession, useAdminStore } from '@/modules/admin/store';
import { ROUTE_PATH } from '@/shared/constants/route';
import { getAccessToken } from '@/shared/utils/token';
import styles from './styles/index.module.less';

const menuItems = [
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

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const userInfo = useAdminStore((state) => state.userInfo);
  const hasAdminToken = Boolean(getAccessToken('admin'));

  if (!hasAdminToken) {
    return <Navigate to={ROUTE_PATH.adminLogin} replace />;
  }

  const handleLogout = () => {
    clearAdminSession();
    navigate(ROUTE_PATH.adminLogin, { replace: true });
  };

  const dropdownItems: MenuProps['items'] = [
    {
      key: ROUTE_PATH.adminProfile,
      icon: <IdcardOutlined />,
      label: '个人信息',
      onClick: () => navigate(ROUTE_PATH.adminProfile),
    },
    {
      key: ROUTE_PATH.adminPassword,
      icon: <KeyOutlined />,
      label: '修改密码',
      onClick: () => navigate(ROUTE_PATH.adminPassword),
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
          <span>预约后台</span>
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
                <strong>{userInfo?.nickName || userInfo?.username || '管理员'}</strong>
                <span>{userInfo?.email || '后台管理账号'}</span>
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
