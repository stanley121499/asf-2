import React, { useState, useRef } from "react";
import { FiX, FiUpload, FiEdit3 } from "react-icons/fi";
import { useGroupContext } from "../context/GroupContext";
import { uploadToMedias } from "../utils/upload";

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updatedGroup: { id: string; name: string; description?: string | null; media_url: string | null }) => void;
  group: {
    id: string;
    name: string | null;
    description?: string | null;
    media_url: string | null;
  } | null;
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  group,
}) => {
  const [name, setName] = useState(group?.name || "");
  const [description, setDescription] = useState(group?.description || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(group?.media_url || null);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { updateGroup } = useGroupContext();

  // Reset form when group changes or modal opens
  React.useEffect(() => {
    if (isOpen && group) {
      setName(group.name || "");
      setDescription(group.description || "");
      setImageFile(null);
      setImagePreview(group.media_url || null);
    }
  }, [isOpen, group]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!group || !name.trim()) return;

    setIsUpdating(true);

    try {
      let newMediaUrl = group.media_url;

      // Upload new image if one was selected
      if (imageFile) {
        newMediaUrl = await uploadToMedias(imageFile, "group-images");
      } else if (imagePreview === null) {
        // User removed the image
        newMediaUrl = null;
      }

      // Update group
      await updateGroup(group.id, {
        name: name.trim(),
        description: description.trim() || null,
        media_url: newMediaUrl,
      });

      // Notify parent component with updated data
      const updatedGroup = {
        id: group.id,
        name: name.trim(),
        description: description.trim() || null,
        media_url: newMediaUrl,
      };
      
      if (onSaved) {
        onSaved(updatedGroup);
      }

      onClose();
    } catch (error) {
      console.error("Error updating group:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-gray-900 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <FiEdit3 className="mr-3" size={24} />
            Edit Group
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Group Image */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Group Picture
            </label>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Group preview"
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">
                      {name.charAt(0).toUpperCase() || "G"}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <FiUpload className="mr-2" size={16} />
                  Upload Picture
                </button>
                
                {imagePreview && (
                  <button
                    onClick={handleRemoveImage}
                    className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <FiX className="mr-2" size={16} />
                    Remove Picture
                  </button>
                )}
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Group Name */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              placeholder="Enter group name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {name.length}/50 characters
            </p>
          </div>

          {/* Group Description */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              placeholder="Describe what this group is about..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {description.length}/200 characters
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || isUpdating}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isUpdating ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditGroupModal;
