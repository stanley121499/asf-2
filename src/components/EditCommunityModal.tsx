import React, { useState, useRef } from "react";
import { FiX, FiUpload } from "react-icons/fi";
import { useCommunityContext } from "../context/CommunityContext";
import { uploadToMedias } from "../utils/upload";

interface EditCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updatedCommunity: { id: string; name: string; description?: string | null; media_url: string | null }) => void;
  community: {
    id: string;
    name: string | null;
    description?: string | null;
    media_url: string | null;
  } | null;
}

const EditCommunityModal: React.FC<EditCommunityModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  community,
}) => {
  const [name, setName] = useState(community?.name || "");
  const [description, setDescription] = useState(community?.description || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(community?.media_url || null);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { updateCommunity } = useCommunityContext();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!community || !name.trim()) return;

    setIsUpdating(true);
    try {
      let newMediaUrl = community.media_url;

      if (imageFile) {
        // Upload new image
        const uploadedUrl = await uploadToMedias(imageFile);
        newMediaUrl = uploadedUrl;
      } else if (imagePreview === null) {
        // User removed the image
        newMediaUrl = null;
      }

      // Update community
      await updateCommunity(community.id, {
        name: name.trim(),
        description: description.trim() || null,
        media_url: newMediaUrl,
      });

      // Notify parent component with updated data
      const updatedCommunity = {
        id: community.id,
        name: name.trim(),
        description: description.trim() || null,
        media_url: newMediaUrl,
      };
      
      if (onSaved) {
        onSaved(updatedCommunity);
      }

      onClose();
    } catch (error) {
      console.error("Error updating community:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const resetForm = () => {
    setName(community?.name || "");
    setDescription(community?.description || "");
    setImageFile(null);
    setImagePreview(community?.media_url || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Reset form when modal opens with new community data
  React.useEffect(() => {
    if (isOpen && community) {
      resetForm();
    }
  }, [isOpen, community]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen || !community) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Community
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Community Picture */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Community Picture
            </label>
            <div className="flex items-center space-x-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Community preview"
                    className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-600"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    <FiX size={12} />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                  <FiUpload className="text-gray-400" size={20} />
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                >
                  Choose Image
                </button>
              </div>
            </div>
          </div>

          {/* Community Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Community Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter community name"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {name.length}/100 characters
            </p>
          </div>

          {/* Community Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              placeholder="Enter community description"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {description.length}/500 characters
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            disabled={isUpdating}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isUpdating || !name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isUpdating && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{isUpdating ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCommunityModal;
