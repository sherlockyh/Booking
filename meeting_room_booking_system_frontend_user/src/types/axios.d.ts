declare module "axios" {
  export interface AxiosRequestConfig {
    baseURL?: string;
    timeout?: number;
    url?: string;
    method?: string;
    params?: Record<string, unknown>;
    data?: unknown;
    headers?: Record<string, any>;
  }

  export interface AxiosResponse<T = unknown> {
    data: T;
    status: number;
    config: AxiosRequestConfig;
  }

  export interface AxiosError<T = unknown> extends Error {
    config?: AxiosRequestConfig;
    response?: AxiosResponse<T>;
  }

  export interface AxiosInterceptorManager<T> {
    use(
      onFulfilled?: (value: T) => any,
      onRejected?: (error: any) => any,
    ): number;
  }

  export interface AxiosInstance {
    interceptors: {
      request: AxiosInterceptorManager<AxiosRequestConfig>;
      response: AxiosInterceptorManager<AxiosResponse>;
    };
    get<T = unknown>(
      url: string,
      config?: AxiosRequestConfig,
    ): Promise<AxiosResponse<T>>;
    post<T = unknown, D = unknown>(
      url: string,
      data?: D,
      config?: AxiosRequestConfig,
    ): Promise<AxiosResponse<T>>;
    put<T = unknown, D = unknown>(
      url: string,
      data?: D,
      config?: AxiosRequestConfig,
    ): Promise<AxiosResponse<T>>;
    delete<T = unknown>(
      url: string,
      config?: AxiosRequestConfig,
    ): Promise<AxiosResponse<T>>;
    request<T = unknown>(config: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  }

  export interface AxiosStatic extends AxiosInstance {
    create(config?: AxiosRequestConfig): AxiosInstance;
  }

  const axios: AxiosStatic;
  export default axios;
}
