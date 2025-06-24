import { Button, Label, Modal, TextInput, Card } from "flowbite-react";
import React, { useState, useEffect, useCallback } from "react";
import { HiPlus, HiPencil, HiTrash } from "react-icons/hi";
import { IoIosSearch } from "react-icons/io";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import { useAlertContext } from "../../context/AlertContext";

/**
 * Interface for category items in the v2 system
 */
interface CategoryV2Item {
  id: string;
  name: string;
  description: string;
  group: "department" | "brand" | "range" | "category";
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for the modal form data
 */
interface ModalData {
  name: string;
  description: string;
}

/**
 * Type for group counts
 */
type GroupCounts = {
  [K in CategoryV2Item["group"]]: number;
};

/**
 * CategoryV2 Page Component
 * Manages four groups: department, brand, range, and category
 * Data is stored in localStorage for temporary persistence
 */
const CategoryV2Page: React.FC = function () {
  const [items, setItems] = useState<CategoryV2Item[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchValue, setSearchValue] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentGroup, setCurrentGroup] = useState<CategoryV2Item["group"]>("department");
  const [editingItem, setEditingItem] = useState<CategoryV2Item | null>(null);
  const [modalData, setModalData] = useState<ModalData>({
    name: "",
    description: "",
  });

  const { showAlert } = useAlertContext();

  // LocalStorage key for data persistence
  const STORAGE_KEY = "categoryV2Items";

  /**
   * Load data from localStorage on component mount only
   */
  useEffect(() => {
    const savedItems = localStorage.getItem(STORAGE_KEY);
    if (savedItems) {
      try {
        const parsedItems: CategoryV2Item[] = JSON.parse(savedItems);
        console.log("Loading items from localStorage:", parsedItems);
        setItems(parsedItems);
      } catch (error) {
        console.error("Error parsing saved items:", error);
        showAlert("Error loading saved data", "error");
      }
    }
    setIsLoading(false);
  }, []); // Only run on mount

  /**
   * Save data to localStorage whenever items change (with debouncing)
   */
  useEffect(() => {
    // Don't save during initial loading
    if (isLoading) {
      console.log("Skipping save during initial load");
      return;
    }

    console.log("Saving items to localStorage:", items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, isLoading]);



  /**
   * Get items count for each group
   */
  const getGroupCounts = useCallback((): GroupCounts => {
    return {
      department: items.filter((item: CategoryV2Item) => item.group === "department").length,
      brand: items.filter((item: CategoryV2Item) => item.group === "brand").length,
      range: items.filter((item: CategoryV2Item) => item.group === "range").length,
      category: items.filter((item: CategoryV2Item) => item.group === "category").length,
    };
  }, [items]);

  /**
   * Open modal for creating new item
   */
  const handleCreateItem = (group: CategoryV2Item["group"]): void => {
    setModalMode("create");
    setCurrentGroup(group);
    setModalData({ name: "", description: "" });
    setEditingItem(null);
    setIsModalOpen(true);
  };

  /**
   * Open modal for editing existing item
   */
  const handleEditItem = (item: CategoryV2Item): void => {
    setModalMode("edit");
    setCurrentGroup(item.group);
    setModalData({ name: item.name, description: item.description });
    setEditingItem(item);
    setIsModalOpen(true);
  };

  /**
   * Save item (create or update)
   */
  const handleSaveItem = (): void => {
    if (!modalData.name.trim()) {
      showAlert("Name is required", "error");
      return;
    }

    const now = new Date().toISOString();

    if (modalMode === "create") {
      const newItem: CategoryV2Item = {
        id: `${currentGroup}_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        name: modalData.name.trim(),
        description: modalData.description.trim(),
        group: currentGroup,
        createdAt: now,
        updatedAt: now,
      };

      setItems((prev: CategoryV2Item[]) => {
        const newItems = [...prev, newItem];
        console.log("Adding new item:", newItem);
        console.log("New items array:", newItems);
        return newItems;
      });
      
      // Clear search to show the newly created item
      setSearchValue("");
      
      showAlert(`${currentGroup.charAt(0).toUpperCase() + currentGroup.slice(1)} created successfully`, "success");
    } else if (editingItem) {
      setItems((prev: CategoryV2Item[]) => prev.map((item: CategoryV2Item) => 
        item.id === editingItem.id 
          ? { ...item, name: modalData.name.trim(), description: modalData.description.trim(), updatedAt: now }
          : item
      ));
      showAlert(`${editingItem.group.charAt(0).toUpperCase() + editingItem.group.slice(1)} updated successfully`, "success");
    }

    setIsModalOpen(false);
    setModalData({ name: "", description: "" });
    setEditingItem(null);
  };

  /**
   * Delete item
   */
  const handleDeleteItem = (item: CategoryV2Item): void => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      setItems((prev: CategoryV2Item[]) => prev.filter((i: CategoryV2Item) => i.id !== item.id));
      showAlert(`${item.group.charAt(0).toUpperCase() + item.group.slice(1)} deleted successfully`, "success");
    }
  };

  /**
   * Clear all data
   */
  const handleClearAllData = (): void => {
    if (window.confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      console.log("Clearing all data");
      localStorage.removeItem(STORAGE_KEY);
      setItems([]);
      showAlert("All data cleared successfully", "success");
    }
  };

  const groupCounts = getGroupCounts();
  const groupLabels: Record<CategoryV2Item["group"], string> = {
    department: "Department",
    brand: "Brand", 
    range: "Range",
    category: "Category"
  };

  return (
    <NavbarSidebarLayout>
      {/* Header */}
      <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
        <div className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-3">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                Category V2 Management
              </h1>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({items.length} total items)
              </span>
            </div>
            <div className="flex items-center gap-x-3">
              <Button color="failure" onClick={handleClearAllData}>
                Clear All Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col p-4">
     
        
        {/* Search Controls */}
        <div className="mb-6">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <TextInput
            id="search"
            name="search"
            placeholder="Search across all groups..."
            value={searchValue}
            icon={IoIosSearch}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        {/* Groups with their items in 4 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(Object.keys(groupLabels) as Array<keyof typeof groupLabels>).map((group) => {
            const groupItems = items.filter((item: CategoryV2Item) => {
              const belongsToGroup = item.group === group;
              const matchesSearch = searchValue === "" || 
                item.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                item.description.toLowerCase().includes(searchValue.toLowerCase());
              return belongsToGroup && matchesSearch;
            });

            return (
              <div key={group} className="flex flex-col space-y-4">
                {/* Group Header Card */}
                <Card className="hover:shadow-lg transition-shadow">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {groupLabels[group]}
                      </h3>
                      <Button
                        color="primary"
                        size="sm"
                        onClick={() => handleCreateItem(group)}
                      >
                        <HiPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {groupItems.length} items
                    </p>
                  </div>
                </Card>

                {/* Items for this group */}
                <div className="space-y-3 min-h-[200px]">
                  {groupItems.length > 0 ? (
                    groupItems.map((item: CategoryV2Item) => (
                      <Card key={`item-${item.id}-${item.updatedAt}`} className="hover:shadow-md transition-shadow">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                item.group === 'department' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                item.group === 'brand' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                item.group === 'range' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                              }`}>
                                {groupLabels[item.group]}
                              </span>
                              <h4 className="mt-2 font-semibold text-gray-900 dark:text-white text-sm truncate">
                                {item.name}
                              </h4>
                              {item.description && (
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                            <div className="flex items-center gap-1">
                              <Button
                                color="info"
                                size="xs"
                                onClick={() => handleEditItem(item)}
                              >
                                <HiPencil className="h-3 w-3" />
                              </Button>
                              <Button
                                color="failure"
                                size="xs"
                                onClick={() => handleDeleteItem(item)}
                              >
                                <HiTrash className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 px-2">
                        {searchValue 
                          ? `No ${groupLabels[group].toLowerCase()} items match your search.`
                          : `No ${groupLabels[group].toLowerCase()} items yet. Click + above to create one.`
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal onClose={() => setIsModalOpen(false)} show={isModalOpen}>
        <Modal.Header className="border-b border-gray-200 !p-6 dark:border-gray-700">
          <strong>
            {modalMode === "create" ? "Add New" : "Edit"} {groupLabels[currentGroup]}
          </strong>
        </Modal.Header>
        <Modal.Body>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <Label htmlFor="item-name">Name *</Label>
              <div className="mt-1">
                <TextInput
                  id="item-name"
                  name="item-name"
                  placeholder={`Enter ${groupLabels[currentGroup].toLowerCase()} name`}
                  value={modalData.name}
                  onChange={(e) =>
                    setModalData({ ...modalData, name: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="item-description">Description</Label>
              <div className="mt-1">
                <textarea
                  id="item-description"
                  name="item-description"
                  rows={3}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                  placeholder={`Enter ${groupLabels[currentGroup].toLowerCase()} description`}
                  value={modalData.description}
                  onChange={(e) =>
                    setModalData({ ...modalData, description: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="gray" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button color="primary" onClick={handleSaveItem}>
            {modalMode === "create" ? "Create" : "Update"} {groupLabels[currentGroup]}
          </Button>
        </Modal.Footer>
      </Modal>
    </NavbarSidebarLayout>
  );
};

export default CategoryV2Page; 