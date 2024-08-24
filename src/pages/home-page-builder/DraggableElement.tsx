// src/components/DraggableElement.tsx

import React from "react";
import { useDrop, useDrag } from "react-dnd";
import { XYCoord } from "dnd-core";
import { BsChevronRight } from "react-icons/bs";
import { ElementProps } from "../../types/dnd";
import { useCategoryContext } from "../../context/product/CategoryContext";
import { useProductContext } from "../../context/product/ProductContext";
import { useProductMediaContext } from "../../context/product/ProductMediaContext";

interface DraggableElementProps {
  element: ElementProps;
  index: number;
  moveElement: (dragIndex: number, hoverIndex: number) => void;
  onSelectElement: (id: string) => void;
  onUpdateElement: (
    id: string,
    updatedProperties: Partial<ElementProps["properties"]>
  ) => void;
}

const DraggableElement: React.FC<DraggableElementProps> = ({
  element,
  index,
  moveElement,
  onSelectElement,
  onUpdateElement,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const { categories } = useCategoryContext(); // Use category context
  const { products } = useProductContext(); // Use product context
  // const { getPromotionById } = usePromotionContext(); // Use promotion context

  // Fetch the relevant data based on targetId
  const category = element.properties.targetId
    ? categories.find((cat) => cat.id === element.properties.targetId)
    : null;
  const product = element.properties.targetId
    ? products.find((prod) => prod.id === element.properties.targetId)
    : null;
  // const promotion = element.properties.targetId ? getPromotionById(element.properties.targetId) : null;
  const { productMedias } = useProductMediaContext();
  const productMedia = productMedias.filter(
    (media) => media.product_id === product?.id
  );

  const [{ handlerId }, drop] = useDrop<
    { index: number; id: string; type: string },
    void,
    { handlerId: string | symbol | null }
  >({
    accept: "canvas-element",
    collect: (monitor) => ({
      handlerId: monitor.getHandlerId(),
    }),
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveElement(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: "canvas-element",
    item: () => ({
      id: element.id,
      index,
      type: "canvas-element",
      properties: element.properties,
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="mb-4 p-4 cursor-move rounded-lg shadow-sm bg-transparent"
      onClick={() => onSelectElement(element.id)}
      data-handler-id={handlerId}>
      {!element.properties.targetId ? (
        <>
          {element.type === "promotion" && (
            <div className="animate-pulse space-y-4">
              {" "}
              <div className="h-40 bg-gray-200 rounded-lg"></div>
            </div>
          )}
          {element.type === "product" && (
            <div className="animate-pulse space-y-4">
              <div className="h-40 bg-gray-200 rounded-lg"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              </div>
            </div>
          )}
          {element.type === "category" && (
            <div className="flex items-center space-x-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex-grow w-20 h-20 bg-gray-200 rounded-lg"></div>
              ))}
              <BsChevronRight className="text-gray-400 ml-auto" />
            </div>
          )}
        </>
      ) : (
        <>
          {/* {element.type === "promotion" && promotion && (
            <div
              className="w-full h-40 bg-gray-200 rounded-lg"
              style={{
                backgroundImage: `url(${promotion.imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <p className="text-white p-2">{promotion.name}</p>
            </div>
          )} */}

          {element.type === "product" && product && (
            <div className="space-y-4">
              <div
                className="w-full h-40 bg-gray-200 rounded-lg"
                style={{
                  backgroundImage: `url(${productMedia[0].media_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}></div>
              <div className="space-y-2 flex justify-between items-center">
                {/* Left Side: Name and Description */}
                <div className="text-left">
                  <h3 className="text-lg font-bold text-black truncate">
                    {product?.name || "Product Name"}
                  </h3>
                  <p className="mt-2 text-sm text-black line-clamp-2">
                    {product?.description || "No description available."}
                  </p>
                  <span className="text-md font-bold text-indigo-600">
                    RM {product?.price?.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {element.type === "category" && category && (
            <div className="flex items-center space-x-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex-grow w-20 h-20 bg-gray-200 rounded-lg"
                  style={{
                    backgroundImage: `url(${category.media_url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}>
                  {/* <p className="text-white p-2">{category.name}</p> */}
                </div>
              ))}
              <BsChevronRight className="text-gray-400 ml-auto" />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export { DraggableElement };
