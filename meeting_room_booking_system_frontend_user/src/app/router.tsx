import { Suspense, lazy, type ReactNode } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';
import { Spin } from 'antd';
import { AuthLayout } from '@/layouts/AuthLayout/AuthLayout';
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout';
import { UserLayout } from '@/layouts/UserLayout/UserLayout';
import { ROUTE_PATH } from '@/shared/constants/route';

// 页面组件全部懒加载：登录页之外的页面不打进首屏 bundle
const AdminLoginPage = lazy(() =>
  import('@/modules/admin/login/AdminLoginPage').then((m) => ({
    default: m.AdminLoginPage,
  })),
);
const AdminPasswordPage = lazy(() =>
  import('@/modules/admin/password/AdminPasswordPage').then((m) => ({
    default: m.AdminPasswordPage,
  })),
);
const AdminProfilePage = lazy(() =>
  import('@/modules/admin/profile/AdminProfilePage').then((m) => ({
    default: m.AdminProfilePage,
  })),
);
const UserListPage = lazy(() =>
  import('@/modules/admin/users/UserListPage').then((m) => ({
    default: m.UserListPage,
  })),
);
const RoleListPage = lazy(() =>
  import('@/modules/admin/roles/RoleListPage').then((m) => ({
    default: m.RoleListPage,
  })),
);
const MeetingRoomListPage = lazy(() =>
  import('@/modules/admin/meetingRooms/MeetingRoomListPage').then((m) => ({
    default: m.MeetingRoomListPage,
  })),
);
const BookingListPage = lazy(() =>
  import('@/modules/admin/bookings/BookingListPage').then((m) => ({
    default: m.BookingListPage,
  })),
);
const AdminStatisticsPage = lazy(() =>
  import('@/modules/admin/statistics/AdminStatisticsPage').then((m) => ({
    default: m.AdminStatisticsPage,
  })),
);
const UserMeetingRoomListPage = lazy(() =>
  import('@/modules/user/meetingRooms/UserMeetingRoomListPage').then((m) => ({
    default: m.UserMeetingRoomListPage,
  })),
);
const UserBookingListPage = lazy(() =>
  import('@/modules/user/bookings/UserBookingListPage').then((m) => ({
    default: m.UserBookingListPage,
  })),
);
const UserStatisticsPage = lazy(() =>
  import('@/modules/user/statistics/UserStatisticsPage').then((m) => ({
    default: m.UserStatisticsPage,
  })),
);
const LoginPage = lazy(() =>
  import('@/modules/user/auth/login/LoginPage').then((m) => ({
    default: m.LoginPage,
  })),
);
const RegisterPage = lazy(() =>
  import('@/modules/user/auth/register/RegisterPage').then((m) => ({
    default: m.RegisterPage,
  })),
);
const ProfilePage = lazy(() =>
  import('@/modules/user/profile/ProfilePage').then((m) => ({
    default: m.ProfilePage,
  })),
);
const PasswordPage = lazy(() =>
  import('@/modules/user/password/PasswordPage').then((m) => ({
    default: m.PasswordPage,
  })),
);

// 懒加载页面的统一 loading 占位
function LazyFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 120 }}>
      <Spin size="large" />
    </div>
  );
}

function page(element: ReactNode) {
  return <Suspense fallback={<LazyFallback />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to={ROUTE_PATH.login} replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: ROUTE_PATH.login,
        element: page(<LoginPage />),
      },
      {
        path: ROUTE_PATH.register,
        element: page(<RegisterPage />),
      },
    ],
  },
  {
    path: ROUTE_PATH.adminLogin,
    element: page(<AdminLoginPage />),
  },
  {
    element: <AdminLayout />,
    children: [
      {
        path: ROUTE_PATH.adminUsers,
        element: page(<UserListPage />),
      },
      {
        path: ROUTE_PATH.adminRoles,
        element: page(<RoleListPage />),
      },
      {
        path: ROUTE_PATH.adminMeetingRooms,
        element: page(<MeetingRoomListPage />),
      },
      {
        path: ROUTE_PATH.adminBookings,
        element: page(<BookingListPage />),
      },
      {
        path: ROUTE_PATH.adminStatistics,
        element: page(<AdminStatisticsPage />),
      },
      {
        path: ROUTE_PATH.adminProfile,
        element: page(<AdminProfilePage />),
      },
      {
        path: ROUTE_PATH.adminPassword,
        element: page(<AdminPasswordPage />),
      },
    ],
  },
  {
    path: '/admin',
    element: <Navigate to={ROUTE_PATH.adminUsers} replace />,
  },
  {
    element: <UserLayout />,
    children: [
      {
        path: ROUTE_PATH.meetingRooms,
        element: page(<UserMeetingRoomListPage />),
      },
      {
        path: ROUTE_PATH.bookings,
        element: page(<UserBookingListPage />),
      },
      {
        path: ROUTE_PATH.statistics,
        element: page(<UserStatisticsPage />),
      },
      {
        path: ROUTE_PATH.profile,
        element: page(<ProfilePage />),
      },
      {
        path: ROUTE_PATH.password,
        element: page(<PasswordPage />),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to={ROUTE_PATH.login} replace />,
  },
]);
