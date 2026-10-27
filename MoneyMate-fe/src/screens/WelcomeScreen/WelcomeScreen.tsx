import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/atoms/Button';
import { colors as c } from '@/theme/colors';
export default function WelcomeScreen({
  onStart,
  onLogin,
  onDemo,
}: {
  onStart: () => void;
  onLogin: () => void;
  onDemo: () => void;
}) {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.visual}>
          <Image
            source={require('../../../assets/images/welcome-illustration.png')}
            style={s.image}
            resizeMode="contain"
            accessibilityLabel="Người bạn đồng hành quản lý tài sản"
          />
        </View>
        <View style={s.intro}>
          <Text style={s.title}>MoneyMate</Text>
          <Text style={s.subtitle}>Quản lý tài sản thông minh</Text>
        </View>
        <View style={s.actions}>
          <Button title="Bắt đầu ngay" onPress={onStart} />
          <View style={s.login}>
            <Text style={s.muted}>Bạn đã có tài khoản?</Text>
            <Pressable accessibilityRole="button" onPress={onLogin} style={s.link}>
              <Text style={s.linkText}>Đăng nhập</Text>
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" onPress={onDemo} style={s.demo}>
            <Text style={s.demoText}>Khám phá bản trải nghiệm →</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
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
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -1.2, color: c.ink },
  subtitle: { fontSize: 18, color: c.muted },
  actions: { gap: 12 },
  login: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  muted: { color: c.muted, fontSize: 13 },
  link: { padding: 12 },
  linkText: { fontSize: 14, fontWeight: '600', color: c.green },
  demo: { alignItems: 'center', padding: 10 },
  demoText: { color: c.muted, fontSize: 12 },
});
