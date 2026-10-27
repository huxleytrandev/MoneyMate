import { suggestions } from '@/constants/assistant';
import { monthLabel } from '@/helpers/date';
import type { useAssistantScreen } from '@/hooks/useAssistantScreen';
import { styles } from '@/screens/AssistantScreen/AssistantScreen.styles';
import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
export function AssistantConversation({
  scroll,
  month,
  messages,
}: Pick<ReturnType<typeof useAssistantScreen>, 'scroll' | 'month' | 'messages'>) {
  return (
    <ScrollView
      ref={scroll}
      style={styles.chat}
      contentContainerStyle={styles.chatContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
    >
      <Text style={styles.date}>{monthLabel(month).toLocaleUpperCase('vi-VN')}</Text>
      <View style={styles.assistantRow}>
        <View style={styles.miniBot}>
          <Ionicons name="sparkles" size={15} color={colors.green} />
        </View>
        <View style={styles.assistantBubble}>
          <Text style={styles.greeting}>Chào bạn, mình là MoneyMate.</Text>
          <Text style={styles.messageText}>
            Mình có thể tóm tắt thu chi và các danh mục vượt kế hoạch từ dữ liệu tài khoản của bạn.
            Phần này hiện dùng quy tắc thống kê, chưa dùng mô hình AI.
          </Text>
          <View style={styles.previewNote}>
            <Ionicons name="shield-checkmark-outline" size={15} color={colors.green} />
            <Text style={styles.previewNoteText}>Câu hỏi được xử lý ngay trên ứng dụng.</Text>
          </View>
        </View>
      </View>
      {messages.map((message) =>
        message.role === 'user' ? (
          <View key={message.id} style={styles.userBubble}>
            <Text style={styles.userText}>{message.content}</Text>
          </View>
        ) : (
          <View key={message.id} style={styles.assistantRow}>
            <View style={styles.miniBot}>
              <Ionicons name="sparkles" size={15} color={colors.green} />
            </View>
            <View style={styles.answer}>
              <View style={styles.assistantBubble}>
                <Text style={styles.messageText}>{message.content}</Text>
              </View>
              <Text style={styles.source}>Dữ liệu tài khoản · {monthLabel(message.month)}</Text>
            </View>
          </View>
        ),
      )}
    </ScrollView>
  );
}

export function AssistantComposer({
  send,
  input,
  setInput,
}: Pick<ReturnType<typeof useAssistantScreen>, 'send' | 'input' | 'setInput'>) {
  return (
    <View style={styles.composer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.suggestions}
      >
        {suggestions.map((question) => (
          <Pressable
            key={question}
            accessibilityRole="button"
            onPress={() => send(question)}
            style={styles.suggestion}
          >
            <Text style={styles.suggestionText}>{question}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Hỏi MoneyMate…"
          placeholderTextColor={colors.muted}
          accessibilityLabel="Câu hỏi cho trợ lý MoneyMate"
          maxLength={1000}
          multiline
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Gửi câu hỏi"
          accessibilityState={{ disabled: !input.trim() }}
          disabled={!input.trim()}
          onPress={() => send()}
          style={[styles.send, !input.trim() && styles.sendDisabled]}
        >
          <Ionicons name="send" size={18} color={colors.surface} />
        </Pressable>
      </View>
      <Text style={styles.footer}>Tóm tắt tự động từ dữ liệu tài khoản trong phiên.</Text>
    </View>
  );
}
