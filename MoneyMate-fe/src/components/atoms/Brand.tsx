import { colors } from '@/theme/colors';
import { StyleSheet, Text, View } from 'react-native';
export function Brand() {
  return (
    <View style={styles.row}>
      <View style={styles.mark}>
        <Text style={styles.m}>m.</Text>
      </View>
      <Text style={styles.word}>MoneyMate</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  mark: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  m: { color: colors.lime, fontSize: 27, fontWeight: '800', marginTop: -5 },
  word: { color: colors.ink, fontWeight: '700', fontSize: 22, letterSpacing: -0.8 },
});
