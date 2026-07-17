import * as ImagePicker from "expo-image-picker";

/** Local photo selected before upload. */
export interface PickedClaimPhoto {
  uri: string;
  mimeType: string | null;
}

export type ClaimPhotoSource = "camera" | "library";

/**
 * Requests camera or media-library permission for the chosen source.
 */
export async function requestClaimPhotoPermission(source: ClaimPhotoSource): Promise<boolean> {
  if (source === "camera") {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === "granted";
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === "granted";
}

/**
 * Opens the device camera and returns one photo, or null when cancelled.
 */
export async function takeClaimPhoto(): Promise<PickedClaimPhoto | null> {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 0.85,
    allowsEditing: false,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? null,
  };
}

/**
 * Opens the photo library and returns up to `remainingSlots` images.
 */
export async function pickClaimPhotosFromLibrary(remainingSlots: number): Promise<PickedClaimPhoto[]> {
  if (remainingSlots <= 0) {
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: remainingSlots > 1,
    quality: 0.85,
    selectionLimit: remainingSlots,
  });

  if (result.canceled) {
    return [];
  }

  return result.assets.map((asset) => ({
    uri: asset.uri,
    mimeType: asset.mimeType ?? null,
  }));
}
