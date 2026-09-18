export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PageParams {
  pageNo: number;
  pageSize: number;
}

export interface PageResult<T> {
  list: T[];
  total: number;
}

// OSS 上传结果：key 是入库用的对象标识（与访问地址解耦），url 仅供上传后立即预览
export interface UploadOssResult {
  key: string;
  url: string;
}
