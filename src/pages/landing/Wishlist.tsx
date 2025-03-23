import React, { useState } from "react";
import { Button, Card, Badge, Dropdown, Tooltip } from "flowbite-react";
import NavbarHome from "../../components/navbar-home";
import { Link } from "react-router-dom";
import { HiOutlineHeart, HiOutlineShoppingCart, HiOutlineTrash, HiOutlineShare, HiDotsVertical, HiOutlineBell } from "react-icons/hi";

// Define TypeScript interfaces
interface WishlistItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  inStock: boolean;
  addedOn: string;
  onSale?: boolean;
}

const WishlistPage: React.FC = () => {
  // Mock data for wishlist items
  const initialItems: WishlistItem[] = [
    {
      id: "p1",
      name: "Wireless Noise-Cancelling Headphones",
      price: 99.99,
      originalPrice: 149.99,
      image: "/images/products/product-1.jpg",
      category: "Electronics",
      rating: 4.5,
      inStock: true,
      addedOn: "2023-04-10",
      onSale: true
    },
    {
      id: "p2",
      name: "Smart Watch Series 5",
      price: 199.99,
      image: "/images/products/product-2.jpg",
      category: "Electronics",
      rating: 4.8,
      inStock: true,
      addedOn: "2023-05-02"
    },
    {
      id: "p3",
      name: "Premium Leather Wallet",
      price: 49.99,
      originalPrice: 59.99,
      image: "/images/products/product-3.jpg",
      category: "Accessories",
      rating: 4.2,
      inStock: true,
      addedOn: "2023-03-28",
      onSale: true
    },
    {
      id: "p4",
      name: "Portable Bluetooth Speaker",
      price: 79.99,
      image: "/images/products/product-4.jpg",
      category: "Electronics",
      rating: 4.7,
      inStock: false,
      addedOn: "2023-05-15"
    }
  ];

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(initialItems);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("addedOn");

  // Filter items by category
  const filteredItems = selectedCategory === "all" 
    ? wishlistItems 
    : wishlistItems.filter(item => item.category === selectedCategory);

  // Sort items based on the selected sort option
  const sortedItems = [...filteredItems].sort((a, b) => {
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
      default:
        return new Date(b.addedOn).getTime() - new Date(a.addedOn).getTime();
    }
  });

  // Get unique categories for the filter
  const categories = ["all", ...wishlistItems
    .map(item => item.category)
    .filter((category, index, array) => array.indexOf(category) === index)];

  // Handle removing an item from wishlist
  const handleRemoveItem = (id: string) => {
    setWishlistItems(wishlistItems.filter(item => item.id !== id));
  };

  // Handle moving all items to cart
  const handleMoveAllToCart = () => {
    // This would connect to your cart functionality in a real app
    console.log("Moving all items to cart");
    // Could show a success message or redirect to cart
  };

  // Get the discount percentage
  const getDiscountPercentage = (price: number, originalPrice?: number): number | null => {
    if (!originalPrice) return null;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
  };

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
                    {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"}
                  </Badge>
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Save items you love and come back to them later
                </p>
              </div>
              
              <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 mt-4 md:mt-0 w-full md:w-auto">
                {/* Filters */}
                <div className="flex space-x-2">
                  <select 
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 text-sm"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                  
                  <select 
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 text-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="addedOn">Newest First</option>
                    <option value="priceAsc">Price: Low to High</option>
                    <option value="priceDesc">Price: High to Low</option>
                    <option value="nameAsc">Name: A to Z</option>
                    <option value="nameDesc">Name: Z to A</option>
                  </select>
                </div>
                
                <Button color="blue" onClick={handleMoveAllToCart}>
                  <HiOutlineShoppingCart className="mr-2 h-5 w-5" />
                  Add All to Cart
                </Button>
              </div>
            </div>
            
            {/* Wishlist Items */}
            {wishlistItems.length === 0 ? (
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
                  <Button color="blue">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative">
                      <Link to={`/product-details/${item.id}`}>
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-48 object-cover"
                        />
                      </Link>
                      {item.onSale && (
                        <Badge color="red" className="absolute top-2 left-2">
                          {getDiscountPercentage(item.price, item.originalPrice)}% OFF
                        </Badge>
                      )}
                      <div className="absolute top-2 right-2">
                        <Dropdown
                          label={<HiDotsVertical className="h-5 w-5 text-gray-700 dark:text-gray-300" />}
                          arrowIcon={false}
                          inline
                        >
                          <Dropdown.Item onClick={() => handleRemoveItem(item.id)}>
                            <div className="flex items-center">
                              <HiOutlineTrash className="mr-2 h-4 w-4" />
                              Remove
                            </div>
                          </Dropdown.Item>
                          <Dropdown.Item>
                            <div className="flex items-center">
                              <HiOutlineShare className="mr-2 h-4 w-4" />
                              Share
                            </div>
                          </Dropdown.Item>
                          {!item.inStock && (
                            <Dropdown.Item>
                              <div className="flex items-center">
                                <HiOutlineBell className="mr-2 h-4 w-4" />
                                Notify When Available
                              </div>
                            </Dropdown.Item>
                          )}
                        </Dropdown>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <Link to={`/product-details/${item.id}`} className="hover:text-blue-600">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </h3>
                        </Link>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {item.category}
                      </div>
                      
                      <div className="flex items-center mb-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg 
                              key={i} 
                              className={`w-4 h-4 ${i < Math.floor(item.rating) ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="text-xs ml-1 text-gray-600 dark:text-gray-400">
                            {item.rating}
                          </span>
                        </div>
                        <span className="text-xs ml-auto text-gray-500 dark:text-gray-400">
                          Added on {formatDate(item.addedOn)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-baseline">
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            ${item.price.toFixed(2)}
                          </span>
                          {item.originalPrice && (
                            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 line-through">
                              ${item.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div>
                          {item.inStock ? (
                            <Button size="xs" color="blue">
                              <HiOutlineShoppingCart className="mr-1 h-4 w-4" />
                              Add to Cart
                            </Button>
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
          
          {/* Recommended Products Section */}
          {wishlistItems.length > 0 && (
            <Card>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                You Might Also Like
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Mock recommended products */}
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <Link to={`/product-details/rec-${i}`}>
                      <img 
                        src={`/images/products/recommended-${i}.jpg`} 
                        alt={`Recommended Product ${i}`} 
                        className="w-full h-36 object-cover"
                      />
                    </Link>
                    <div className="p-3">
                      <Link to={`/product-details/rec-${i}`} className="hover:text-blue-600">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          Recommended Product {i}
                        </h3>
                      </Link>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-bold">${(39.99 + i * 10).toFixed(2)}</span>
                        <Button size="xs">
                          <HiOutlineShoppingCart className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default WishlistPage; 