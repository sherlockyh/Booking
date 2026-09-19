import {
  CalendarOutlined,
  IdcardOutlined,
  KeyOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Dropdown, Layout, Menu, Space } from 'antd';
import type { MenuProps } from 'antd';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ROUTE_PATH } from '@/shared/constants/route';
import { getAccessToken, type SessionScope } from '@/shared/utils/token';
import type { UserInfo } from '@/modules/user/types';

// vite 的 css module 类型是索引签名（CSSModuleClasses），
// 这里沿用 Record 形式，AppShell 内部固定使用以下类名：
// layout / sider / logo / main / header / userTrigger / userText / content
type AppShellStyles = Record<string, string>;

interface AppShellProps {
  scope: SessionScope;
  logoText: string;
  menuItems: MenuProps['items'];
  profilePath: string;
  passwordPath: string;
  loginPath: string;
  fallbackName: string;
  fallbackEmail: string;
  clearSession: () => void;
  useUserInfo: () => UserInfo | null;
  styles: AppShellStyles;
}

// user / admin 两端共用的后台骨架：侧边菜单 + 顶栏用户下拉 + 内容出口。
// 两侧仅菜单项、主题样式（css module 传入）与会话 scope 不同
export function AppShell({
  scope,
  logoText,
  menuItems,
  profilePath,
  passwordPath,
  loginPath,
  fallbackName,
  fallbackEmail,
  clearSession,
  useUserInfo,
  styles,
}: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const userInfo = useUserInfo();
  const hasToken = Boolean(getAccessToken(scope));

  // 同步守卫：未登录直接重定向，避免先渲染再跳转的闪烁
  if (!hasToken) {
    return <Navigate to={loginPath} replace />;
  }

  const handleLogout = () => {
    clearSession();
    navigate(loginPath, { replace: true });
  };

  const dropdownItems: MenuProps['items'] = [
    {
      key: profilePath,
      icon: <IdcardOutlined />,
      label: '个人信息',
      onClick: () => navigate(profilePath),
    },
    {
      key: passwordPath,
      icon: <KeyOutlined />,
      label: '修改密码',
      onClick: () => navigate(passwordPath),
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
      <Layout.Sider
        className={styles.sider}
        width={244}
        breakpoint="lg"
        collapsedWidth={0}
      >
        <div className={styles.logo}>
          <CalendarOutlined />
          <span>{logoText}</span>
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
              <Avatar
                src={userInfo?.headPicUrl || undefined}
                icon={<UserOutlined />}
              />
              <div className={styles.userText}>
                <strong>
                  {userInfo?.nickName || userInfo?.username || fallbackName}
                </strong>
                <span>{userInfo?.email || fallbackEmail}</span>
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
