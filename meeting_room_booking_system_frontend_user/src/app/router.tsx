import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout/AuthLayout';
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout';
import { UserLayout } from '@/layouts/UserLayout/UserLayout';
import { AdminLoginPage } from '@/modules/admin/login/AdminLoginPage';
import { AdminPasswordPage } from '@/modules/admin/password/AdminPasswordPage';
import { AdminProfilePage } from '@/modules/admin/profile/AdminProfilePage';
import { UserListPage } from '@/modules/admin/users/UserListPage';
import { MeetingRoomListPage } from '@/modules/admin/meetingRooms/MeetingRoomListPage';
import { BookingListPage } from '@/modules/admin/bookings/BookingListPage';
import { AdminStatisticsPage } from '@/modules/admin/statistics/AdminStatisticsPage';
import { UserMeetingRoomListPage } from '@/modules/user/meetingRooms/UserMeetingRoomListPage';
import { UserBookingListPage } from '@/modules/user/bookings/UserBookingListPage';
import { UserStatisticsPage } from '@/modules/user/statistics/UserStatisticsPage';
import { LoginPage } from '@/modules/user/auth/login/LoginPage';
import { RegisterPage } from '@/modules/user/auth/register/RegisterPage';
import { ProfilePage } from '@/modules/user/profile/ProfilePage';
import { PasswordPage } from '@/modules/user/password/PasswordPage';
import { ROUTE_PATH } from '@/shared/constants/route';

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
        element: <LoginPage />,
      },
      {
        path: ROUTE_PATH.register,
        element: <RegisterPage />,
      },
    ],
  },
  {
    path: ROUTE_PATH.adminLogin,
    element: <AdminLoginPage />,
  },
  {
    element: <AdminLayout />,
    children: [
      {
        path: ROUTE_PATH.adminUsers,
        element: <UserListPage />,
      },
      {
        path: ROUTE_PATH.adminMeetingRooms,
        element: <MeetingRoomListPage />,
      },
      {
        path: ROUTE_PATH.adminBookings,
        element: <BookingListPage />,
      },
      {
        path: ROUTE_PATH.adminStatistics,
        element: <AdminStatisticsPage />,
      },
      {
        path: ROUTE_PATH.adminProfile,
        element: <AdminProfilePage />,
      },
      {
        path: ROUTE_PATH.adminPassword,
        element: <AdminPasswordPage />,
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
        element: <UserMeetingRoomListPage />,
      },
      {
        path: ROUTE_PATH.bookings,
        element: <UserBookingListPage />,
      },
      {
        path: ROUTE_PATH.statistics,
        element: <UserStatisticsPage />,
      },
      {
        path: ROUTE_PATH.profile,
        element: <ProfilePage />,
      },
      {
        path: ROUTE_PATH.password,
        element: <PasswordPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to={ROUTE_PATH.login} replace />,
  },
]);
