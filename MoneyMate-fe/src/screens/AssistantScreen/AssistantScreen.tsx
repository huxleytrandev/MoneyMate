import { useRef, useState, type ComponentRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildAssistantReply, expensePlanStatus } from '@/helpers/assistant';
import { monthKey, monthLabel } from '@/helpers/date';
import { createDemoId } from '@/helpers/id';
import { formatMoney } from '@/helpers/money';
import { useFinance } from '@/hooks/useFinance';
import { colors as c } from '@/theme/colors';
import type { AssistantMessage } from '@/types/assistant.types';

const suggestions = [
  'Tháng này tôi chi vượt mục nào?',
  'Tóm tắt thu chi',
  'Gợi ý quản lý ngân sách',
];

export default function AssistantScreen({ onViewBudget }: { onViewBudget: () => void }) {
  const { state } = useFinance();
  const month = monthKey(new Date());
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const status = expensePlanStatus(state, month);
  const alert = [...status]
    .filter(
      ({ planned, actual }) => planned !== undefined && actual > 0 && actual >= planned * 0.85,
    )
    .sort((a, b) => b.actual - (b.planned ?? 0) - (a.actual - (a.planned ?? 0)))[0];
  const alertText = alert
    ? alert.actual > (alert.planned ?? 0)
      ? alert.category.name +
        ' đã vượt kế hoạch ' +
        formatMoney(alert.actual - (alert.planned ?? 0)) +
        '.'
      : alert.category.name +
        ' đã dùng ' +
        Math.round((alert.actual / (alert.planned || 1)) * 100) +
        '% kế hoạch tháng này.'
    : 'Theo dõi kế hoạch và thực tế để chủ động hơn mỗi ngày.';

  function send(question = input) {
    const trimmed = question.trim();
    if (!trimmed) return;
    const reply = buildAssistantReply(state, month, trimmed);
    setMessages((previous) => [
      ...previous,
      { id: createDemoId(), role: 'user', content: trimmed, month },
      { id: createDemoId(), role: 'assistant', content: reply, month },
    ]);
    setInput('');
    Keyboard.dismiss();
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={s.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.container}>
          <View style={s.header}>
            <View style={s.botIcon}>
              <Ionicons name="sparkles" size={21} color={c.surface} />
            </View>
            <View style={s.headerText}>
              <Text style={s.title}>MoneyMate AI</Text>
              <View style={s.status}>
                <View style={s.statusDot} />
                <Text style={s.statusLabel}>BẢN XEM TRƯỚC</Text>
              </View>
            </View>
            <View style={s.currencyBadge}>
              <Text style={s.currencyText}>VND</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xem ngân sách tháng này"
            onPress={onViewBudget}
            style={s.alert}
          >
            <View style={s.alertIcon}>
              <Ionicons name="alert-circle" size={20} color="#B7790B" />
            </View>
            <Text style={s.alertText}>{alertText}</Text>
            <Text style={s.alertAction}>XEM</Text>
          </Pressable>
          <ScrollView
            ref={scroll}
            style={s.chat}
            contentContainerStyle={s.chatContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
          >
            <Text style={s.date}>{monthLabel(month).toLocaleUpperCase('vi-VN')}</Text>
            <View style={s.assistantRow}>
              <View style={s.miniBot}>
                <Ionicons name="sparkles" size={15} color={c.green} />
              </View>
              <View style={s.assistantBubble}>
                <Text style={s.greeting}>Chào bạn, mình là MoneyMate.</Text>
                <Text style={s.messageText}>
                  Trợ lý AI đang được hoàn thiện. Bạn có thể xem các tóm tắt từ dữ liệu demo.
                </Text>
                <View style={s.previewNote}>
                  <Ionicons name="shield-checkmark-outline" size={15} color={c.green} />
                  <Text style={s.previewNoteText}>Câu hỏi được xử lý ngay trên ứng dụng.</Text>
                </View>
              </View>
            </View>
            {messages.map((message) =>
              message.role === 'user' ? (
                <View key={message.id} style={s.userBubble}>
                  <Text style={s.userText}>{message.content}</Text>
                </View>
              ) : (
                <View key={message.id} style={s.assistantRow}>
                  <View style={s.miniBot}>
                    <Ionicons name="sparkles" size={15} color={c.green} />
                  </View>
                  <View style={s.answer}>
                    <View style={s.assistantBubble}>
                      <Text style={s.messageText}>{message.content}</Text>
                    </View>
                    <Text style={s.source}>Dữ liệu demo · {monthLabel(message.month)}</Text>
                  </View>
                </View>
              ),
            )}
          </ScrollView>
          <View style={s.composer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.suggestions}
            >
              {suggestions.map((question) => (
                <Pressable
                  key={question}
                  accessibilityRole="button"
                  onPress={() => send(question)}
                  style={s.suggestion}
                >
                  <Text style={s.suggestionText}>{question}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={s.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Hỏi MoneyMate…"
                placeholderTextColor={c.muted}
                accessibilityLabel="Câu hỏi cho trợ lý MoneyMate"
                maxLength={1000}
                multiline
                style={s.input}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Gửi câu hỏi"
                accessibilityState={{ disabled: !input.trim() }}
                disabled={!input.trim()}
                onPress={() => send()}
                style={[s.send, !input.trim() && s.sendDisabled]}
              >
                <Ionicons name="send" size={18} color={c.surface} />
              </Pressable>
            </View>
            <Text style={s.footer}>Tóm tắt tự động từ dữ liệu demo trong phiên.</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  keyboard: { flex: 1 },
  container: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 22, paddingBottom: 18 },
  botIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 6 },
  title: { fontSize: 22, fontWeight: '700', color: c.ink, letterSpacing: -0.5 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.green },
  statusLabel: { fontSize: 9, letterSpacing: 1.2, color: c.muted, fontWeight: '600' },
  currencyBadge: {
    backgroundColor: c.surface,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  currencyText: { fontSize: 10, fontWeight: '700', color: c.green },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 22,
    borderRadius: 17,
    padding: 13,
    backgroundColor: '#FAEFDC',
    borderWidth: 1,
    borderColor: '#F2E1BF',
  },
  alertIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F8E5BF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertText: { flex: 1, fontSize: 12, lineHeight: 18, color: c.ink },
  alertAction: { color: '#9F6B10', fontSize: 10, fontWeight: '700' },
  chat: { flex: 1 },
  chatContent: { padding: 20, gap: 22, paddingBottom: 26 },
  date: { fontSize: 9, color: c.muted, letterSpacing: 1.2, textAlign: 'center', marginVertical: 2 },
  assistantRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  miniBot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: c.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 7,
  },
  assistantBubble: {
    flexShrink: 1,
    backgroundColor: c.surface,
    borderRadius: 24,
    borderBottomLeftRadius: 5,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: c.border,
  },
  greeting: { fontSize: 15, fontWeight: '700', lineHeight: 22, color: c.ink },
  messageText: { color: c.ink, fontSize: 14, lineHeight: 23 },
  previewNote: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: c.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewNoteText: { flex: 1, color: c.green, fontSize: 11, lineHeight: 17 },
  userBubble: {
    maxWidth: '86%',
    alignSelf: 'flex-end',
    backgroundColor: c.green,
    borderRadius: 24,
    borderBottomRightRadius: 5,
    padding: 18,
  },
  userText: { color: c.surface, fontSize: 14, lineHeight: 22 },
  answer: { flex: 1, gap: 7 },
  source: { fontSize: 9, lineHeight: 14, color: c.muted, paddingLeft: 6 },
  composer: {
    paddingTop: 10,
    paddingBottom: 10,
    gap: 12,
    borderTopWidth: 1,
    borderColor: c.border,
  },
  suggestions: { paddingHorizontal: 20, gap: 8 },
  suggestion: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  suggestionText: { color: c.ink, fontSize: 11, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: c.surface,
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 7,
    borderWidth: 1,
    borderColor: c.border,
  },
  input: {
    flex: 1,
    color: c.ink,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    minHeight: 44,
    maxHeight: 104,
  },
  send: {
    width: 42,
    height: 42,
    backgroundColor: c.green,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.45 },
  footer: { textAlign: 'center', fontSize: 9, color: c.muted },
});
