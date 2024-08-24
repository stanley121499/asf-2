// src/components/Sidebar.tsx

import React from "react";
import { useDrag } from "react-dnd";
import { Card, Button } from "flowbite-react";

interface SidebarElementProps {
  type: string;
  label: string;
}

interface SidebarProps {
  onSave: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onSave }) => {
  const elementsList: SidebarElementProps[] = [
    { type: "category", label: "Category" },
    { type: "product", label: "Product" },
    // { type: "promotion", label: "Promotion" },
  ];

  return (
    <div className="w-1/4 h-full bg-white dark:bg-gray-900 p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        {/* Title: Home Page Builder */}
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Home Page Builder
        </h2>

        {/* Save Button */}
        <Button size="md" color={"blue"} onClick={onSave}>
          Save
        </Button>
      </div>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Elements
      </h2>
      <ul className="space-y-4">
        {elementsList.map((element) => (
          <SidebarElement key={element.type} element={element} />
        ))}
      </ul>
    </div>
  );
};

const SidebarElement: React.FC<{ element: SidebarElementProps }> = ({
  element,
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: element.type,
    item: { type: element.type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // Attach the ref directly to the element that should be draggable
  return (
    <li className="cursor-pointer">
      <div
        ref={drag}
        className={`transition-opacity duration-300 ${
          isDragging ? "opacity-50" : "opacity-100"
        }`}>
        <Card className="hover:shadow-lg">
          <div className="flex justify-between items-center p-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {element.label}
            </span>
            <Button size="xs" gradientDuoTone="cyanToBlue">
              Add
            </Button>
          </div>
        </Card>
      </div>
    </li>
  );
};

export { Sidebar };
