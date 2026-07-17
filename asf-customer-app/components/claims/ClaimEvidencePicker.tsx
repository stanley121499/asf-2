import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { useTranslation } from "@/context/LocaleContext";
import { colors } from "@/constants/theme";
import { MAX_CLAIM_EVIDENCE_PHOTOS } from "@/lib/claims/claimEvidenceStorage";
import {
  pickClaimPhotosFromLibrary,
  requestClaimPhotoPermission,
  takeClaimPhoto,
  type PickedClaimPhoto,
} from "@/lib/claims/pickClaimPhotos";

const THUMB_SIZE = 88;

export interface ClaimEvidencePickerProps {
  photos: ReadonlyArray<PickedClaimPhoto>;
  onChange: (photos: PickedClaimPhoto[]) => void;
  disabled?: boolean;
}

/**
 * Thumbnail with remove control for one selected claim photo.
 */
function PhotoThumb({
  photo,
  index,
  onRemove,
  disabled,
}: Readonly<{
  photo: PickedClaimPhoto;
  index: number;
  onRemove: (index: number) => void;
  disabled: boolean;
}>): React.ReactElement {
  return (
    <View
      style={{
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: 10,
        backgroundColor: "#E5E7EB",
        overflow: "hidden",
      }}
    >
      <Image
        source={{ uri: photo.uri }}
        style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
        contentFit="cover"
      />
      {!disabled ? (
        <Pressable
          onPress={() => onRemove(index)}
          hitSlop={6}
          style={({ pressed }) => ({
            position: "absolute",
            top: 4,
            right: 4,
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: pressed ? colors.danger : "rgba(0,0,0,0.65)",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Ionicons name="close" size={13} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Add-photos tile that opens camera or gallery picker.
 */
function AddPhotoButton({
  disabled,
  onPress,
}: Readonly<{ disabled: boolean; onPress: () => void }>): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : disabled ? 0.5 : 1 })}
    >
      <View
        style={{
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: "#F3F4F6",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <Ionicons name="camera-outline" size={24} color={colors.muted} />
        <Text style={{ fontSize: 10, color: colors.muted, fontFamily: "Inter_400Regular" }}>
          +
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * Photo picker UI for warranty claim evidence (camera / gallery, thumbnails, remove).
 */
export function ClaimEvidencePicker({
  photos,
  onChange,
  disabled = false,
}: Readonly<ClaimEvidencePickerProps>): React.ReactElement {
  const { t } = useTranslation();

  const remainingSlots = MAX_CLAIM_EVIDENCE_PHOTOS - photos.length;
  const canAddMore = remainingSlots > 0 && !disabled;

  const handleRemove = useCallback(
    (index: number): void => {
      onChange(photos.filter((_, photoIndex) => photoIndex !== index));
    },
    [onChange, photos]
  );

  const appendPhotos = useCallback(
    (picked: PickedClaimPhoto[]): void => {
      if (picked.length === 0) {
        return;
      }
      const merged = [...photos, ...picked].slice(0, MAX_CLAIM_EVIDENCE_PHOTOS);
      onChange(merged);
    },
    [onChange, photos]
  );

  const openCamera = useCallback(async (): Promise<void> => {
    const granted = await requestClaimPhotoPermission("camera");
    if (!granted) {
      Alert.alert(t("claims.photoPermissionTitle"), t("claims.photoPermissionCamera"));
      return;
    }

    const photo = await takeClaimPhoto();
    if (photo !== null) {
      appendPhotos([photo]);
    }
  }, [appendPhotos, t]);

  const openLibrary = useCallback(async (): Promise<void> => {
    const granted = await requestClaimPhotoPermission("library");
    if (!granted) {
      Alert.alert(t("claims.photoPermissionTitle"), t("claims.photoPermissionLibrary"));
      return;
    }

    const picked = await pickClaimPhotosFromLibrary(remainingSlots);
    appendPhotos(picked);
  }, [appendPhotos, remainingSlots, t]);

  const handleAddPhotos = useCallback((): void => {
    Alert.alert(t("claims.addPhotos"), undefined, [
      { text: t("claims.takePhoto"), onPress: () => void openCamera() },
      { text: t("claims.chooseFromGallery"), onPress: () => void openLibrary() },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  }, [openCamera, openLibrary, t]);

  return (
    <View style={{ marginBottom: 20 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
      >
        {photos.map((photo, index) => (
          <PhotoThumb
            key={`${photo.uri}-${index}`}
            photo={photo}
            index={index}
            onRemove={handleRemove}
            disabled={disabled}
          />
        ))}
        {canAddMore ? <AddPhotoButton disabled={disabled} onPress={handleAddPhotos} /> : null}
      </ScrollView>

      {photos.length === 0 ? (
        <Pressable
          onPress={handleAddPhotos}
          disabled={!canAddMore}
          style={({ pressed }) => ({
            marginTop: 8,
            height: 48,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            borderStyle: "dashed",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            opacity: pressed ? 0.7 : canAddMore ? 1 : 0.5,
          })}
        >
          <Ionicons name="images-outline" size={18} color={colors.text} />
          <Text style={{ fontSize: 14, color: colors.text, fontFamily: "Inter_400Regular" }}>
            {t("claims.addPhotos")}
          </Text>
        </Pressable>
      ) : null}

      {photos.length > 0 ? (
        <Text style={{ fontSize: 11, color: colors.muted, marginTop: 8, fontFamily: "Inter_400Regular" }}>
          {t("claims.photoCount", { count: photos.length, max: MAX_CLAIM_EVIDENCE_PHOTOS })}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Inline upload progress indicator shown during claim submission.
 */
export function ClaimEvidenceUploadProgress({
  uploaded,
  total,
}: Readonly<{ uploaded: number; total: number }>): React.ReactElement | null {
  const { t } = useTranslation();

  if (total <= 0) {
    return null;
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
      }}
    >
      <ActivityIndicator size="small" color={colors.accent} />
      <Text style={{ fontSize: 12, color: colors.muted, fontFamily: "Inter_400Regular" }}>
        {t("claims.uploadingPhotos", { current: uploaded, total })}
      </Text>
    </View>
  );
}
