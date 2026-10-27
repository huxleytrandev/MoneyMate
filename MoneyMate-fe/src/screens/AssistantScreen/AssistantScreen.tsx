import { useAssistantScreen } from '@/hooks/useAssistantScreen';
import { styles } from '@/screens/AssistantScreen/AssistantScreen.styles';
import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AssistantComposer, AssistantConversation } from './AssistantScreen.sections';
export default function AssistantScreen(props: Parameters<typeof useAssistantScreen>[0]) {
  const { onViewBudget, alertText, scroll, month, messages, send, input, setInput } =
    useAssistantScreen(props);
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.botIcon}>
              <Ionicons name="sparkles" size={21} color={colors.surface} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>MoneyMate AI</Text>
              <View style={styles.status}>
                <View style={styles.statusDot} />
                <Text style={styles.statusLabel}>TÓM TẮT TÀI CHÍNH</Text>
              </View>
            </View>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyText}>VND</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xem ngân sách tháng này"
            onPress={onViewBudget}
            style={styles.alert}
          >
            <View style={styles.alertIcon}>
              <Ionicons name="alert-circle" size={20} color="#B7790B" />
            </View>
            <Text style={styles.alertText}>{alertText}</Text>
            <Text style={styles.alertAction}>XEM</Text>
          </Pressable>
          <AssistantConversation scroll={scroll} month={month} messages={messages} />
          <AssistantComposer send={send} input={input} setInput={setInput} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
