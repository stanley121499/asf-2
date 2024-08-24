// src/components/PropertiesPanel.tsx

import React, { ChangeEvent } from "react";
import { Button, Select } from "flowbite-react"; // Import Select from flowbite-react
import { useCategoryContext } from "../../context/product/CategoryContext";
import { useProductContext } from "../../context/product/ProductContext";

interface PropertiesPanelProps {
  element: { id: string; type: string; properties: Record<string, any> } | null;
  onUpdateElement: (id: string, newProperties: Record<string, any>) => void;
  onDeleteElement: (id: string) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  element,
  onUpdateElement,
  onDeleteElement,
}) => {
  const { categories } = useCategoryContext();
  const { products } = useProductContext();
  if (!element || !element.properties) return null;

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    onUpdateElement(element.id, { ...element.properties, [name]: value });
  };

  return (
    <div className="w-1/4 h-full bg-white dark:bg-gray-900 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
        Properties
      </h2>
      <div className="mt-4">
        {Object.keys(element.properties)
        // Temp: Skip the contentType and amount properties
        .filter((property) => property !== "contentType" && property !== "amount")
        .map((property) => (
          <div key={property} className="mb-4">
            <label className="block text-gray-600 dark:text-gray-400 capitalize">
              {property === "targetId" ? element.type : property}
            </label>

            {property === "contentType" ? (
              // <Select
              //   name={property}
              //   value={element.properties[property] || ""}
              //   onChange={handleChange}
              //   className="w-full p-2 rounded"
              // >
              //   <option value="text">Text</option>
              //   <option value="image">Image</option>
              //   <option value="button">Button</option>
              // </Select>
              <></>
            ) : property === "amount" ? (
              // <Select
              //   name={property}
              //   value={element.properties[property] || ""}
              //   onChange={handleChange}
              //   className="w-full p-2 rounded"
              // >
              //   <option value="1">1</option>
              //   <option value="2">2</option>
              //   <option value="3">3</option>
              // </Select>
              <></>
            ) : property === "targetId" ? (
              <Select
                name={property}
                value={element.properties[property] || ""}
                onChange={handleChange}
                className="w-full p-2 rounded">
                <option value="">Select an option</option>
                {element.type === "category" &&
                  categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}

                {element.type === "product" &&
                  products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
              </Select>
            ) : (
              <input
                type="text"
                name={property}
                value={element.properties[property] || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded dark:bg-gray-800 dark:text-gray-200"
              />
            )}
          </div>
        ))}

        <Button
          size="md"
          color="red"
          className="w-full"
          onClick={() => onDeleteElement(element.id)}>
          Delete Element
        </Button>
      </div>
    </div>
  );
};

export { PropertiesPanel };
