import { UploadOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Space, Upload, message, type UploadProps } from 'antd';
import { useState } from 'react';
import { uploadUserFile } from '@/modules/user/api';
import type { UploadOssResult } from '@/shared/api/types';
import { resolveFileUrl } from '@/shared/utils/file';
import styles from './styles/index.module.less';

interface ImageUploadProps {
  /** 表单里保存的头像标识：新数据是 OSS Key（avatars/xxx.png），历史数据可能是完整 URL */
  value?: string;
  onChange?: (value?: string) => void;
  /** 后端为当前 value 拼好的可访问 URL（用户信息接口返回的 headPicUrl） */
  valueUrl?: string;
  buttonText?: string;
  description?: string;
  uploadFile?: (file: File) => Promise<UploadOssResult>;
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
  valueUrl,
  buttonText = '上传图片',
  description = '支持 png、jpg、gif 格式',
  uploadFile = uploadUserFile,
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  // 本会话最近一次上传结果：表单里 value 已变成新 key、但用户信息还没重新拉取时，用它预览
  const [lastUpload, setLastUpload] = useState<UploadOssResult>();

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
      // key 回填表单（将来随资料保存入库），url 只用于上传后立即预览
      const result = await uploadFile(file as File);
      setLastUpload(result);
      onChange?.(result.key);
      onSuccess?.(result.url, file as File);
      message.success('上传成功');
    } catch (error) {
      onError?.(error as Error);
      message.error('上传失败');
    } finally {
      setLoading(false);
    }
  };

  // 预览优先级：刚上传的新图 > 后端为已有头像拼好的 URL > 历史遗留值的兜底解析
  const previewSrc =
    lastUpload && lastUpload.key === value
      ? lastUpload.url
      : valueUrl || resolveFileUrl(value) || undefined;

  return (
    <Space className={styles.upload} align="start" size={16}>
      <Avatar className={styles.avatar} size={72} src={previewSrc} icon={<UserOutlined />} />
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
