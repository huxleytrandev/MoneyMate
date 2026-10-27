export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  month: string;
}
