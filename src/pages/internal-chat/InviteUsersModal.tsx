import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Label } from "flowbite-react";

export interface InviteUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: { id: string; email: string }[];
  onInvite: (userIds: string[]) => Promise<void> | void;
  title: string;
}

const InviteUsersModal: React.FC<InviteUsersModalProps> = ({ isOpen, onClose, users, onInvite, title }) => {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const selectedIds = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);

  useEffect(() => {
    if (!isOpen) {
      setSelected({});
      setSubmitting(false);
    }
  }, [isOpen]);

  const toggle = (id: string) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSubmit = async () => {
    if (submitting || selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      await onInvite(selectedIds);
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
          <h3 className="text-xl font-medium text-gray-900 dark:text-white">{title}</h3>
          <div className="space-y-2 max-h-64 overflow-auto">
            {users.map((u) => (
              <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!selected[u.id]} onChange={() => toggle(u.id)} />
                <span className="text-sm text-gray-900 dark:text-gray-100">{u.email}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button color="gray" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button color="blue" onClick={handleSubmit} isProcessing={submitting} disabled={selectedIds.length === 0 || submitting}>
              Invite
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default InviteUsersModal;


