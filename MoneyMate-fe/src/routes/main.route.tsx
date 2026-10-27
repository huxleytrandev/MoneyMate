import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { FinanceProvider } from '@/providers/FinanceProvider';
import { colors as c } from '@/theme/colors';
import { ROUTES } from '@/constants/routes';
export default function MainRoute() {
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  if (!session) return <Redirect href={ROUTES.welcome} />;
  return (
    <FinanceProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: c.green,
          tabBarInactiveTintColor: c.muted,
          tabBarHideOnKeyboard: true,
          tabBarLabelPosition: 'below-icon',
          tabBarItemStyle: { paddingVertical: 3 },
          tabBarLabelStyle: {
            fontSize: 10,
            lineHeight: 14,
            fontWeight: '600',
            marginTop: 2,
            flexShrink: 0,
          },
          tabBarStyle: {
            backgroundColor: c.background,
            borderTopColor: c.border,
            height: 74 + insets.bottom,
            paddingTop: 6,
            paddingBottom: Math.max(insets.bottom, 10),
          },
          sceneStyle: { backgroundColor: c.background },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Tổng quan',
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="home-outline"
                color={typeof color === 'string' ? color : c.muted}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: 'Giao dịch',
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="list-outline"
                color={typeof color === 'string' ? color : c.muted}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="assets"
          options={{
            title: 'Tài sản',
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="wallet-outline"
                color={typeof color === 'string' ? color : c.muted}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="budget"
          options={{
            title: 'Ngân sách',
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="pie-chart-outline"
                color={typeof color === 'string' ? color : c.muted}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="assistant"
          options={{
            title: 'Trợ lý AI',
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="chatbubbles-outline"
                color={typeof color === 'string' ? color : c.muted}
                size={size}
              />
            ),
          }}
        />
      </Tabs>
    </FinanceProvider>
  );
}
