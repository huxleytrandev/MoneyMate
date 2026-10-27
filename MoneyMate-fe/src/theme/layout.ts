import { StyleSheet } from 'react-native';
import { colors } from './colors';
export const ui = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.8,
    lineHeight: 39,
  },
  heading: { fontSize: 19, fontWeight: '700', color: colors.ink },
  body: { fontSize: 14, lineHeight: 22, color: colors.muted },
  label: { fontSize: 11, fontWeight: '600', color: colors.muted, letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 22,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  error: { fontSize: 13, lineHeight: 20, color: colors.expense },
  note: { backgroundColor: colors.softGreen, borderRadius: 16, padding: 14 },
});
