import { Badge, Button } from "flowbite-react";
import React, { useEffect, useState } from "react";

interface PostProps {
  name: string;
  price: number;
  color: string[];
  size: string[];
  medias: string[];
  description: string;
  warranty_period?: string;
  warranty_description?: string;
  previewMedia?: string;
}

const ProductComponent: React.FC<PostProps> = ({
  name,
  price,
  color,
  size,
  medias,
  description,
  warranty_period,
  warranty_description,
  previewMedia,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-scroll images every 3 seconds (reduced from 1s to prevent CPU heating).
  // Paused when the page is hidden (screen off / app backgrounded).
  useEffect(() => {
    if (medias.length <= 1) {
      setCurrentIndex(0);
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const start = (): void => {
      if (document.visibilityState === "visible") {
        intervalId = setInterval(() => {
          setCurrentIndex((current) => (current + 1) % medias.length);
        }, 3000);
      }
    };

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "hidden") {
        if (intervalId !== null) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } else {
        start();
      }
    };

    start();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalId !== null) clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [medias.length]);

  return (
    <div>
      {/* Image */}
      {/* Check if there is previewMedia if so show that only if not, show medias */}
      {previewMedia ? (
        <img
          src={previewMedia}
          alt="Preview"
          className="h-96 w-full object-cover"
        />
      ) : (
        <img
          src={medias[currentIndex]}
          alt="Media"
          className="h-96 w-full object-cover"
        />
      )}

      {/* Name */}
      <h1 className="text-lg font-semibold text-gray-900 w-full p-2 pb-0">
        {name}
      </h1>

      {/* Description */}
      <p className="text-sm text-gray-900 w-full p-2 pb-0">{description}</p>

      {/* Warranty Information */}
      {(warranty_period || warranty_description) && (
        <div className="p-2 pb-0">
          {warranty_period && (
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Warranty:</span> {warranty_period}
            </p>
          )}
          {warranty_description && (
            <p className="text-xs text-gray-600 mt-1">
              {warranty_description}
            </p>
          )}
        </div>
      )}

      {/* Price */}
      {/* Show in two decimal place */}
      <p className="text-sm text-gray-900 w-full p-2">RM{price.toFixed(2)}</p>

      {/* Color */}
      <div className="flex gap-2 p-2 flex-wrap">
        <p className="text-md font-semibold text-gray-900">Colors</p>
        {color.map((color) => (
          <Badge key={color} color={"blue"} className="mr-2 w-fit pl-4 pr-4">
            {color}
          </Badge>
        ))}
      </div>

      {/* Size */}
      {/* If overflow wrap down */}
      <div className="flex gap-2 p-2 flex-wrap">
        <p className="text-md font-semibold text-gray-900">Sizes</p>
        {size.map((size) => (
          <Badge key={size} color="gray" className="mr-2 w-fit pl-4 pr-4">
            {size}
          </Badge>
        ))}
      </div>

      <div className="flex flex-col gap-4 p-2">
        <Button className="btn btn-primary w-full">Buy Now</Button>

        {/* Black outline add to cart button */}
        <Button color="gray" className="w-full">
          Add to Cart
        </Button>
      </div>
    </div>
  );
};

export default ProductComponent;
