import { buildAssistantReply, expensePlanStatus } from '@/helpers/assistant';
import { monthKey } from '@/helpers/date';
import { createId } from '@/helpers/id';
import { formatMoney } from '@/helpers/money';
import { useFinance } from '@/hooks/useFinance';
import type { AssistantMessage } from '@/types/assistant.types';
import { useRef, useState, type ComponentRef } from 'react';
import { Keyboard, ScrollView } from 'react-native';
export function useAssistantScreen({ onViewBudget }: { onViewBudget: () => void }) {
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
    .sort(
      (asset, otherRecord) =>
        otherRecord.actual - (otherRecord.planned ?? 0) - (asset.actual - (asset.planned ?? 0)),
    )[0];
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
      { id: createId(), role: 'user', content: trimmed, month },
      { id: createId(), role: 'assistant', content: reply, month },
    ]);
    setInput('');
    Keyboard.dismiss();
  }

  return { onViewBudget, alertText, scroll, month, messages, send, input, setInput };
}
