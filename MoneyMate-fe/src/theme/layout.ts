import { StyleSheet } from 'react-native';
import { colors as c } from './colors';
export const ui = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '700', color: c.ink, letterSpacing: -0.8, lineHeight: 39 },
  heading: { fontSize: 19, fontWeight: '700', color: c.ink },
  body: { fontSize: 14, lineHeight: 22, color: c.muted },
  label: { fontSize: 11, fontWeight: '600', color: c.muted, letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  card: {
    backgroundColor: c.surface,
    borderRadius: 24,
    padding: 22,
    gap: 16,
    borderWidth: 1,
    borderColor: c.border,
  },
  error: { fontSize: 13, lineHeight: 20, color: c.expense },
  note: { backgroundColor: c.softGreen, borderRadius: 16, padding: 14 },
});
