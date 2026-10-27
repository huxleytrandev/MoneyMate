import type { PropsWithChildren } from 'react';
import { Modal, Text, View, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ScreenTemplate } from './ScreenTemplate';
import { ui } from '@/theme/layout';
import { colors as c } from '@/theme/colors';
export function SheetTemplate({
  title,
  onClose,
  children,
}: { title: string; onClose: () => void } & PropsWithChildren) {
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <ScreenTemplate>
        <View style={ui.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng"
            onPress={onClose}
            style={{
              width: 44,
              height: 44,
              backgroundColor: c.surface,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={23} color={c.ink} />
          </Pressable>
          <Text style={[ui.heading, { flex: 1, textAlign: 'center' }]}>{title}</Text>
          <View style={{ width: 44 }} />
        </View>
        {children}
      </ScreenTemplate>
    </Modal>
  );
}
