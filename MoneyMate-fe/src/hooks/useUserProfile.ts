import { useEffect, useRef, useState } from 'react';
import { getProfile, saveProfile } from '@/services/profile.service';
import { chooseAvatar } from '@/services/avatar.service';
import { profileSchema } from '@/schemas/profile.schema';
import { useAuth } from '@/hooks/useAuth';
import type { UserProfile } from '@/types/profile.types';
export function useUserProfile() {
  const { session, updateSession } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const writing = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    getProfile(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setProfile(data);
        setSaved(JSON.stringify(data));
      })
      .catch((failure: Error) => {
        if (!controller.signal.aborted) setError(failure.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  async function reload() {
    setLoading(true);
    setError('');
    try {
      const data = await getProfile();
      setProfile(data);
      setSaved(JSON.stringify(data));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không tải được hồ sơ.');
    } finally {
      setLoading(false);
    }
  }
  function change(patch: Partial<UserProfile>) {
    if (writing.current) return;
    setProfile((current) => (current ? { ...current, ...patch } : current));
    setMessage('');
  }
  async function selectAvatar() {
    if (writing.current) return;
    writing.current = true;
    setBusy(true);
    setError('');
    try {
      const avatarData = await chooseAvatar();
      if (avatarData) setProfile((current) => (current ? { ...current, avatarData } : current));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không thể chọn ảnh.');
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  async function save() {
    if (writing.current) return;
    const result = profileSchema.safeParse(profile);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    writing.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const data = await saveProfile(result.data);
      setProfile(data);
      setSaved(JSON.stringify(data));
      if (session) updateSession({ ...session, displayName: data.displayName });
      setMessage('Đã cập nhật hồ sơ.');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không thể lưu hồ sơ.');
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  function discard() {
    if (saved) setProfile(JSON.parse(saved) as UserProfile);
    setError('');
    setMessage('');
  }
  return {
    profile,
    loading,
    busy,
    error,
    message,
    reload,
    change,
    selectAvatar,
    save,
    discard,
    dirty: !!profile && JSON.stringify(profile) !== saved,
  };
}
