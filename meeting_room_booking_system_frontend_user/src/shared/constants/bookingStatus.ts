// 预订状态 -> antd Tag 展示配置，与后端 BookingStatus 枚举的中文值保持一致
export const BOOKING_STATUS_CONFIG: Record<
  string,
  { color: string; text: string }
> = {
  申请中: { color: 'processing', text: '申请中' },
  审批通过: { color: 'success', text: '审批通过' },
  审批驳回: { color: 'error', text: '审批驳回' },
  已解除: { color: 'default', text: '已解除' },
};
