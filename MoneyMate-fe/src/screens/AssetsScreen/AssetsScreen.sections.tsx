import { formatMoney } from '@/helpers/money';
import type { useAssetsScreen } from '@/hooks/useAssetsScreen';
import { styles } from '@/screens/AssetsScreen/AssetsScreen.styles';
import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
export function AssetsSummary({
  total,
  segments,
  chartTotal,
  circumference,
  state,
  hasNegativeBalance,
}: Pick<
  ReturnType<typeof useAssetsScreen>,
  'total' | 'segments' | 'chartTotal' | 'circumference' | 'state' | 'hasNegativeBalance'
>) {
  return (
    <View style={styles.summary}>
      <Text style={styles.eyebrow}>TỔNG TÀI SẢN HIỆN TẠI</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.total}>
        {formatMoney(total)}
      </Text>
      <Text style={styles.caption}>Đơn vị tiền tệ: VNĐ</Text>
      <View
        accessible
        accessibilityLabel="Phân bổ các số dư dương theo nhóm tài sản"
        style={styles.chart}
      >
        <Svg width={178} height={178} viewBox="0 0 178 178">
          <Circle cx={89} cy={89} r={72} fill="none" stroke={colors.border} strokeWidth={21} />
          {segments.map((segment, index) => {
            const length = chartTotal > 0 ? (segment.chartValue / chartTotal) * circumference : 0;
            const start =
              chartTotal > 0
                ? (segments
                    .slice(0, index)
                    .reduce((sum, previous) => sum + previous.chartValue, 0) /
                    chartTotal) *
                  circumference
                : 0;
            return length > 0 ? (
              <Circle
                key={segment.type}
                cx={89}
                cy={89}
                r={72}
                fill="none"
                stroke={segment.color}
                strokeWidth={21}
                strokeDasharray={[length, circumference - length]}
                strokeDashoffset={-start}
                rotation={-90}
                origin="89, 89"
              />
            ) : null;
          })}
        </Svg>
        <View pointerEvents="none" style={styles.chartCenter}>
          <Ionicons name="wallet-outline" size={28} color={colors.green} />
          <Text style={styles.chartCount}>{state.assets.length} nguồn</Text>
        </View>
      </View>
      <View style={styles.legend}>
        {segments.map((segment) => (
          <View key={segment.type} style={styles.legendRow}>
            <View style={styles.legendLabel}>
              <View style={[styles.dot, { backgroundColor: segment.color }]} />
              <Text style={styles.legendText}>{segment.label}</Text>
            </View>
            <Text style={styles.legendValue}>{formatMoney(segment.balance)}</Text>
          </View>
        ))}
      </View>
      {hasNegativeBalance && (
        <Text style={styles.caption}>
          Biểu đồ chỉ thể hiện số dư dương. Tổng tài sản vẫn bao gồm số dư âm.
        </Text>
      )}
    </View>
  );
}
