import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { AVATAR_MAX_BYTES } from '@/constants/profile';
export async function chooseAvatar() {
  const selected = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  if (selected.canceled) return null;
  const asset = selected.assets[0];
  const context = ImageManipulator.manipulate(asset.uri);
  const edge = Math.min(asset.width, asset.height);
  context.crop({
    originX: Math.floor((asset.width - edge) / 2),
    originY: Math.floor((asset.height - edge) / 2),
    width: edge,
    height: edge,
  });
  context.resize({ width: 256, height: 256 });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.75, base64: true });
  if (!result.base64 || Math.ceil((result.base64.length * 3) / 4) > AVATAR_MAX_BYTES)
    throw new Error('Ảnh quá lớn, hãy chọn ảnh khác.');
  return 'data:image/jpeg;base64,' + result.base64;
}
