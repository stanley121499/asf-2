import { FiAlertCircle } from "react-icons/fi";
import { Json } from "../../database.types";
import React, { useState } from "react";
import MediaViewer from "./MediaViewer";

interface MessageComponentProps {
  header?: string;
  message?: string;
  media?: string;
  footer?: string;
  date?: string;
  direction?: "inbound" | "outbound";
  status?: string;
  buttons?: (string | null)[];
  headerType?: "VIDEO" | "IMAGE" | "DOCUMENT" | "AUDIO" | "DOCUMENT";
  error?: Json;
}

const MessageComponent: React.FC<MessageComponentProps> = ({
  header,
  message,
  media,
  footer,
  date,
  direction,
  status,
  buttons,
  headerType,
  error,
}) => {
  const isInbound = direction === "inbound";
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<{
    type: string;
    src: string;
  } | null>(null);

  const openMediaViewer = (type: string, src: string) => {
    setCurrentMedia({ type, src });
    setIsViewerOpen(true);
  };

  return (
    <div
      className={`flex items-start gap-2.5 ${
        isInbound ? "" : "flex-row-reverse"
      } max-w-full break-all`}>
      <div
        className={`flex flex-col gap-1 w-full max-w-[320px] ${
          isInbound ? "" : "items-end"
        }`}>
        {date && (
          <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
            {date}
          </span>
        )}
        <div
          className={`flex flex-col leading-1.5 p-2 border-gray-200 rounded-bl-xl rounded-br-xl max-w-full ${
            isInbound
              ? "bg-gray-100 dark:bg-gray-700 rounded-tr-xl"
              : "bg-green-100 dark:bg-green-700 rounded-tl-xl"
          }`}
          style={{ width: "fit-content" }}>
          {header && (
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {header}
            </span>
          )}
          {media && headerType === "IMAGE" && (
            <img
              src={media}
              alt="media"
              className="max-w-[280px] max-h-[360px] w-auto h-auto object-contain rounded-xl cursor-pointer"
              onClick={() => openMediaViewer("image", media)}
            />
          )}
          {media && headerType === "VIDEO" && (
            <video
              src={media}
              controls
              className="max-w-[280px] max-h-[360px] w-auto h-auto object-contain rounded-xl cursor-pointer"
              onClick={() => openMediaViewer("video", media)}
            />
          )}
          {media && headerType === "AUDIO" && (
            <audio
              src={media}
              controls
              className="cursor-pointer"
              onClick={() => openMediaViewer("audio", media)}
            />
          )}
          {media && headerType === "DOCUMENT" && (
            <a
              href={media}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-blue-500 cursor-pointer"
              onClick={() => openMediaViewer("document", media)}>
              {media}
            </a>
          )}

          {message && (
            <span
              className="text-sm font-normal text-gray-900 dark:text-white"
              style={{ whiteSpace: "pre-wrap" }}>
              {message}
            </span>
          )}
          {footer && (
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400 mt-2">
              {footer}
            </span>
          )}
          {buttons && (
            <div className="mt-2">
              {buttons.map((button, index) => (
                <button
                  key={index}
                  className="px-2 w-full py-1 text-xs font-semibold text-blue-500 bg-white rounded-md mt-1">
                  {button}
                </button>
              ))}
            </div>
          )}
        </div>
        {!isInbound && !error && status && (
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {status.toLowerCase()}
          </span>
        )}
        {error && (
          <div className="flex items-center gap-2 mt-1">
            <FiAlertCircle className="text-red-500" />
            <span className="text-xs font-normal text-red-500">
              {(error as any).error_data.details}
            </span>
          </div>
        )}
      </div>

      {/* Media Viewer Modal */}
      {currentMedia && (
        <MediaViewer
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          media={currentMedia}
        />
      )}
    </div>
  );
};

export default MessageComponent;
