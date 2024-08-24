// src/components/Canvas.tsx

import React from "react";
import { useDrop } from "react-dnd";
import { ElementProps } from "../../types/dnd";
import { DraggableElement } from "./DraggableElement";
import { CiShoppingCart } from "react-icons/ci";
import { CgProfile } from "react-icons/cg";
import { IoMenu } from "react-icons/io5";

interface CanvasProps {
  elements: ElementProps[];
  onDrop: (item: ElementProps) => void;
  onSelectElement: (id: string) => void;
  onMoveElement: (dragIndex: number, hoverIndex: number) => void;
  onUpdateElement: (
    id: string,
    updatedProperties: Partial<ElementProps["properties"]>
  ) => void;
}

const Canvas: React.FC<CanvasProps> = ({
  elements,
  onDrop,
  onSelectElement,
  onMoveElement,
  onUpdateElement,
}) => {
  const [, drop] = useDrop({
    accept: ["promotion", "product", "category"],
    drop: (item: any) => {
      const newElement: ElementProps = {
        id: `element-${elements.length + 1}`,
        type: item.type,
        properties: item.properties || {
          targetId: "",
          amount: 0,
          contentType: "",
        },
      };
      onDrop(newElement);
    },
  });

  return (
    <div
      ref={drop}
      className="flex-1 h-full bg-white relative overflow-y-auto hide-scrollbar">
      {/* Mimic a header of a mobile app for an e-commerce app */}
      <div className="w-full h-12 bg-white flex items-center justify-center mb-4 shadow-sm">
        <div className="absolute left-4">
          <IoMenu className="text-2xl text-gray-600" />
        </div>
        <div className="flex items-center justify-center">
          <CiShoppingCart className="text-2xl text-gray-600" />
          <span className="text-gray-600 ml-2">Shop</span>
        </div>
        <div className="absolute right-4">
          <CgProfile className="text-2xl text-gray-600" />
        </div>
      </div>

      {elements.map((element, index) => (
        <DraggableElement
          key={element.id}
          index={index}
          element={element}
          moveElement={onMoveElement}
          onSelectElement={onSelectElement}
          onUpdateElement={onUpdateElement}
        />
      ))}
    </div>
  );
};

export { Canvas };
