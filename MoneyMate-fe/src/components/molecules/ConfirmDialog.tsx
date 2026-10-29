import TriangleAlert from 'lucide-react-native/icons/triangle-alert';
import { Dialog, Portal, Text } from 'react-native-paper';
import { Button } from '@/components/atoms/Button';
import { colors } from '@/theme/colors';
export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onDismiss: () => void;
  busy?: boolean;
  error?: string;
  cancelLabel?: string;
}
export function ConfirmDialog(props: ConfirmDialogProps) {
  return (
    <Portal>
      <Dialog
        visible={props.visible}
        onDismiss={props.onDismiss}
        dismissable={!props.busy}
        dismissableBackButton={!props.busy}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 28,
          maxWidth: 480,
          width: '90%',
          alignSelf: 'center',
        }}
      >
        <Dialog.Icon icon={() => <TriangleAlert size={32} color={colors.expense} />} />
        <Dialog.Title>{props.title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={{ color: colors.muted, lineHeight: 23 }}>
            {props.description}
          </Text>
          {!!props.error && (
            <Text accessibilityRole="alert" style={{ color: colors.expense, marginTop: 12 }}>
              {props.error}
            </Text>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            title={props.cancelLabel ?? 'Giữ lại'}
            variant="text"
            onPress={props.onDismiss}
            disabled={props.busy}
          />
          <Button
            title={props.confirmLabel}
            variant="danger"
            onPress={props.onConfirm}
            loading={props.busy}
          />
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
