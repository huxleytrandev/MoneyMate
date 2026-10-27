import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AssetEditor } from '@/components/organisms/AssetEditor';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { assetBalance } from '@/helpers/finance';
import { formatMoney } from '@/helpers/money';
import { useFinance } from '@/hooks/useFinance';
import { colors as c } from '@/theme/colors';
import { ui } from '@/theme/layout';
import type { Asset } from '@/types/finance.types';

const groups = [
  {
    type: 'cash',
    title: 'TIỀN MẶT',
    label: 'Tiền mặt',
    icon: 'cash-outline',
    color: '#0F766E',
    tint: '#E9F4EF',
  },
  {
    type: 'bank',
    title: 'TÀI KHOẢN NGÂN HÀNG',
    label: 'Ngân hàng',
    icon: 'business-outline',
    color: '#99B7AD',
    tint: '#F0F4F1',
  },
  {
    type: 'other',
    title: 'TÀI SẢN KHÁC',
    label: 'Khác',
    icon: 'diamond-outline',
    color: '#D7B88A',
    tint: '#FBF2E5',
  },
] as const;

export default function AssetsScreen() {
  const { state } = useFinance();
  const [editor, setEditor] = useState<{ asset?: Asset } | null>(null);
  const values = state.assets.map((asset) => ({ asset, balance: assetBalance(state, asset.id) }));
  const total = values.reduce((sum, item) => sum + item.balance, 0);
  const hasNegativeBalance = values.some((item) => item.balance < 0);
  const segments = groups.map((group) => ({
    ...group,
    balance: values
      .filter((item) => item.asset.type === group.type)
      .reduce((sum, item) => sum + item.balance, 0),
    chartValue: values
      .filter((item) => item.asset.type === group.type)
      .reduce((sum, item) => sum + Math.max(item.balance, 0), 0),
  }));
  const chartTotal = segments.reduce((sum, segment) => sum + segment.chartValue, 0);
  const circumference = 2 * Math.PI * 72;

  return (
    <ScreenTemplate>
      <View style={ui.row}>
        <View style={{ gap: 5 }}>
          <Text style={ui.title}>Tài sản</Text>
          <Text style={ui.body}>Mọi nguồn tiền, cùng một nơi.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Thêm tài sản"
          onPress={() => setEditor({})}
          style={s.add}
        >
          <Ionicons name="add" size={25} color="white" />
        </Pressable>
      </View>

      <View style={s.summary}>
        <Text style={s.eyebrow}>TỔNG TÀI SẢN HIỆN TẠI</Text>
        <Text adjustsFontSizeToFit numberOfLines={1} style={s.total}>
          {formatMoney(total)}
        </Text>
        <Text style={s.caption}>Đơn vị tiền tệ: VNĐ</Text>
        <View
          accessible
          accessibilityLabel="Phân bổ các số dư dương theo nhóm tài sản"
          style={s.chart}
        >
          <Svg width={178} height={178} viewBox="0 0 178 178">
            <Circle cx={89} cy={89} r={72} fill="none" stroke={c.border} strokeWidth={21} />
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
          <View pointerEvents="none" style={s.chartCenter}>
            <Ionicons name="wallet-outline" size={28} color={c.green} />
            <Text style={s.chartCount}>{state.assets.length} nguồn</Text>
          </View>
        </View>
        <View style={s.legend}>
          {segments.map((segment) => (
            <View key={segment.type} style={s.legendRow}>
              <View style={s.legendLabel}>
                <View style={[s.dot, { backgroundColor: segment.color }]} />
                <Text style={s.legendText}>{segment.label}</Text>
              </View>
              <Text style={s.legendValue}>{formatMoney(segment.balance)}</Text>
            </View>
          ))}
        </View>
        {hasNegativeBalance && (
          <Text style={s.caption}>
            Biểu đồ chỉ thể hiện số dư dương. Tổng tài sản vẫn bao gồm số dư âm.
          </Text>
        )}
      </View>

      {groups.map((group) => {
        const assets = values.filter((item) => item.asset.type === group.type);
        return (
          <View key={group.type} style={s.group}>
            <View style={ui.row}>
              <Text style={s.groupTitle}>{group.title}</Text>
              <Text style={s.count}>{assets.length} nguồn</Text>
            </View>
            {assets.length === 0 ? (
              <Text style={s.empty}>Chưa có {group.label.toLocaleLowerCase('vi')}.</Text>
            ) : (
              assets.map(({ asset, balance }) => (
                <Pressable
                  key={asset.id}
                  accessibilityRole="button"
                  accessibilityLabel={'Điều chỉnh tài sản ' + asset.name}
                  onPress={() => setEditor({ asset })}
                  style={({ pressed }) => [s.asset, pressed && { opacity: 0.7 }]}
                >
                  <View style={[s.assetIcon, { backgroundColor: group.tint }]}>
                    <Ionicons
                      name={group.icon}
                      size={22}
                      color={group.type === 'bank' ? c.green : group.color}
                    />
                  </View>
                  <View style={s.assetDetails}>
                    <Text style={s.assetName}>{asset.name}</Text>
                    <Text style={s.currency}>
                      {asset.type === 'other' ? 'Giá trị ước tính · VNĐ' : 'Số dư hiện tại · VNĐ'}
                    </Text>
                  </View>
                  <Text style={[s.assetAmount, balance < 0 && { color: c.expense }]}>
                    {formatMoney(balance)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={c.muted} />
                </Pressable>
              ))
            )}
          </View>
        );
      })}

      <View style={s.tip}>
        <Ionicons name="information-circle-outline" size={20} color={c.green} />
        <Text style={s.tipText}>
          Chạm một tài sản để đối soát với số dư thực tế. Khoản điều chỉnh không được tính thành thu
          nhập hoặc chi tiêu.
        </Text>
      </View>
      {editor && <AssetEditor asset={editor.asset} onClose={() => setEditor(null)} />}
    </ScreenTemplate>
  );
}

const s = StyleSheet.create({
  add: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: c.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    gap: 8,
  },
  eyebrow: { fontSize: 10, fontWeight: '600', letterSpacing: 1.5, color: c.muted },
  total: {
    color: c.ink,
    fontSize: 31,
    fontWeight: '700',
    letterSpacing: -1,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  caption: { color: c.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  chart: { width: 178, height: 178, marginVertical: 12 },
  chartCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 178,
    height: 178,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  chartCount: { color: c.muted, fontSize: 12, fontWeight: '500' },
  legend: { alignSelf: 'stretch', gap: 13, paddingTop: 5 },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  legendLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: c.muted },
  legendValue: { fontSize: 13, fontWeight: '600', color: c.ink },
  group: { gap: 11 },
  groupTitle: { color: c.muted, fontSize: 10, fontWeight: '600', letterSpacing: 1.1 },
  count: { color: c.muted, fontSize: 11 },
  asset: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 20,
    minHeight: 87,
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  assetIcon: {
    height: 44,
    width: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetDetails: { flex: 1, gap: 5 },
  assetName: { color: c.ink, fontSize: 13, fontWeight: '600' },
  currency: { color: c.muted, fontSize: 10 },
  assetAmount: { color: c.ink, fontSize: 13, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  empty: { fontSize: 12, color: c.muted, paddingVertical: 8 },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: c.softGreen,
    padding: 16,
    borderRadius: 16,
  },
  tipText: { flex: 1, color: c.green, fontSize: 11, lineHeight: 18 },
});
