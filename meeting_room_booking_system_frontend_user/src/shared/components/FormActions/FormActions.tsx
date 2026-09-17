import { Button, Space } from 'antd';
import type { ReactNode } from 'react';
import styles from './styles/index.module.less';

interface FormActionsProps {
  submitText: string;
  loading?: boolean;
  extra?: ReactNode;
}

export function FormActions({ submitText, loading, extra }: FormActionsProps) {
  return (
    <div className={styles.actions}>
      <Button type="primary" htmlType="submit" loading={loading} block size="large">
        {submitText}
      </Button>
      {extra ? <Space className={styles.extra}>{extra}</Space> : null}
    </div>
  );
}
