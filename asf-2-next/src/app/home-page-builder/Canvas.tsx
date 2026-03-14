"use client";
import React from "react";
import { ElementProps } from "@/types/dnd";
import { CiShoppingCart } from "react-icons/ci";
import { CgProfile } from "react-icons/cg";
import { IoMenu } from "react-icons/io5";

interface CanvasProps {
  elements: ElementProps[];
  onDrop: (item: ElementProps) => void;
  onSelectElement: (id: string) => void;
  onMoveElement: (dragIndex: number, hoverIndex: number) => void;
  onUpdateElement: (id: string, updatedProperties: Partial<ElementProps["properties"]>) => void;
}

export const Canvas: React.FC<CanvasProps> = ({ elements, onSelectElement }) => {
  return (
    <div className="flex-1 h-full bg-white relative overflow-y-auto">
      {/* Mock mobile app header */}
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

      {elements.length === 0 && (
        <div className="flex items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg mx-4">
          <p>Add elements from the sidebar</p>
        </div>
      )}

      {elements.map((element) => (
        <div
          key={element.id}
          className="p-3 mx-4 mb-2 border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
          onClick={() => onSelectElement(element.id)}
        >
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
            {element.type}: {element.properties?.targetId || "Not configured"}
          </span>
        </div>
      ))}
    </div>
  );
};
