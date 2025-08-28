// src/components/HomePageBuilder.tsx

import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import React, { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Canvas } from "./Canvas";
import { PropertiesPanel } from "./PropertiesPanel";
import { ElementProps } from "../../types/dnd";
import { useHomePageElementContext } from "../../context/HomePageElementContext";
import { useAlertContext } from "../../context/AlertContext";

const HomePageBuilder: React.FC = () => {
  const [elements, setElements] = useState<ElementProps[]>([]);
  const [selectedElement, setSelectedElement] = useState<ElementProps | null>(
    null
  );
  const {
    elements: existingElements,
    createElement,
    updateElement,
    deleteElement,
  } = useHomePageElementContext();
  const { showAlert } = useAlertContext();

  useEffect(() => {
    // Initialize elements from context when existingElements changes
    if (existingElements && existingElements.length > 0) {
      // Convert context elements to local state format
      const localElements = existingElements
        .filter((element): element is typeof element & { type: string; targetId: string } => 
          element.type !== null && element.targetId !== null
        )
        .map((element) => ({
          id: element.id,
          type: element.type,
          properties: {
            targetId: element.targetId,
            amount: element.amount || 0,
            contentType: element.contentType || "",
          },
        }));
      setElements(localElements);
    }
  }, [existingElements]);
  const handleDrop = (item: ElementProps) => {
    setElements((prev) => [...prev, item]);
  };

  const handleSelectElement = (id: string) => {
    const element = elements.find((el) => el.id === id);
    if (element) setSelectedElement(element);
  };

  const handleUpdateElement = (
    id: string,
    newProperties: Record<string, any>
  ) => {
    setElements((prev) =>
      prev.map((el) =>
        el.id === id ? { ...el, properties: newProperties } : el
      )
    );
    // Update the selected element in case it's currently selected
    if (selectedElement && selectedElement.id === id) {
      setSelectedElement({ ...selectedElement, properties: newProperties });
    }
  };

  const handleMoveElement = (dragIndex: number, hoverIndex: number) => {
    const updatedElements = [...elements];
    const [removed] = updatedElements.splice(dragIndex, 1);
    updatedElements.splice(hoverIndex, 0, removed);
    setElements(updatedElements);
  };

  const handleDeleteElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedElement && selectedElement.id === id) {
      setSelectedElement(null);
    }
  };

  const handleSave = () => {
    // Use elements.id to check in existingElements.id, if match update, else create, then remove the rest
    elements.forEach((element) => {
      const existingElement = existingElements.find(
        (el) => el.id === element.id
      );
      if (existingElement) {
        updateElement({
          id: element.id,
          targetId: element.properties.targetId,
          type: element.type,
          arrangement: elements.indexOf(element),
        });
      } else {
        if (!element.properties.targetId) {
          showAlert("Please select a target for the element", "error");
          return;
        }
        createElement({
          targetId: element.properties.targetId,
          type: element.type,
          arrangement: elements.indexOf(element),
        });
      }
    });

    existingElements.forEach((element) => {
      if (!elements.find((el) => el.id === element.id)) {
        deleteElement(element.id);
      }
    });
  };
  return (
    <NavbarSidebarLayout>
      <div className="flex flex-row w-full h-full bg-gray-100 dark:bg-gray-800 overflow-hidden h-screen">
        <Sidebar onSave={handleSave} />
        <Canvas
          elements={elements}
          onDrop={handleDrop}
          onSelectElement={handleSelectElement}
          onMoveElement={handleMoveElement}
          onUpdateElement={handleUpdateElement}
        />
        <PropertiesPanel
          element={selectedElement}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
        />
      </div>
    </NavbarSidebarLayout>
  );
};

export default HomePageBuilder;
