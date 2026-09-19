import dayjs from 'dayjs';

/**
 * 把时间戳/日期字符串格式化为 "YYYY-MM-DD HH:mm:ss"，空值或非法值显示 "-"
 */
export function formatDateTime(value?: string | number) {
  if (!value) {
    return '-';
  }

  const time = dayjs(value);
  return time.isValid() ? time.format('YYYY-MM-DD HH:mm:ss') : '-';
}
