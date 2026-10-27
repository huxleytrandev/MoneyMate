import { formatMoney } from '@/helpers/money';
import type { useDashboardScreen } from '@/hooks/useDashboardScreen';
import { styles } from '@/screens/DashboardScreen/DashboardScreen.styles';
import { colors } from '@/theme/colors';
import { ui } from '@/theme/layout';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, Text, View } from 'react-native';
export function DashboardAssetTotal({
  total,
  balances,
  groups,
}: Pick<ReturnType<typeof useDashboardScreen>, 'total' | 'balances' | 'groups'>) {
  return (
    <View style={styles.hero}>
      <Text style={{ color: '#CEE9E3', fontSize: 14 }}>Tổng tài sản</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.total}>
        {formatMoney(total)}
      </Text>
      {total > 0 && balances.every((asset) => asset.balance >= 0) && (
        <View style={styles.stack}>
          {groups.map((group) => (
            <View
              key={group.type}
              style={{
                flex:
                  balances
                    .filter((asset) => asset.type === group.type)
                    .reduce((sum, asset) => sum + asset.balance, 0) / total,
                backgroundColor: group.color,
              }}
            />
          ))}
        </View>
      )}
      <View style={styles.legend}>
        {groups.map((group) => (
          <View style={styles.legendItem} key={group.type}>
            <View style={[styles.dot, { backgroundColor: group.color }]} />
            <Text style={styles.legendText}>{group.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function DashboardAssetAccounts({
  balances,
  onAssets,
}: Pick<ReturnType<typeof useDashboardScreen>, 'balances' | 'onAssets'>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 14 }}
    >
      {balances.map((assetValue) => (
        <Pressable
          key={assetValue.id}
          accessibilityRole="button"
          accessibilityLabel={'Xem tài sản ' + assetValue.name}
          onPress={onAssets}
          style={styles.asset}
        >
          <View
            style={[
              styles.icon,
              {
                backgroundColor:
                  assetValue.type === 'cash'
                    ? colors.softAmber
                    : assetValue.type === 'bank'
                      ? '#EFF6FF'
                      : colors.softGreen,
              },
            ]}
          >
            <Ionicons
              name={
                assetValue.type === 'cash'
                  ? 'wallet'
                  : assetValue.type === 'bank'
                    ? 'business'
                    : 'diamond'
              }
              color={
                assetValue.type === 'cash'
                  ? colors.amber
                  : assetValue.type === 'bank'
                    ? colors.blue
                    : colors.income
              }
              size={19}
            />
          </View>
          <Text numberOfLines={1} style={styles.assetName}>
            {assetValue.name.toLocaleUpperCase('vi')}
          </Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.assetValue}>
            {formatMoney(assetValue.balance)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function DashboardBudgetStatus({
  onBudget,
  complete,
  remaining,
  usage,
  totals,
  planned,
  missing,
}: Pick<
  ReturnType<typeof useDashboardScreen>,
  'onBudget' | 'complete' | 'remaining' | 'usage' | 'totals' | 'planned' | 'missing'
>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Xem ngân sách tháng này"
      onPress={onBudget}
      style={ui.card}
    >
      <View style={ui.row}>
        <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 15 }}>
          Ngân sách tháng này
        </Text>
        <Text
          style={[
            styles.badge,
            {
              color: complete && remaining < 0 ? colors.expense : colors.green,
              backgroundColor: complete && remaining < 0 ? colors.softRed : colors.softGreen,
            },
          ]}
        >
          {!complete
            ? 'CHƯA ĐỦ KẾ HOẠCH'
            : usage === undefined
              ? totals.expense > 0
                ? 'CHI VƯỢT'
                : 'ĐÃ DÙNG 0%'
              : usage > 100
                ? 'ĐÃ VƯỢT ' + (usage - 100) + '%'
                : 'ĐÃ DÙNG ' + usage + '%'}
        </Text>
      </View>
      <View style={ui.row}>
        <View style={{ flex: 1, gap: 7 }}>
          <Text style={ui.label}>DỰ KIẾN</Text>
          <Text style={styles.metric}>{formatMoney(planned)}</Text>
        </View>
        <View style={{ flex: 1, gap: 7, alignItems: 'flex-end' }}>
          <Text style={ui.label}>THỰC TẾ</Text>
          <Text
            style={[
              styles.metric,
              { color: complete && remaining < 0 ? colors.expense : colors.green },
            ]}
          >
            {formatMoney(totals.expense)}
          </Text>
        </View>
      </View>
      <View style={styles.track}>
        <View
          style={{
            height: '100%',
            width: (Math.min(usage ?? 0, 100) + '%') as `${number}%`,
            backgroundColor: complete && remaining < 0 ? colors.expense : colors.green,
            borderRadius: 4,
          }}
        />
      </View>
      <View style={ui.row}>
        <Text
          style={{
            fontSize: 12,
            color: complete && remaining < 0 ? colors.expense : colors.green,
            flex: 1,
          }}
        >
          {complete
            ? (remaining < 0 ? 'Vượt ' : 'Còn được chi ') + formatMoney(Math.abs(remaining))
            : 'Đặt đủ kế hoạch để xem phần còn được chi.'}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.muted} />
      </View>
      {missing > 0 && (
        <Text style={{ fontSize: 11, color: colors.muted }}>
          {missing} danh mục chưa đặt kế hoạch.
        </Text>
      )}
    </Pressable>
  );
}
