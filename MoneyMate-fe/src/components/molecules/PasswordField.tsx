import { colors } from '@/theme/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FormField } from './FormField';
export function PasswordField({
  label,
  value,
  onChangeText,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View>
      <FormField
        label={label}
        placeholder="••••••••"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        error={error}
        style={{ paddingRight: 54 }}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        onPress={() => setVisible((value) => !value)}
        style={styles.eye}
      >
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          color={colors.muted}
          size={21}
        />
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  eye: {
    position: 'absolute',
    top: 28,
    right: 7,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
