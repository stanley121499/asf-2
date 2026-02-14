import React, { useCallback, useMemo, useState } from "react";
import { Badge, Button, Card, Dropdown, Tooltip } from "flowbite-react";
import { Link } from "react-router-dom";
import {
  HiDotsVertical,
  HiOutlineHeart,
  HiOutlineShoppingCart,
  HiOutlineTrash,
} from "react-icons/hi";
import NavbarHome from "../../components/navbar-home";
import { useAlertContext } from "../../context/AlertContext";
import { useWishlistContext } from "../../context/WishlistContext";
import { useCategoryContext } from "../../context/product/CategoryContext";
import type { ProductMedia } from "../../context/product/ProductMediaContext";
import { useProductMediaContext } from "../../context/product/ProductMediaContext";

type SortBy = "addedOn" | "priceAsc" | "priceDesc" | "nameAsc" | "nameDesc";

interface DisplayWishlistItem {
  wishlistId: string;
  productId: string;
  name: string;
  price: number;
  category: string;
  addedOn: string;
  inStock: boolean;
  imageUrl: string;
}

/**
 * WishlistPage displays the authenticated user's wishlist using WishlistContext.
 * All data is real (no mock data) and is protected by RLS server-side.
 */
const WishlistPage: React.FC = () => {
  const { showAlert } = useAlertContext();
  const { wishlistItems, loading, removeFromWishlist } = useWishlistContext();
  const { productMedias } = useProductMediaContext();
  const { categories } = useCategoryContext();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("addedOn");

  /**
   * Build a fast lookup from product id -> primary media URL.
   * We choose the media with the smallest `arrangement` (null treated as 0).
   */
  const primaryImageByProductId = useMemo<Record<string, string>>(() => {
    const record: Record<string, { url: string; arrangement: number }> = {};

    productMedias.forEach((media: ProductMedia) => {
      const productId = media.product_id;
      if (typeof productId !== "string" || productId.length === 0) return;
      if (typeof media.media_url !== "string" || media.media_url.length === 0) return;

      const arrangement = typeof media.arrangement === "number" ? media.arrangement : 0;
      const existing = record[productId];
      if (!existing || arrangement < existing.arrangement) {
        record[productId] = { url: media.media_url, arrangement };
      }
    });

    return Object.keys(record).reduce<Record<string, string>>((acc, key) => {
      acc[key] = record[key]?.url ?? "";
      return acc;
    }, {});
  }, [productMedias]);

  /**
   * Build category id -> name lookup so we can render a friendly label.
   */
  const categoryNameById = useMemo<Record<string, string>>(() => {
    return categories.reduce<Record<string, string>>((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {});
  }, [categories]);

  /**
   * Convert wishlist rows into a display model for this page.
   */
  const displayItems = useMemo<DisplayWishlistItem[]>(() => {
    return wishlistItems
      .map((item) => {
        const productId = item.product_id;
        if (typeof productId !== "string" || productId.length === 0) {
          return null;
        }

        const product = item.product;
        const name = typeof product?.name === "string" && product.name.length > 0 ? product.name : "Unknown product";
        const price = typeof product?.price === "number" && Number.isFinite(product.price) ? product.price : 0;

        const categoryId = typeof product?.category_id === "string" ? product.category_id : null;
        const category =
          categoryId && typeof categoryNameById[categoryId] === "string"
            ? categoryNameById[categoryId]
            : "Uncategorized";

        const addedOn = typeof item.created_at === "string" ? item.created_at : "";

        const inStock = typeof product?.stock_count === "number" ? product.stock_count > 0 : false;
        const imageUrl =
          typeof primaryImageByProductId[productId] === "string" && primaryImageByProductId[productId].length > 0
            ? primaryImageByProductId[productId]
            : "/default-image.jpg";

        return {
          wishlistId: item.id,
          productId,
          name,
          price,
          category,
          addedOn,
          inStock,
          imageUrl,
        };
      })
      .filter((v): v is DisplayWishlistItem => v !== null);
  }, [categoryNameById, primaryImageByProductId, wishlistItems]);

  /**
   * Derived category list for the filter UI.
   */
  const categoryOptions = useMemo<string[]>(() => {
    const unique = new Set<string>();
    displayItems.forEach((item) => unique.add(item.category));
    return ["all", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [displayItems]);

  const filteredItems = useMemo<DisplayWishlistItem[]>(() => {
    if (selectedCategory === "all") return displayItems;
    return displayItems.filter((item) => item.category === selectedCategory);
  }, [displayItems, selectedCategory]);

  const sortedItems = useMemo<DisplayWishlistItem[]>(() => {
    const items = filteredItems.slice();
    items.sort((a, b) => {
      switch (sortBy) {
        case "priceAsc":
          return a.price - b.price;
        case "priceDesc":
          return b.price - a.price;
        case "nameAsc":
          return a.name.localeCompare(b.name);
        case "nameDesc":
          return b.name.localeCompare(a.name);
        case "addedOn":
        default: {
          const aTime = a.addedOn ? new Date(a.addedOn).getTime() : 0;
          const bTime = b.addedOn ? new Date(b.addedOn).getTime() : 0;
          return bTime - aTime;
        }
      }
    });
    return items;
  }, [filteredItems, sortBy]);

  /**
   * Format a Supabase timestamp string for display.
   */
  const formatDate = useCallback((dateString: string): string => {
    if (typeof dateString !== "string" || dateString.length === 0) return "Unknown";
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return "Unknown";

    return parsed.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const handleRemove = useCallback(
    async (productId: string): Promise<void> => {
      await removeFromWishlist(productId);
    },
    [removeFromWishlist]
  );

  const handleAddAllToCart = useCallback((): void => {
    // This is intentionally not implemented as part of the wishlist backend feature.
    // The cart flow has its own context and variant rules.
    showAlert("Add All to Cart is not implemented yet.", "error");
  }, [showAlert]);

  return (
    <>
      <NavbarHome />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <HiOutlineHeart className="mr-2 h-7 w-7 text-red-500" />
                  My Wishlist
                  <Badge color="gray" className="ml-3">
                    {displayItems.length} {displayItems.length === 1 ? "item" : "items"}
                  </Badge>
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Save items you love and come back to them later
                </p>
              </div>

              <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 mt-4 md:mt-0 w-full md:w-auto">
                <div className="flex space-x-2">
                  <select
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 text-sm"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category === "all" ? "All" : category}
                      </option>
                    ))}
                  </select>

                  <select
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 text-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                  >
                    <option value="addedOn">Newest First</option>
                    <option value="priceAsc">Price: Low to High</option>
                    <option value="priceDesc">Price: High to Low</option>
                    <option value="nameAsc">Name: A to Z</option>
                    <option value="nameDesc">Name: Z to A</option>
                  </select>
                </div>

                <Button color="blue" onClick={handleAddAllToCart} disabled={loading || displayItems.length === 0}>
                  <HiOutlineShoppingCart className="mr-2 h-5 w-5" />
                  Add All to Cart
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-10 text-gray-600 dark:text-gray-300">
                Loading wishlist...
              </div>
            ) : displayItems.length === 0 ? (
              <div className="text-center py-10">
                <div className="mx-auto w-16 h-16 mb-4 text-gray-400">
                  <HiOutlineHeart className="w-full h-full" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Your wishlist is empty
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Items added to your wishlist will appear here
                </p>
                <Link to="/product-section">
                  <Button color="blue">Start Shopping</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedItems.map((item) => (
                  <div
                    key={item.wishlistId}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="relative">
                      <Link to={`/product-details/${item.productId}`}>
                        <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover" />
                      </Link>

                      <div className="absolute top-2 right-2">
                        <Dropdown
                          label={<HiDotsVertical className="h-5 w-5 text-gray-700 dark:text-gray-300" />}
                          arrowIcon={false}
                          inline
                        >
                          <Dropdown.Item onClick={() => void handleRemove(item.productId)}>
                            <div className="flex items-center">
                              <HiOutlineTrash className="mr-2 h-4 w-4" />
                              Remove
                            </div>
                          </Dropdown.Item>
                        </Dropdown>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <Link to={`/product-details/${item.productId}`} className="hover:text-blue-600">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </h3>
                        </Link>
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.category}</div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Added on {formatDate(item.addedOn)}
                        </span>
                        <span
                          className={[
                            "text-xs font-medium",
                            item.inStock ? "text-green-600" : "text-red-600",
                          ].join(" ")}
                        >
                          {item.inStock ? "In Stock" : "Out of Stock"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          RM {item.price.toFixed(2)}
                        </span>
                        <div>
                          {item.inStock ? (
                            <Tooltip content="Cart flow is separate from wishlist">
                              <Button size="xs" color="blue" disabled>
                                <HiOutlineShoppingCart className="mr-1 h-4 w-4" />
                                Add to Cart
                              </Button>
                            </Tooltip>
                          ) : (
                            <Tooltip content="This item is currently out of stock">
                              <Button size="xs" color="gray" disabled>
                                Out of Stock
                              </Button>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default WishlistPage;