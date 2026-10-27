import { Text, View, StyleSheet } from 'react-native';
import { colors as c } from '@/theme/colors';
export function Brand() {
  return (
    <View style={s.row}>
      <View style={s.mark}>
        <Text style={s.m}>m.</Text>
      </View>
      <Text style={s.word}>MoneyMate</Text>
    </View>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  mark: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: c.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  m: { color: c.lime, fontSize: 27, fontWeight: '800', marginTop: -5 },
  word: { color: c.ink, fontWeight: '700', fontSize: 22, letterSpacing: -0.8 },
});
