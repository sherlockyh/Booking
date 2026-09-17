import { Table } from 'antd';
import Style from './styles/index.module.less';
import type { Key } from 'react';
import type { ColumnsType, TableProps } from 'antd/es/table';

interface ConfigTablePagination {
  pageNo: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
}

interface ConfigTableProps<T> {
  columns: ColumnsType<T>;
  dataSource: T[];
  loading?: boolean;
  pagination: ConfigTablePagination;
  rowKey: TableProps<T>['rowKey'];
}

export function ConfigTable<T extends object>({
  columns,
  dataSource,
  loading,
  pagination,
  rowKey,
}: ConfigTableProps<T>) {
  return (
    <div className={Style['config-table']}>
      <Table<T>
      rowKey={rowKey as string | ((record: T) => Key)}
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      scroll={{ x: 'max-content' }}
      pagination={{
        current: pagination.pageNo,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        onChange: pagination.onChange,
        showTotal: (total) => `共 ${total} 条`,
      }}
    />
    </div>
    
  );
}
