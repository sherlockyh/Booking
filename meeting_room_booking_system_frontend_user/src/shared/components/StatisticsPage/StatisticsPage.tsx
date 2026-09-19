import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, DatePicker, Space, Spin, App as AntdApp } from 'antd';
import { EnvironmentOutlined, ReloadOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons';
// echarts 按需注册：只引入柱状图 + 网格/提示组件 + Canvas 渲染器，减小 bundle
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsCoreOption, EChartsType } from 'echarts/core';
import dayjs from 'dayjs';
import type { UserBookingCountItem, MeetingRoomUsedCountItem } from '@/modules/admin/types';
import { PageHeader } from '@/shared/components/PageHeader/PageHeader';
import styles from './styles/index.module.less';

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

const { RangePicker } = DatePicker;

interface StatisticsPageProps {
  title: string;
  description: string;
  fetchUserBookingCount: (params: { startTime: string; endTime: string }) => Promise<UserBookingCountItem[]>;
  fetchMeetingRoomUsedCount: (params: { startTime: string; endTime: string }) => Promise<MeetingRoomUsedCountItem[]>;
}

function useChart(option: EChartsCoreOption | null) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsType | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !option) return;

    const chart = chartRef.current || echarts.init(container);
    chartRef.current = chart;
    const handleResize = () => chart.resize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);
    chart.setOption(option, true);
    requestAnimationFrame(() => chart.resize());

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      chart.dispose();
      chartRef.current = null;
    };
  }, [option]);

  return containerRef;
}

export function StatisticsPage({
  title,
  description,
  fetchUserBookingCount,
  fetchMeetingRoomUsedCount,
}: StatisticsPageProps) {
  const { message } = AntdApp.useApp();

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [loading, setLoading] = useState(false);
  const [userBookingData, setUserBookingData] = useState<UserBookingCountItem[]>([]);
  const [roomUsedData, setRoomUsedData] = useState<MeetingRoomUsedCountItem[]>([]);

  const fetchData = useCallback(async () => {
    if (!dateRange[0] || !dateRange[1]) return;

    setLoading(true);
    try {
      const startTime = dateRange[0].format('YYYY-MM-DD HH:mm:ss');
      const endTime = dateRange[1].format('YYYY-MM-DD HH:mm:ss');

      const [userResult, roomResult] = await Promise.all([
        fetchUserBookingCount({ startTime, endTime }),
        fetchMeetingRoomUsedCount({ startTime, endTime }),
      ]);

      setUserBookingData(userResult || []);
      setRoomUsedData(roomResult || []);
    } catch {
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  }, [dateRange, message, fetchUserBookingCount, fetchMeetingRoomUsedCount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const userChartOption: EChartsCoreOption | null =
    userBookingData.length > 0
      ? {
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
          xAxis: {
            type: 'category',
            data: userBookingData.map((item) => item.username),
            axisLabel: { rotate: 30, interval: 0, color: '#64748b' },
            axisLine: { lineStyle: { color: '#e5e7eb' } },
          },
          yAxis: {
            type: 'value',
            name: '预定次数',
            nameTextStyle: { color: '#94a3b8' },
            axisLabel: { color: '#94a3b8' },
            splitLine: { lineStyle: { color: '#eef2f7' } },
          },
          series: [
            {
              name: '预定次数',
              type: 'bar',
              data: userBookingData.map((item) => Number(item.bookingCount)),
              barMaxWidth: 32,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#4d8bfd' },
                  { offset: 1, color: '#2f6fed' },
                ]),
                borderRadius: [6, 6, 0, 0],
              },
            },
          ],
        }
      : null;

  const roomChartOption: EChartsCoreOption | null =
    roomUsedData.length > 0
      ? {
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
          xAxis: {
            type: 'category',
            data: roomUsedData.map((item) => item.meetingRoomName),
            axisLabel: { rotate: 30, interval: 0, color: '#64748b' },
            axisLine: { lineStyle: { color: '#e5e7eb' } },
          },
          yAxis: {
            type: 'value',
            name: '使用次数',
            nameTextStyle: { color: '#94a3b8' },
            axisLabel: { color: '#94a3b8' },
            splitLine: { lineStyle: { color: '#eef2f7' } },
          },
          series: [
            {
              name: '使用次数',
              type: 'bar',
              data: roomUsedData.map((item) => Number(item.usedCount)),
              barMaxWidth: 32,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#34b58c' },
                  { offset: 1, color: '#0f9f6e' },
                ]),
                borderRadius: [6, 6, 0, 0],
              },
            },
          ],
        }
      : null;

  const userChartRef = useChart(userChartOption);
  const roomChartRef = useChart(roomChartOption);

  return (
    <div className={styles.page}>
      <PageHeader title={title} description={description} />

      <div className={styles.filterBar}>
        <div className={styles.filterTitle}>
          <span className={styles.filterDot} />
          时间范围
        </div>
        <Space size={12}>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0], dates[1]]);
              }
            }}
            allowClear={false}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchData()} loading={loading}>
            查询
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setDateRange([dayjs().subtract(30, 'day'), dayjs()]);
            }}
          >
            重置
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <div className={styles.chartsGrid}>
          <section className={styles.chartCard}>
            <header className={styles.chartHeader}>
              <span className={`${styles.cardIcon} ${styles.userIcon}`}>
                <TeamOutlined />
              </span>
              <div>
                <h3>用户预定次数</h3>
                <p>按用户汇总规定时间内的预定总量</p>
              </div>
            </header>
            <div className={styles.chartBody}>
              {userBookingData.length === 0 && !loading ? (
                <div className={styles.empty}>暂无用户预定统计数据</div>
              ) : (
                <div ref={userChartRef} className={styles.chart} />
              )}
            </div>
          </section>

          <section className={styles.chartCard}>
            <header className={styles.chartHeader}>
              <span className={`${styles.cardIcon} ${styles.roomIcon}`}>
                <EnvironmentOutlined />
              </span>
              <div>
                <h3>会议室使用次数</h3>
                <p>按会议室汇总规定时间内的使用次数</p>
              </div>
            </header>
            <div className={styles.chartBody}>
              {roomUsedData.length === 0 && !loading ? (
                <div className={styles.empty}>暂无会议室使用统计数据</div>
              ) : (
                <div ref={roomChartRef} className={styles.chart} />
              )}
            </div>
          </section>
        </div>
      </Spin>
    </div>
  );
}
