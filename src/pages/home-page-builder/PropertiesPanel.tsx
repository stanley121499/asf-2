import React, { ChangeEvent } from "react";
import { Button } from "flowbite-react";
import { useCategoryContext } from "../../context/product/CategoryContext";
import { useProductContext } from "../../context/product/ProductContext";
import { useProductMediaContext } from "../../context/product/ProductMediaContext";

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
  const { productMedias } = useProductMediaContext();

  if (!element || !element.properties) return null;

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    onUpdateElement(element.id, { ...element.properties, [name]: value });
  };

  const handleCardClick = (id: string) => {
    onUpdateElement(element!.id, { ...element!.properties, targetId: id });
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

              {property === "targetId" ? (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {element.type === "category" &&
                    categories.map((category) => (
                      <div
                        key={category.id}
                        className={`relative h-32 rounded-lg cursor-pointer overflow-hidden shadow-lg transition-transform transform hover:scale-105 ${
                          element.properties.targetId === category.id
                            ? "ring-4 ring-indigo-500"
                            : ""
                        }`}
                        onClick={() => handleCardClick(category.id)}
                        style={{
                          backgroundImage: `url(${category.media_url || "/default-category.jpg"})`, // Use a default image if no image is provided
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <div className="absolute inset-0 bg-black opacity-50"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white text-lg font-semibold">
                            {category.name}
                          </span>
                        </div>
                      </div>
                    ))}

                  {element.type === "product" &&
                    products.map((product) => (
                      <div
                        key={product.id}
                        className={`relative h-32 rounded-lg cursor-pointer overflow-hidden shadow-lg transition-transform transform hover:scale-105 ${
                          element.properties.targetId === product.id
                            ? "ring-4 ring-indigo-500"
                            : ""
                        }`}
                        onClick={() => handleCardClick(product.id)}
                        style={{
                          backgroundImage: `url(${
                            productMedias.find(
                              (media) => media.product_id === product.id
                            )?.media_url || "/default-product.jpg"
                          })`, // Use a default image if no image is provided
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <div className="absolute inset-0 bg-black opacity-50"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white text-lg font-semibold">
                            {product.name}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
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
          onClick={() => onDeleteElement(element.id)}
        >
          Delete Element
        </Button>
      </div>
    </div>
  );
};

export { PropertiesPanel };
