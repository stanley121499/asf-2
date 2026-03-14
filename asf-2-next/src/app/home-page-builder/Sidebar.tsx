"use client";
import React from "react";
import { Button, Card } from "flowbite-react";

interface SidebarProps {
  onSave: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSave }) => {
  const elementsList = [
    { type: "category", label: "Category" },
    { type: "product", label: "Product" },
  ];

  return (
    <div className="w-1/4 h-full bg-white dark:bg-gray-900 p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Home Page Builder
        </h2>
        <Button size="md" color="blue" onClick={onSave}>
          Save
        </Button>
      </div>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Elements
      </h2>
      <ul className="space-y-4">
        {elementsList.map((element) => (
          <li key={element.type} className="cursor-pointer">
            <Card className="hover:shadow-lg">
              <div className="flex justify-between items-center p-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {element.label}
                </span>
                <span className="text-xs text-gray-400">drag to canvas</span>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
};
