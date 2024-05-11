import React from "react";

interface PostProps {
  caption: string;
  medias: string[]; // URLs of images or videos
  captionPosition: string;
  ctaText: string;
  photoSize: string; // Optional photo size (e.g., 'h-96 w-full')
}

const PostComponent: React.FC<PostProps> = ({ caption, medias, captionPosition, ctaText, photoSize }) => {
  // Function to determine caption classes based on the position
  const getCaptionClasses = () => {
    switch (captionPosition) {
      case "TOP":
        return "absolute top-0 left-1/2 transform -translate-x-1/2"; // Center top
      case "BOTTOM":
        return "absolute bottom-0 left-0"; // Left bottom
      case "MIDDLE":
        return "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"; // Center
      default:
        return ""; // Default case if needed
    }
  };

  const getPhotoSizeClasses = () => {
    // SMALL | MEDIUM | LARGE
    switch (photoSize) {
      case "SMALL":
        return "h-64 w-full";
      case "MEDIUM":
        return "h-96 w-full";
      case "LARGE":
        return "h-128 w-full";
      default:
        return "h-96 w-full";
    }
  }

  return (
    <div className="relative overflow-hidden bg-black">
      {/* Background image with optional photo size */}
      <div className={`bg-cover bg-center ${getPhotoSizeClasses()}`} style={{ backgroundImage: `url(${medias[0]})` }}>
        {/* Dimmed background overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>

        {/* Caption overlay with dimmed background */}
        <div className={`text-white p-4 ${getCaptionClasses()}`}>
          <p className="text-lg">{caption}</p>
          {/* <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            {ctaText}
          </button> */}
          <p className="mt-4 text-sm">{ctaText}</p>
        </div>
      </div>
    </div>
  );
};

export default PostComponent;
