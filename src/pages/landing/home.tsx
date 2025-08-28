import React, { useRef, useMemo } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { usePostContext } from "../../context/post/PostContext";
import { usePostMediaContext } from "../../context/post/PostMediaContext";
import { useCategoryContext } from "../../context/product/CategoryContext";
import { useProductCategoryContext } from "../../context/product/ProductCategoryContext";
import { useProductContext } from "../../context/product/ProductContext";
import { useProductMediaContext } from "../../context/product/ProductMediaContext";
import { FaQrcode, FaBell } from "react-icons/fa";
import { Link } from "react-router-dom";
import { LandingLayout } from "../../layouts";

/**
 * Horizontal scrollable section component for reuse across different content types
 */
interface ScrollableSectionProps {
  title: string;
  viewAllLink?: string;
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  isHighlightSection?: boolean;
}

const ScrollableSection: React.FC<ScrollableSectionProps> = ({ title, viewAllLink, items, renderItem, isHighlightSection = false }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-5 px-5">
        <h2 className="text-xl font-semibold text-gray-900 tracking-tight">{title}</h2>
        {viewAllLink && (
          isHighlightSection ? (
            <Link to={viewAllLink} className="group bg-gradient-to-r from-indigo-700 to-purple-800 text-white text-sm font-medium px-4 py-1.5 rounded-full shadow-sm transform transition-all duration-300 hover:shadow-md hover:scale-105 hover:from-indigo-800 hover:to-purple-900 flex items-center space-x-1 hover:-translate-y-0.5">
              <span>View All</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <Link to={viewAllLink} className="text-indigo-700 text-sm font-medium hover:text-indigo-900 transition-colors duration-200 flex items-center space-x-1 group">
              <span>View All</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )
        )}
      </div>
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto hide-scrollbar space-x-5 px-5 pb-3"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {items.map((item, index) => renderItem(item, index))}
      </div>
    </div>
  );
};

// Add this mock data near the top of the file, after imports
const mockUnreadNotifications = 2;

const HomePage: React.FC = () => {
  const { user, user_detail } = useAuthContext();
  const { posts } = usePostContext();
  const { postMedias } = usePostMediaContext();
  const { categories } = useCategoryContext();
  const { productCategories } = useProductCategoryContext();
  const { products } = useProductContext();
  const { productMedias } = useProductMediaContext();

  // Sort posts by latest (created_at or updated_at)
  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
    });
  }, [posts]);

  // Sort categories alphabetically by name
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [categories]);

  // Sort products by latest
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0);
      const dateB = new Date(b.updated_at || b.created_at || 0);
      return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
    });
  }, [products]);

  // Create sorted mock promotions with dates (for demonstration)
  const sortedPromotions = useMemo(() => {
    return Array(6).fill(null).map((_, index) => ({
      id: `promo-${index}`,
      title: `Special Offer ${index + 1}`,
      created_at: new Date(Date.now() - index * 86400000).toISOString(), // Create dates with most recent first
      discount: "20%",
      type: index % 2 === 0 ? "NEW" : "HOT"
    })).sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
    });
  }, []);

  // Mock user data for demonstration purposes
  type LevelType = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";
  type LevelThresholds = Record<LevelType, number>;

  const mockUserData = {
    walletBalance: "1,250.00",
    name: "John Doe",
    points: 2850,
    level: "Gold" as LevelType,
    greeting: "Good Morning!",
    levelThresholds: {
      Bronze: 0,
      Silver: 1000,
      Gold: 2500,
      Platinum: 5000,
      Diamond: 10000
    } as LevelThresholds
  };

  // Helper function to get next level and progress
  const getLevelProgress = () => {
    const currentLevel = mockUserData.level;
    const currentPoints = mockUserData.points;
    const levels = Object.keys(mockUserData.levelThresholds) as LevelType[];
    const currentLevelIndex = levels.indexOf(currentLevel);
    const nextLevel = levels[currentLevelIndex + 1];
    const currentThreshold = mockUserData.levelThresholds[currentLevel];
    const nextThreshold = nextLevel ? mockUserData.levelThresholds[nextLevel] : currentThreshold;
    const progress = ((currentPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    const pointsToNextLevel = nextThreshold - currentPoints;

    return {
      progress: Math.min(100, Math.max(0, progress)),
      pointsToNextLevel,
      nextLevel
    };
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
    <LandingLayout>
      {/* User Information Card */}
      <div className="p-5 pt-8">
        <div className="bg-gradient-to-br from-indigo-800 via-indigo-700 to-purple-800 text-white relative overflow-hidden rounded-xl shadow-lg">
          <div className="absolute inset-0 bg-pattern opacity-5"></div>
          <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-white bg-opacity-10 blur-xl"></div>
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white bg-opacity-5 blur-xl"></div>
          
          <div className="px-6 pt-6 pb-4 relative">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium uppercase tracking-wider opacity-90">Wallet Balance</h2>
              <Link 
                to="/notifications" 
                className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm rounded-full p-2 shadow-inner relative hover:bg-opacity-25 transition-all duration-300 transform hover:scale-105"
              >
                <FaBell size={20} className="text-white" />
                {mockUnreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {mockUnreadNotifications}
                  </span>
                )}
              </Link>
            </div>
            <div className="flex items-baseline mt-3">
              <span className="text-sm mr-1 opacity-80">RM</span>
              <span className="text-6xl font-bold tracking-tight">{user_detail?.lifetime_val?.toFixed(2) || "0.00"}</span>
            </div>
          </div>
          
          <div className="px-6 pt-3 pb-10 relative z-10">
            <h1 className="text-2xl font-bold tracking-tight"> <span className="opacity-90">{user?.display_name || mockUserData.name}</span></h1>
            <div className="flex justify-between items-center mt-6">
              <div>
                <div className="flex items-center">
                  <div className="flex flex-col space-y-3 w-full">
                    <div className="flex items-center">
                      <span className="text-3xl font-bold tracking-tight">{mockUserData.points} Points</span>
                      <span className="ml-3 px-3 py-1 text-xs font-semibold bg-yellow-500 bg-opacity-20 text-yellow-300 rounded-full border border-yellow-500 border-opacity-20">
                        {mockUserData.level}
                      </span>
                    </div>
                    <div className="w-full">
                      <div className="relative">
                        <div className="overflow-hidden h-1.5 flex rounded-full bg-white bg-opacity-20">
                          <div
                            style={{ width: `${getLevelProgress().progress}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-white bg-opacity-50 transition-all duration-500 rounded-full"
                          ></div>
                        </div>
                        <div className="mt-1.5">
                          <span className="text-xs font-medium text-white text-opacity-80">
                            {getLevelProgress().pointsToNextLevel} points to {getLevelProgress().nextLevel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button className="p-4 bg-white bg-opacity-15 backdrop-filter backdrop-blur-sm rounded-xl shadow-lg hover:bg-opacity-25 transition-all duration-300 transform hover:scale-105">
                <FaQrcode size={24} className="text-white" />
              </button>
            </div>
            
            {!user && (
              <div className="mt-6 py-4 px-5 bg-white bg-opacity-15 backdrop-filter backdrop-blur-sm rounded-xl shadow-lg border border-white border-opacity-20">
                <p className="text-sm uppercase tracking-wider font-medium">LOG IN / REGISTER</p>
                <p className="text-xs mt-1 opacity-80 leading-relaxed">Login to check your progress and redeem exclusive rewards</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="pt-4">
        {/* Highlights Section */}
        <div className="py-6">
          <ScrollableSection
            title="Highlights"
            viewAllLink="/highlights"
            items={sortedPosts.slice(0, 10)}
            renderItem={(post, index) => {
              // Find media for this post
              const postMedia = post.medias?.[0]?.media_url || 
                postMedias.find(media => media.post_id === post.id)?.media_url || 
                `https://via.placeholder.com/300x200?text=Post+${index + 1}`;
              
              return (
                <Link 
                  to="/product-section"
                  key={`post-${post.id || index}`} 
                  className="flex-shrink-0 w-68 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 relative group"
                  style={{ width: "17rem" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-30 transition-opacity duration-500 rounded-xl"></div>
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-indigo-700 to-purple-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    FEATURED
                  </div>
                  <div className="h-48 bg-gray-100 relative">
                    <img 
                      src={postMedia} 
                      alt={post.title || `Post ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-30"></div>
                  </div>
                  <div className="p-5 relative">
                    <h3 className="font-bold text-gray-900 truncate">
                      {post.caption || `Featured Post ${index + 1}`}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-2 leading-relaxed">
                      {post.cta_text || "Lorem ipsum dolor sit amet, consectetur adipiscing elit."}
                    </p>
                    <div className="mt-4 flex justify-end">
                      <span className="text-xs text-indigo-700 font-medium">Discover More →</span>
                    </div>
                  </div>
                </Link>
              );
            }}
            isHighlightSection={true}
          />
        </div>
        
        {/* Categories Section */}
        <div className="py-6">
          <ScrollableSection
            title="Categories"
            viewAllLink="/product-section"
            items={sortedCategories.slice(0, 10)}
            renderItem={(category, index) => {
              // Get the best possible image for this category
              const categoryImage = category.media_url || getCategoryProductImage(category.id) || 
                `https://via.placeholder.com/80?text=C${index + 1}`;
              
              // Count the number of products in this category
              const productCount = productCategories.filter(pc => pc.category_id === category.id).length;

              return (
                <Link 
                  to={`/product-section/${category.id}`}
                  key={`category-${category.id || index}`} 
                  className="flex-shrink-0 w-28"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-22 h-22 bg-white rounded-2xl mb-3 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 p-0.5 transform hover:-translate-y-1 group">
                      <div className="rounded-xl overflow-hidden relative w-full h-full">
                        <img 
                          src={categoryImage} 
                          alt={category.name || `Category ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-20"></div>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-center text-gray-900 px-1 truncate w-full">
                      {category.name || `${index === 0 ? "Energy" : index === 1 ? "Men" : index === 2 ? "Nike" : `Category ${index + 1}`}`}
                    </p>
                    {productCount > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">{productCount} products</p>
                    )}
                  </div>
                </Link>
              );
            }}
            isHighlightSection={false}
          />
        </div>
        
        {/* Products Section */}
        <div className="py-6">
          <ScrollableSection
            title="Products"
            viewAllLink="/products"
            items={sortedProducts.slice(0, 10)}
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
                  className="flex-shrink-0 w-44 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1 group"
                >
                  <div className="h-44 bg-gray-100 relative">
                    <img 
                      src={productMedia?.media_url || `https://via.placeholder.com/160?text=Product+${index + 1}`} 
                      alt={product.name || `Product ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {productCategoryNames && (
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 backdrop-filter backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                        {productCategoryNames}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-10 group-hover:opacity-30 transition-opacity duration-300"></div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 truncate">
                      {product.name || `Product ${index + 1}`}
                    </h3>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm font-bold text-indigo-800">
                        RM {product.price?.toFixed(2) || (Math.random() * 100).toFixed(2)}
                      </p>
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-indigo-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
            isHighlightSection={false}
          />
        </div>
        
        {/* Promotions Section */}
        {/* <div className="py-6 pb-24">
          <ScrollableSection
            title="Promotions"
            viewAllLink="/promotions"
            items={sortedPromotions}
            renderItem={(promotion, index) => (
              <div 
                key={`promotion-${promotion.id || index}`} 
                className="flex-shrink-0 w-68 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group"
                style={{ width: "17rem" }}
              >
                <div className="h-44 bg-gray-100 relative">
                  <img 
                    src={`https://via.placeholder.com/300x200?text=Promotion+${index + 1}`} 
                    alt={`Promotion ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-50"></div>
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-red-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                    {promotion.type}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900">{promotion.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Limited time offer</p>
                  <div className="mt-4 flex justify-between items-center">
                    <p className="text-indigo-800 font-bold flex items-center">
                      <span className="text-xs mr-1">SAVE</span>
                      <span>{promotion.discount}</span>
                    </p>
                    <button className="px-4 py-1.5 bg-gradient-to-r from-indigo-700 to-purple-800 text-white rounded-full text-sm font-medium hover:from-indigo-800 hover:to-purple-900 transition-colors duration-300 shadow-sm hover:shadow">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            )}
            isHighlightSection={false}
          />
        </div> */}
      </div>
    </LandingLayout>
  );
};

export default HomePage;