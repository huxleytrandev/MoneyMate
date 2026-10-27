import { Button } from '@/components/atoms/Button';
import { Chip } from '@/components/atoms/Chip';
import { exactNumber } from '@/helpers/api';
import { dateKey } from '@/helpers/date';
import { formatMoney } from '@/helpers/money';
import { useFinance } from '@/hooks/useFinance';
import { fetchStatistics } from '@/services/finance.service';
import { colors } from '@/theme/colors';
import { ui } from '@/theme/layout';
import type { Statistics } from '@/types/api.types';
import type { FinanceState } from '@/types/finance.types';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
const periods = [
  { key: 'week', label: 'Tuần' },
  { key: 'month', label: 'Tháng' },
  { key: 'quarter', label: 'Quý' },
  { key: 'year', label: 'Năm' },
];
export function StatisticsPanel() {
  const { state } = useFinance();
  const [period, setPeriod] = useState('month');
  const [loaded, setLoaded] = useState<{
    source: FinanceState;
    period: string;
    retry: number;
    data: Statistics | null;
    error: string;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  const [width, setWidth] = useState(280);
  const loading =
    !loaded || loaded.source !== state || loaded.period !== period || loaded.retry !== retry;
  const data = loaded?.data ?? null;
  const error = loaded?.error ?? '';
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const end = new Date();
    const start = new Date(end);
    if (period === 'week') start.setDate(start.getDate() - 7 * 7);
    else if (period === 'year') start.setFullYear(start.getFullYear() - 2);
    else start.setMonth(start.getMonth() - (period === 'quarter' ? 21 : 11));
    fetchStatistics(dateKey(start), dateKey(end), period, controller.signal)
      .then((result) => {
        if (active) setLoaded({ source: state, period, retry, data: result, error: '' });
      })
      .catch((failure) => {
        if (active) setLoaded({ source: state, period, retry, data: null, error: failure.message });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [period, state, retry]);
  let values: number[] = [];
  let chartError = error;
  try {
    values = data?.series.map((plan) => exactNumber(plan.assets)) ?? [];
  } catch {
    chartError = 'Dữ liệu vượt giới hạn biểu đồ.';
  }
  const min = Math.min(0, ...values),
    max = Math.max(1, ...values);
  const chartY = (value: number) => 130 - ((value - min) / (max - min)) * 110;
  const chartX = (index: number) => 12 + ((width - 24) * index) / Math.max(values.length - 1, 1);
  return (
    <View
      style={ui.card}
      onLayout={(failure) => setWidth(Math.max(120, failure.nativeEvent.layout.width - 44))}
    >
      <Text style={ui.heading}>Biến động tài sản</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {periods.map((plan) => (
          <Chip
            key={plan.key}
            label={plan.label}
            selected={plan.key === period}
            onPress={() => setPeriod(plan.key)}
          />
        ))}
      </ScrollView>
      {loading ? (
        <ActivityIndicator color={colors.green} />
      ) : chartError ? (
        <>
          <Text style={ui.error}>{chartError}</Text>
          <Button
            title="Thử tải thống kê lại"
            variant="text"
            onPress={() => setRetry((value) => value + 1)}
          />
        </>
      ) : (
        <>
          <Text style={{ fontSize: 23, fontWeight: '700', color: colors.green }}>
            {values.length ? formatMoney(values.at(-1) ?? 0) : 'Chưa có dữ liệu'}
          </Text>
          <Svg
            width="100%"
            height={155}
            viewBox={'0 0 ' + width + ' 155'}
            accessibilityLabel="Biểu đồ tổng tài sản theo thời gian"
          >
            <Line x1={12} x2={width - 12} y1={chartY(0)} y2={chartY(0)} stroke={colors.border} />
            <Polyline
              points={values.map((value, index) => chartX(index) + ',' + chartY(value)).join(' ')}
              stroke={colors.green}
              strokeWidth={3}
              fill="none"
            />
            {values.map((value, index) => (
              <Circle key={index} cx={chartX(index)} cy={chartY(value)} r={3} fill={colors.green} />
            ))}
          </Svg>
          <View style={ui.row}>
            <Text style={{ fontSize: 10, color: colors.muted }}>{data?.series[0]?.key}</Text>
            <Text style={{ fontSize: 10, color: colors.muted }}>{data?.series.at(-1)?.key}</Text>
          </View>
          <Text style={ui.body}>
            {data?.growthPercent === null
              ? 'Chưa có tài sản tại mốc đầu để tính % tăng trưởng.'
              : 'Thay đổi từ đầu khoảng chọn: ' + data?.growthPercent + '%'}
          </Text>
          <Text style={{ fontSize: 11, lineHeight: 18, color: colors.muted }}>
            Số dư cuối kỳ tính cả thu chi, chuyển tiền và đối soát. Các thời điểm trước ngày bắt đầu
            tài sản có giá trị 0.
          </Text>
        </>
      )}
    </View>
  );
}
