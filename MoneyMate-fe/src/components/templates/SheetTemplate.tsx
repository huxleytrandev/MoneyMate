import { SheetInteractionProvider } from '@/providers/SheetInteractionProvider';
import BottomSheet, { BottomSheetScrollView } from '@expo/ui/community/bottom-sheet';
import { useState, type PropsWithChildren } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import X from 'lucide-react-native/icons/x';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { paperTheme } from '@/theme/paper';
import { colors } from '@/theme/colors';
type Props = PropsWithChildren<{
  title: string;
  onClose: () => void;
  dirty?: boolean;
  busy?: boolean;
  size?: 'compact' | 'expanded';
}>;
export function SheetTemplate({
  title,
  onClose,
  children,
  dirty = false,
  busy = false,
  size = 'expanded',
}: Props) {
  const [discarding, setDiscarding] = useState(false);
  const insets = useSafeAreaInsets();
  function requestClose() {
    if (busy) return;
    if (dirty) {
      setDiscarding(true);
      return;
    }
    onClose();
  }
  return (
    <BottomSheet
      snapPoints={['64%', '88%']}
      index={size === 'compact' ? 0 : 1}
      enablePanDownToClose={!dirty && !busy}
      onClose={onClose}
      backgroundStyle={styles.background}
    >
      <View style={{ flex: 1 }}>
        <SheetInteractionProvider busy={busy}>
          <PaperProvider theme={paperTheme}>
            <View style={styles.header}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.eyebrow}>MONEYMATE</Text>
                <Text accessibilityRole="header" style={styles.title}>
                  {title}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                disabled={busy}
                onPress={requestClose}
                hitSlop={8}
                style={styles.close}
              >
                <X size={21} color={colors.ink} />
              </Pressable>
            </View>
            <BottomSheetScrollView
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets
              contentContainerStyle={[
                styles.content,
                { paddingBottom: Math.max(insets.bottom, 16) + 32 },
              ]}
            >
              {children}
            </BottomSheetScrollView>
            <ConfirmDialog
              visible={discarding}
              title="Bỏ các thay đổi?"
              description="Những thông tin bạn vừa chỉnh sửa chưa được lưu."
              confirmLabel="Bỏ thay đổi"
              cancelLabel="Tiếp tục sửa"
              onConfirm={onClose}
              onDismiss={() => setDiscarding(false)}
            />
          </PaperProvider>
        </SheetInteractionProvider>
      </View>
    </BottomSheet>
  );
}
const styles = StyleSheet.create({
  background: {
    paddingHorizontal: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eyebrow: { color: colors.green, fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 21, fontWeight: '700' },
  close: {
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  content: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 24, gap: 20 },
});
