import type { ReactNode } from 'react';
import styles from './styles/index.module.less';

interface PageHeaderProps {
  title: string;
  description?: string;
  extra?: ReactNode;
}

export function PageHeader({ title, description, extra }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {extra ? <div className={styles.extra}>{extra}</div> : null}
    </div>
  );
}
