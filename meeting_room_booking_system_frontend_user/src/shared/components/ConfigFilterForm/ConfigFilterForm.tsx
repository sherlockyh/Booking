import { Button, DatePicker, Form, Input } from 'antd';
import { useMemo, type ReactNode } from 'react';
import styles from './styles/index.module.less';

export interface ConfigFilterField<T> {
  key: keyof T & string;
  label: string;
  placeholder?: string;
  span?: number;
  prefix?: ReactNode;
  /** 默认为 input，设为 dateRange 时使用日期范围选择器 */
  type?: 'input' | 'dateRange';
}

interface ConfigFilterFormProps<T extends object> {
  fields: ConfigFilterField<T>[];
  initialValues: Partial<T>;
  loading?: boolean;
  onSearch: (values: T) => void;
}

export function ConfigFilterForm<T extends object>({
  fields,
  initialValues,
  loading,
  onSearch,
}: ConfigFilterFormProps<T>) {
  const [form] = Form.useForm();

  const formInitialValues = useMemo(() => {
    const result: Record<string, unknown> = { ...initialValues };
    for (const field of fields) {
      if (field.type === 'dateRange') {
        const val = result[field.key];
        if (val === '' || val === undefined) {
          result[field.key] = null;
        }
      }
    }
    return result;
  }, [fields, initialValues]);

  const handleFinish = (values: unknown) => {
    onSearch(values as T);
  };

  const handleReset = () => {
    form.resetFields();
    form.setFieldsValue(initialValues);
    onSearch(initialValues as T);
  };

  return (
    <div className={styles.formWrap}>
      <Form form={form} layout="vertical" initialValues={formInitialValues} onFinish={handleFinish}>
        <div className={styles.formLayout}>
          <div className={styles.fields}>
          {fields.map((field) => {
            const isDateRange = field.type === 'dateRange';
            return (
              <div
                key={field.key}
                className={`${styles.field} ${isDateRange ? styles.dateRangeField : ''}`}
              >
                <Form.Item name={field.key as any} label={field.label}>
                  {isDateRange ? (
                    <DatePicker.RangePicker showTime style={{ width: '100%' }} />
                  ) : (
                    <Input prefix={field.prefix} placeholder={field.placeholder || `请输入${field.label}`} allowClear />
                  )}
                </Form.Item>
              </div>
            );
          })}
          </div>

          <div className={styles.actions}>
            <Button onClick={handleReset}>重置</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              查询
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}
