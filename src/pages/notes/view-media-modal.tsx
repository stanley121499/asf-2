import React, { useState, useEffect } from "react";
import { Button, Modal } from "flowbite-react";
import { CiImageOn } from "react-icons/ci";

interface ViewMediaModalProps {
  mediaURL: string;
}

const ViewMediaModal: React.FC<ViewMediaModalProps> = function ({ mediaURL }) {
  const [isOpen, setOpen] = useState(false);
  const [loadedImageURL, setLoadedImageURL] = useState<string | null>(null);
  const fileURL = "https://xazikwjmkxixuxbmpynb.supabase.co/storage/v1/object/public/notes/" + mediaURL;

  // Preload image when modal is about to open
  useEffect(() => {
    if (isOpen && mediaURL) {
      const img = new Image();
      img.onload = () => setLoadedImageURL(fileURL);
      img.src = fileURL;
    }
  }, [fileURL, isOpen, mediaURL]);

  return (
    <>
      <Button color="primary" onClick={() => setOpen(true)}>
        <div className="flex items-center gap-x-3">
          <CiImageOn className="text-sm" />
          View Media
        </div>
      </Button>
      <Modal onClose={() => {
        setOpen(false);
        setLoadedImageURL(null); // Reset loaded image when closing
      }} show={isOpen} size="2xl">
        <Modal.Header className="border-b border-gray-200 !p-6 dark:border-gray-700">
          <strong>View Media</strong>
        </Modal.Header>
        <Modal.Body>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-1">
            {loadedImageURL ? (
              <img
                className="object-contain w-full h-full"
                src={loadedImageURL}
                alt={mediaURL}
              />
            ) : (
              <p>Loading...</p> // Show loading text or spinner while image loads
            )}
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ViewMediaModal;
