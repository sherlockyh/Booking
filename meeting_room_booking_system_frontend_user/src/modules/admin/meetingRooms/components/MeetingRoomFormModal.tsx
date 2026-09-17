import { useEffect } from 'react';
import { Form, Input, InputNumber, Modal, App as AntdApp } from 'antd';
import { createMeetingRoom, updateMeetingRoom } from '@/modules/admin/api';
import type {
  CreateMeetingRoomParams,
  MeetingRoomItem,
  UpdateMeetingRoomParams,
} from '@/modules/admin/types';
import { useRequest } from '@/shared/hooks/useRequest';

interface MeetingRoomFormModalProps {
  open: boolean;
  record: MeetingRoomItem | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export function MeetingRoomFormModal({
  open,
  record,
  onCancel,
  onSuccess,
}: MeetingRoomFormModalProps) {
  const [form] = Form.useForm<CreateMeetingRoomParams>();
  const { message } = AntdApp.useApp();

  const createRequest = useRequest(createMeetingRoom, {
    onSuccess: () => {
      message.success('创建成功');
      onSuccess();
    },
  });

  const updateRequest = useRequest(updateMeetingRoom as (params: UpdateMeetingRoomParams) => Promise<string>, {
    onSuccess: () => {
      message.success('更新成功');
      onSuccess();
    },
  });

  const isEdit = Boolean(record);
  const loading = createRequest.loading || updateRequest.loading;

  useEffect(() => {
    if (open) {
      if (record) {
        form.setFieldsValue({
          name: record.name,
          capacity: record.capacity,
          location: record.location,
          equipment: record.equipment,
          description: record.description,
        });
      } else {
        form.resetFields();
      }
    }
  }, [form, open, record]);

  const handleOk = () => {
    form.submit();
  };

  const handleFinish = (values: CreateMeetingRoomParams) => {
    if (isEdit && record) {
      void updateRequest.run({ ...values, id: record.id } as UpdateMeetingRoomParams);
    } else {
      void createRequest.run(values);
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑会议室' : '新增会议室'}
      open={open}
      confirmLoading={loading}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form<CreateMeetingRoomParams>
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ capacity: 10 }}
      >
        <Form.Item
          name="name"
          label="会议室名称"
          rules={[
            { required: true, message: '请输入会议室名称' },
            { max: 10, message: '会议室名称最长为 10 字符' },
          ]}
        >
          <Input placeholder="请输入会议室名称" />
        </Form.Item>
        <Form.Item
          name="capacity"
          label="容量"
          rules={[{ required: true, message: '请输入容量' }]}
        >
          <InputNumber min={1} max={999} style={{ width: '100%' }} placeholder="请输入容量" />
        </Form.Item>
        <Form.Item
          name="location"
          label="位置"
          rules={[
            { required: true, message: '请输入位置' },
            { max: 50, message: '位置最长为 50 字符' },
          ]}
        >
          <Input placeholder="请输入位置" />
        </Form.Item>
        <Form.Item
          name="equipment"
          label="设备"
          rules={[
            { required: true, message: '请输入设备' },
            { max: 50, message: '设备最长为 50 字符' },
          ]}
        >
          <Input placeholder="请输入设备" />
        </Form.Item>
        <Form.Item
          name="description"
          label="描述"
          rules={[
            { required: true, message: '请输入描述' },
            { max: 100, message: '描述最长为 100 字符' },
          ]}
        >
          <Input.TextArea rows={3} placeholder="请输入描述" />
        </Form.Item>
      </Form>
    </Modal>
  );
}