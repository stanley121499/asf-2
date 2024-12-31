import React from "react";
import ModalImage from "react-modal-image";
import { Button, Modal } from "flowbite-react";

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  media: {
    type: string;
    src: string;
  };
}

const MediaViewer: React.FC<MediaViewerProps> = ({
  isOpen,
  onClose,
  media,
}) => {
  return (
    <Modal show={isOpen} onClose={onClose} size="6xl">
      <Modal.Header className="dark:bg-gray-800">
        Media Viewer
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {" "}
          Click on the media to open in full screen
        </span>
      </Modal.Header>
      <Modal.Body className="max-h-[500px] overflow-auto">
        {media.type === "image" ? (
          <ModalImage
            small={media.src}
            large={media.src}
            alt="Media"
            className="h-full w-full object-cover"
          />
        ) : media.type === "video" ? (
          <video src={media.src} controls className="w-full h-96" />
        ) : media.type === "audio" ? (
          <audio src={media.src} controls className="w-full" />
        ) : media.type === "document" ? (
          <iframe
            src={media.src}
            title="Document Viewer"
            className="w-full h-96"
          />
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button color="primary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MediaViewer;
