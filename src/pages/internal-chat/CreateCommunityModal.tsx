import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Label, TextInput, Textarea } from "flowbite-react";
import { uploadToMedias } from "../../utils/upload";

export interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: { name: string; description?: string; media_url?: string }) => Promise<void> | void;
}

const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const isValid = useMemo(() => name.trim().length > 0, [name]);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setDescription("");
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      let media_url: string | undefined = undefined;
      if (file) {
        try {
          media_url = await uploadToMedias(file, "communities");
        } catch (e) {
          console.error("[CreateCommunityModal] upload failed", e);
        }
      }
      await onCreate({ name: name.trim(), description: description.trim() || undefined, media_url });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={isOpen} size="md" onClose={onClose} popup>
      <Modal.Header />
      <Modal.Body>
        <div className="space-y-4">
          <h3 className="text-xl font-medium text-gray-900 dark:text-white">Create Community</h3>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="community-name" value="Community name" />
            </div>
            <TextInput
              id="community-name"
              placeholder="e.g. Engineering"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="community-description" value="Description (optional)" />
            </div>
            <Textarea
              id="community-description"
              rows={3}
              placeholder="What is this community about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="community-image" value="Community image (optional)" />
            </div>
            <input id="community-image" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button color="gray" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button color="blue" onClick={handleSubmit} isProcessing={submitting} disabled={!isValid || submitting}>
              Create
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default CreateCommunityModal;


