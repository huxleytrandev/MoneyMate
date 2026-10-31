export type IntentAction =
  | 'help'
  | 'list'
  | 'show'
  | 'create'
  | 'update'
  | 'remove'
  | 'reconcile'
  | 'archive'
  | 'restore'
  | 'report'
  | 'cancel'
  | 'unlink'
  | 'security';
export type IntentResource =
  | 'transactions'
  | 'assets'
  | 'categories'
  | 'plans'
  | 'transfers'
  | 'adjustments'
  | 'profile'
  | 'balance';
export interface Intent {
  action: IntentAction;
  resource: IntentResource;
  fields: Record<string, string>;
  reference?: string;
}
export interface InterpretInput {
  text: string;
  today: string;
  timezone: string;
}
