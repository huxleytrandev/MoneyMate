import { useRef, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { ConfirmDialog } from './ConfirmDialog';
interface Props {
  label: string;
  title: string;
  description: string;
  confirmLabel?: string;
  disabled?: boolean;
  onConfirm: () => Promise<unknown>;
}
export function ConfirmActionButton({
  label,
  title,
  description,
  confirmLabel = 'Xóa',
  disabled,
  onConfirm,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const running = useRef(false);
  async function confirm() {
    if (running.current) return;
    running.current = true;
    setPending(true);
    setError('');
    try {
      await onConfirm();
      setVisible(false);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Chưa thể hoàn tất. Vui lòng thử lại.');
    } finally {
      running.current = false;
      setPending(false);
    }
  }
  return (
    <>
      <Button
        title={label}
        variant="danger"
        disabled={disabled || pending}
        onPress={() => {
          setError('');
          setVisible(true);
        }}
      />
      <ConfirmDialog
        visible={visible}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        onConfirm={() => void confirm()}
        busy={pending}
        error={error}
        onDismiss={() => {
          if (!running.current) setVisible(false);
        }}
      />
    </>
  );
}
