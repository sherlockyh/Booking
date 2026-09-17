import { UploadOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Space, Upload, message, type UploadProps } from 'antd';
import { useState } from 'react';
import { uploadUserFile } from '@/modules/user/api';
import { resolveFileUrl } from '@/shared/utils/file';
import styles from './styles/index.module.less';

interface ImageUploadProps {
  value?: string;
  onChange?: (value?: string) => void;
  buttonText?: string;
  description?: string;
  uploadFile?: (file: File) => Promise<string>;
}

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.gif'];

function getFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf('.');

  if (dotIndex < 0) {
    return '';
  }

  return fileName.slice(dotIndex).toLowerCase();
}

export function ImageUpload({
  value,
  onChange,
  buttonText = '上传图片',
  description = '支持 png、jpg、gif 格式',
  uploadFile = uploadUserFile,
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false);

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const extension = getFileExtension(file.name);

    if (!IMAGE_EXTENSIONS.includes(extension)) {
      message.error('只能上传 png、jpg、gif 图片');
      return Upload.LIST_IGNORE;
    }

    return true;
  };

  const handleUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    setLoading(true);

    try {
      const result = await uploadFile(file as File);
      onChange?.(result);
      onSuccess?.(result, file as File);
      message.success('上传成功');
    } catch (error) {
      onError?.(error as Error);
      message.error('上传失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space className={styles.upload} align="start" size={16}>
      <Avatar className={styles.avatar} size={72} src={resolveFileUrl(value) || undefined} icon={<UserOutlined />} />
      <div className={styles.content}>
        <Upload
          accept=".png,.jpg,.gif"
          showUploadList={false}
          beforeUpload={beforeUpload}
          customRequest={handleUpload}
        >
          <Button icon={<UploadOutlined />} loading={loading}>
            {buttonText}
          </Button>
        </Upload>
        <span className={styles.description}>{description}</span>
      </div>
    </Space>
  );
}
