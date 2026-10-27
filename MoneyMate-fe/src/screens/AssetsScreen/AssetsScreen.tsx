import { Button } from '@/components/atoms/Button';
import { AssetEditor } from '@/components/organisms/AssetEditor';
import { TransferForm } from '@/components/organisms/TransferForm';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { groups } from '@/constants/asset-groups';
import { formatMoney } from '@/helpers/money';
import { useAssetsScreen } from '@/hooks/useAssetsScreen';
import { styles } from '@/screens/AssetsScreen/AssetsScreen.styles';
import { colors } from '@/theme/colors';
import { ui } from '@/theme/layout';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { AssetsSummary } from './AssetsScreen.sections';
export default function AssetsScreen() {
  const {
    setEditor,
    state,
    setTransfer,
    total,
    segments,
    chartTotal,
    circumference,
    hasNegativeBalance,
    values,
    transfer,
    editor,
  } = useAssetsScreen();
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
          style={styles.add}
        >
          <Ionicons name="add" size={25} color="white" />
        </Pressable>
      </View>

      {state.assets.length === 0 && (
        <View style={ui.note}>
          <Text style={ui.body}>
            Thêm tiền mặt, từng tài khoản ngân hàng và các tài sản khác để bắt đầu. Số dư ban đầu
            không được tính là thu nhập.
          </Text>
        </View>
      )}
      <Button
        title="Chuyển tiền giữa các nguồn"
        variant="secondary"
        disabled={state.assets.filter((asset) => !asset.isArchived).length < 2}
        onPress={() => setTransfer({})}
      />
      <AssetsSummary
        total={total}
        segments={segments}
        chartTotal={chartTotal}
        circumference={circumference}
        state={state}
        hasNegativeBalance={hasNegativeBalance}
      />

      {groups.map((group) => {
        const assets = values.filter((item) => item.asset.type === group.type);
        return (
          <View key={group.type} style={styles.group}>
            <View style={ui.row}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <Text style={styles.count}>{assets.length} nguồn</Text>
            </View>
            {assets.length === 0 ? (
              <Text style={styles.empty}>Chưa có {group.label.toLocaleLowerCase('vi')}.</Text>
            ) : (
              assets.map(({ asset, balance }) => (
                <Pressable
                  key={asset.id}
                  accessibilityRole="button"
                  accessibilityLabel={'Điều chỉnh tài sản ' + asset.name}
                  onPress={() => setEditor({ asset })}
                  style={({ pressed }) => [styles.asset, pressed && { opacity: 0.7 }]}
                >
                  <View style={[styles.assetIcon, { backgroundColor: group.tint }]}>
                    <Ionicons
                      name={group.icon}
                      size={22}
                      color={group.type === 'bank' ? colors.green : group.color}
                    />
                  </View>
                  <View style={styles.assetDetails}>
                    <Text style={styles.assetName}>
                      {asset.name}
                      {asset.isArchived ? ' · Đã lưu trữ' : ''}
                    </Text>
                    <Text style={styles.currency}>
                      {asset.type === 'other' ? 'Giá trị ước tính · VNĐ' : 'Số dư hiện tại · VNĐ'}
                    </Text>
                  </View>
                  <Text style={[styles.assetAmount, balance < 0 && { color: colors.expense }]}>
                    {formatMoney(balance)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                </Pressable>
              ))
            )}
          </View>
        );
      })}

      <View style={styles.tip}>
        <Ionicons name="information-circle-outline" size={20} color={colors.green} />
        <Text style={styles.tipText}>
          Chạm một tài sản để đối soát với số dư thực tế. Khoản điều chỉnh không được tính thành thu
          nhập hoặc chi tiêu.
        </Text>
      </View>
      {(state.transfers ?? []).length > 0 && <Text style={ui.heading}>Chuyển tiền gần đây</Text>}
      {(state.transfers ?? [])
        .slice()
        .sort((firstTransfer, secondTransfer) =>
          secondTransfer.occurredAt.localeCompare(firstTransfer.occurredAt),
        )
        .map((transfer) => (
          <Pressable
            key={transfer.id}
            accessibilityRole="button"
            onPress={() => setTransfer({ value: transfer })}
            style={ui.card}
          >
            <Text style={{ color: colors.ink, fontWeight: '600' }}>
              {state.assets.find((asset) => asset.id === transfer.fromAssetId)?.name} →{' '}
              {state.assets.find((asset) => asset.id === transfer.toAssetId)?.name}
            </Text>
            <Text>{formatMoney(transfer.amount)}</Text>
          </Pressable>
        ))}
      {transfer && <TransferForm transfer={transfer.value} onClose={() => setTransfer(null)} />}
      {editor && <AssetEditor asset={editor.asset} onClose={() => setEditor(null)} />}
    </ScreenTemplate>
  );
}
