import { Badge, Button } from "flowbite-react";
import React, { useEffect, useState } from "react";

interface PostProps {
  name: string;
  price: number;
  color: string[];
  size: string[];
  medias: string[];
  description: string;
  previewMedia?: string;
}

const ProductComponent: React.FC<PostProps> = ({ name, price, color, size, medias, description, previewMedia }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-scroll images
  useEffect(() => {
    if (medias.length <= 1) { setCurrentIndex(0); return; } // No need to scroll if there's only one images

    const intervalId = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % medias.length);
    }, 1000);

    return () => clearInterval(intervalId); // Clean up the interval on component unmount
  }, [medias.length]);

  return (
    <div>
      {/* Image */}
      {/* Check if there is previewMedia if so show that only if not, show medias */}
      {previewMedia ? (
        <img src={previewMedia} alt="Preview" className="h-96 w-full object-cover" />
      ) : (
        <img src={medias[currentIndex]} alt="Media" className="h-96 w-full object-cover" />
      )}

      {/* Name */}
      <h1 className="text-lg font-semibold text-gray-900 w-full p-2 pb-0" >{name}</h1>

      {/* Description */}
      <p className="text-sm text-gray-900 w-full p-2 pb-0" >{description}</p>

      {/* Price */}
      {/* Show in two decimal place */}
      <p className="text-sm text-gray-900 w-full p-2" >RM{price.toFixed(2)}</p>

      {/* Color */}
      <div className="flex gap-2 p-2 flex-wrap">
        <p className="text-md font-semibold text-gray-900" >Colors</p>
        {color.map((color) => (
          <Badge key={color} color={"blue"} className="mr-2 w-fit pl-4 pr-4">
            {color}
          </Badge>
        ))}
      </div>

      {/* Size */}
      {/* If overflow wrap down */}
      <div className="flex gap-2 p-2 flex-wrap">
        <p className="text-md font-semibold text-gray-900" >Sizes</p>
        {size.map((size) => (
          <Badge key={size} color="gray" className="mr-2 w-fit pl-4 pr-4">
            {size}
          </Badge>
        ))}
      </div>

      <div className="flex flex-col gap-4 p-2">

        <Button className="btn btn-primary w-full">
          Buy Now
        </Button>

        {/* Black outline add to cart button */}
        <Button color="gray" className="w-full">
          Add to Cart
        </Button>
      </div>
    </div>

  );
};

export default ProductComponent;
