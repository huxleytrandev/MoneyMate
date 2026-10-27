import { Button } from '@/components/atoms/Button';
import { colors } from '@/theme/colors';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function WelcomeScreen({
  onStart,
  onLogin,
}: {
  onStart: () => void;
  onLogin: () => void;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.visual}>
          <Image
            source={require('../../../assets/images/welcome-illustration.png')}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel="Người bạn đồng hành quản lý tài sản"
          />
        </View>
        <View style={styles.intro}>
          <Text style={styles.title}>MoneyMate</Text>
          <Text style={styles.subtitle}>Quản lý tài sản thông minh</Text>
        </View>
        <View style={styles.actions}>
          <Button title="Bắt đầu ngay" onPress={onStart} />
          <View style={styles.login}>
            <Text style={styles.muted}>Bạn đã có tài khoản?</Text>
            <Pressable accessibilityRole="button" onPress={onLogin} style={styles.link}>
              <Text style={styles.linkText}>Đăng nhập</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    padding: 24,
    paddingBottom: 26,
    minHeight: 640,
  },
  visual: {
    flex: 1,
    minHeight: 290,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
  },
  image: { width: '100%', height: 300, maxWidth: 320 },
  intro: { alignItems: 'center', gap: 12, paddingTop: 16, paddingBottom: 62 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -1.2, color: colors.ink },
  subtitle: { fontSize: 18, color: colors.muted },
  actions: { gap: 12 },
  login: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  muted: { color: colors.muted, fontSize: 13 },
  link: { padding: 12 },
  linkText: { fontSize: 14, fontWeight: '600', color: colors.green },
});
