import { Image, Text, View } from 'react-native';
import { Avatar } from 'react-native-paper';
import { Button } from '@/components/atoms/Button';
import { Chip } from '@/components/atoms/Chip';
import { FormField } from '@/components/molecules/FormField';
import { DateSelectField } from '@/components/molecules/DateSelectField';
import { GENDER_OPTIONS } from '@/constants/profile';
import { ui } from '@/theme/layout';
import { colors } from '@/theme/colors';
import type { useUserProfile } from '@/hooks/useUserProfile';
export function PersonalProfileFields({ model }: { model: ReturnType<typeof useUserProfile> }) {
  const { profile } = model;
  if (!profile) return null;
  return (
    <View style={ui.card}>
      <View style={{ alignItems: 'center', gap: 10 }}>
        {profile.avatarData ? (
          <Image
            accessibilityLabel="Ảnh đại diện của bạn"
            source={{ uri: profile.avatarData }}
            style={{ width: 96, height: 96, borderRadius: 48 }}
          />
        ) : (
          <Avatar.Text
            size={96}
            label={profile.displayName.trim().slice(0, 1).toUpperCase() || 'M'}
            style={{ backgroundColor: colors.softGreen }}
            color={colors.green}
          />
        )}
        <Button
          title="Chọn ảnh đại diện"
          variant="text"
          onPress={() => void model.selectAvatar()}
          disabled={model.busy}
        />
        {profile.avatarData && (
          <Button
            title="Gỡ ảnh"
            variant="text"
            onPress={() => model.change({ avatarData: null })}
            disabled={model.busy}
          />
        )}
      </View>
      <FormField
        label="Họ và tên"
        value={profile.displayName}
        onChangeText={(displayName) => model.change({ displayName })}
        editable={!model.busy}
        maxLength={100}
      />
      <Text style={ui.label}>Giới tính</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {GENDER_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={profile.gender === option.value}
            disabled={model.busy}
            onPress={() => model.change({ gender: option.value })}
          />
        ))}
      </View>
      <DateSelectField
        label="Ngày sinh"
        value={profile.dateOfBirth ?? ''}
        onChange={(dateOfBirth) => model.change({ dateOfBirth })}
        maximum={new Date().toISOString().slice(0, 10)}
        disabled={model.busy}
      />
      {profile.dateOfBirth && (
        <Button
          title="Không chia sẻ ngày sinh"
          variant="text"
          disabled={model.busy}
          onPress={() => model.change({ dateOfBirth: null })}
        />
      )}
      <Button
        title="Lưu hồ sơ"
        loading={model.busy}
        disabled={!model.dirty}
        onPress={() => void model.save()}
      />
      {model.dirty && (
        <Button
          title="Khôi phục thông tin đã lưu"
          variant="text"
          disabled={model.busy}
          onPress={model.discard}
        />
      )}
    </View>
  );
}
