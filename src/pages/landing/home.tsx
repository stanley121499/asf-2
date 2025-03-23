import React, { useRef } from "react";
import NavbarHome from "../../components/navbar-home";
import { useAuthContext } from "../../context/AuthContext";
import { usePostContext } from "../../context/post/PostContext";
import { usePostMediaContext } from "../../context/post/PostMediaContext";
import { useCategoryContext } from "../../context/product/CategoryContext";
import { useProductCategoryContext } from "../../context/product/ProductCategoryContext";
import { useProductContext } from "../../context/product/ProductContext";
import { useProductMediaContext } from "../../context/product/ProductMediaContext";
import { FaQrcode, FaHome, FaTags, FaBullseye, FaUser } from "react-icons/fa";

/**
 * Horizontal scrollable section component for reuse across different content types
 */
interface ScrollableSectionProps {
  title: string;
  viewAllLink?: string;
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
}

const ScrollableSection: React.FC<ScrollableSectionProps> = ({ title, viewAllLink, items, renderItem }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4 px-4">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {viewAllLink && (
          <button className="text-red-600 text-sm font-medium">
            View All
          </button>
        )}
      </div>
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto hide-scrollbar space-x-4 px-4 pb-2"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {items.map((item, index) => renderItem(item, index))}
      </div>
    </div>
  );
};

const HomePage: React.FC = () => {
  const { user, user_detail } = useAuthContext();
  const { posts } = usePostContext();
  const { postMedias } = usePostMediaContext();
  const { categories } = useCategoryContext();
  const { productCategories } = useProductCategoryContext();
  const { products } = useProductContext();
  const { productMedias } = useProductMediaContext();

  // Mock user data for demonstration purposes
  const mockUserData = {
    walletBalance: "1,250.00",
    name: "John Doe",
    points: 2850,
    level: "Gold",
    greeting: "Good Morning!"
  };

  // Helper function to get a product image for a category
  const getCategoryProductImage = (categoryId: string): string => {
    // Find product IDs associated with this category
    const productIds = productCategories
      .filter(pc => pc.category_id === categoryId)
      .map(pc => pc.product_id);
    
    // Find the first product that has media
    for (const productId of productIds) {
      const media = productMedias.find(media => media.product_id === productId);
      if (media?.media_url) {
        return media.media_url;
      }
    }

    // Fallback to placeholder
    return "";
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <NavbarHome />
      
      {/* User Information Card */}
      <div className="bg-blue-600 text-white relative overflow-hidden">
        <div className="px-6 pt-14 pb-4 relative">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide opacity-90">Wallet Balance</h2>
            <div className="bg-white bg-opacity-20 rounded-full px-3 py-1">
              <span className="text-xs font-semibold">Member</span>
            </div>
          </div>
          <div className="flex items-baseline mt-2">
            <span className="text-sm mr-1">RM</span>
            <span className="text-6xl font-bold">{user_detail?.lifetime_val?.toFixed(2) || "0.00"}</span>
          </div>
        </div>
        
        <div className="px-6 pt-3 pb-8 relative">
          <h1 className="text-2xl font-bold">{mockUserData.greeting} <span className="opacity-90">{user?.display_name || mockUserData.name}</span></h1>
          <div className="flex justify-between items-center mt-5">
            <div>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center mr-4">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold mr-2">{mockUserData.points}</span>
                    <span className="opacity-80">Points</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">{mockUserData.level}</span>
                    <span className="text-xs opacity-80">level</span>
                  </div>
                </div>
              </div>
            </div>
            <button className="p-4 bg-white bg-opacity-10 backdrop-filter backdrop-blur-sm rounded-lg hover:bg-opacity-20 transition-all duration-300">
              <FaQrcode size={24} className="text-white" />
            </button>
          </div>
          
          {!user && (
            <div className="mt-5 py-3 px-4 bg-white bg-opacity-10 rounded-lg backdrop-filter backdrop-blur-sm">
              <p className="text-sm uppercase tracking-wide font-medium">LOG IN / REGISTER</p>
              <p className="text-xs mt-1 opacity-80">Login to check your progress and redeem rewards</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-grow">
        {/* Highlights Section */}
        <div className="py-6">
          <ScrollableSection
            title="Highlights"
            viewAllLink="/highlights"
            items={posts.slice(0, 10)}
            renderItem={(post, index) => {
              // Find media for this post
              const postMedia = post.medias?.[0]?.media_url || 
                postMedias.find(media => media.post_id === post.id)?.media_url || 
                `https://via.placeholder.com/300x200?text=Post+${index + 1}`;
              
              return (
                <div 
                  key={`post-${post.id || index}`} 
                  className="flex-shrink-0 w-64 bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
                >
                  <div className="h-48 bg-gray-100 relative">
                    <img 
                      src={postMedia} 
                      alt={post.title || `Post ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 truncate">
                      {post.caption || `Featured Post ${index + 1}`}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                      {post.cta_text || "Lorem ipsum dolor sit amet, consectetur adipiscing elit."}
                    </p>
                  </div>
                </div>
              );
            }}
          />
        </div>
        
        {/* Categories Section */}
        <div className="py-4">
          <ScrollableSection
            title="Categories"
            viewAllLink="/categories"
            items={categories.slice(0, 10)}
            renderItem={(category, index) => {
              // Get the best possible image for this category
              const categoryImage = category.media_url || getCategoryProductImage(category.id) || 
                `https://via.placeholder.com/80?text=C${index + 1}`;
              
              // Count the number of products in this category
              const productCount = productCategories.filter(pc => pc.category_id === category.id).length;

              return (
                <div 
                  key={`category-${category.id || index}`} 
                  className="flex-shrink-0 w-28"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg mb-2 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                      <img 
                        src={categoryImage} 
                        alt={category.name || `Category ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm font-medium text-center text-gray-900 px-1 truncate w-full">
                      {category.name || `${index === 0 ? "Energy" : index === 1 ? "Men" : index === 2 ? "Nike" : `Category ${index + 1}`}`}
                    </p>
                    {productCount > 0 && (
                      <p className="text-xs text-gray-500">{productCount} products</p>
                    )}
                  </div>
                </div>
              );
            }}
          />
        </div>
        
        {/* Products Section */}
        <div className="py-4">
          <ScrollableSection
            title="Products"
            viewAllLink="/products"
            items={products.slice(0, 10)}
            renderItem={(product, index) => {
              const productMedia = productMedias.find(media => media.product_id === product.id);
              
              // Get categories for this product
              const productCategoryIds = productCategories
                .filter(pc => pc.product_id === product.id)
                .map(pc => pc.category_id);
              
              const productCategoryNames = categories
                .filter(cat => productCategoryIds.includes(cat.id))
                .map(cat => cat.name)
                .join(", ");

              return (
                <div 
                  key={`product-${product.id || index}`} 
                  className="flex-shrink-0 w-40 bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
                >
                  <div className="h-40 bg-gray-100 relative">
                    <img 
                      src={productMedia?.media_url || `https://via.placeholder.com/160?text=Product+${index + 1}`} 
                      alt={product.name || `Product ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {productCategoryNames && (
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                        {productCategoryNames}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 truncate">
                      {product.name || `Product ${index + 1}`}
                    </h3>
                    <p className="text-sm font-bold text-red-700 mt-1">
                      RM {product.price?.toFixed(2) || (Math.random() * 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            }}
          />
        </div>
        
        {/* Promotions Section */}
        <div className="py-4 pb-20">
          <ScrollableSection
            title="Promotions"
            viewAllLink="/promotions"
            items={Array(6).fill(null)}
            renderItem={(_, index) => (
              <div 
                key={`promotion-${index}`} 
                className="flex-shrink-0 w-64 bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
              >
                <div className="h-40 bg-gray-100 relative">
                  <img 
                    src={`https://via.placeholder.com/300x200?text=Promotion+${index + 1}`} 
                    alt={`Promotion ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                    {index % 2 === 0 ? "NEW" : "HOT"}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900">Special Offer {index + 1}</h3>
                  <p className="text-sm text-gray-600 mb-2">Limited time promotion</p>
                  <div className="flex justify-between items-center">
                    <p className="text-red-700 font-bold">Save 20%</p>
                    <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors duration-300">
                      View
                    </button>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
