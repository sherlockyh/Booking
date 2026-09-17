import { App as AntdApp } from 'antd';
import type { ReactNode } from 'react';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return <AntdApp>{children}</AntdApp>;
}
