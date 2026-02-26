import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavbarHome from "../../components/navbar-home";
import { usePostContext } from "../../context/post/PostContext";
import { usePostMediaContext } from "../../context/post/PostMediaContext";
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";

/**
 * Highlights page component that displays featured posts with a premium feel
 */
const HighlightsPage: React.FC = () => {
  const { posts } = usePostContext();
  const { postMedias } = usePostMediaContext();
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([]);

  // Filter and organize posts for display
  useEffect(() => {
    // Sort posts by creation date (newest first)
    const sortedPosts = [...posts].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    setFeaturedPosts(sortedPosts);
  }, [posts]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Promotional Banner */}
      <div className="bg-gray-100 py-3 px-4 text-center text-sm font-medium relative">
        <p>Subscribe To Newsletter & Create Account For 10% Off*</p>
        <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
          <span className="text-xl">×</span>
        </button>
      </div>
      
      {/* Top Navigation */}
      <NavbarHome />
      
      {/* Main Content */}
      <div className="flex-grow">
        {/* Hero Banner */}
        {featuredPosts.length > 0 && (
          <Link to="/product-section" className="relative">
            <img 
              src={featuredPosts[0].medias?.[0]?.media_url || 
                postMedias.find(media => media.post_id === featuredPosts[0].id)?.media_url || 
                "https://via.placeholder.com/800x600?text=Featured+Highlight"} 
              alt="Featured Collection" 
              className="w-full h-[75vh] object-cover"
            />
            <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black/40 to-transparent">
              <h2 className="text-3xl font-semibold text-white uppercase tracking-wide">
                DREAMY PASTELS
              </h2>
              <div className="mt-6">
                <button className="px-8 py-3 bg-white text-black font-medium uppercase tracking-wider text-sm">
                  SHOP THE EDIT
                </button>
              </div>
            </div>
          </Link>
        )}
        
        {/* Festival Swirls Banner */}
        {featuredPosts.length > 1 && (
          <Link to="/product-section" className="relative mt-2">
            <img 
              src={featuredPosts[1].medias?.[0]?.media_url || 
                postMedias.find(media => media.post_id === featuredPosts[1].id)?.media_url || 
                "https://via.placeholder.com/800x600?text=Festival+Collection"} 
              alt="Festival Collection" 
              className="w-full h-[75vh] object-cover"
            />
            <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black/40 to-transparent">
              <h2 className="text-3xl font-semibold text-white uppercase tracking-wide">
                FESTIVAL SWIRLS
              </h2>
              <div className="mt-6">
                <button className="px-8 py-3 bg-white text-black font-medium uppercase tracking-wider text-sm">
                  SHOP THE EDIT
                </button>
              </div>
            </div>
          </Link>
        )}

        {/* In The Spotlight Section */}
        <div className="mt-6 px-4">
          <h2 className="text-xl font-bold mb-6 uppercase tracking-wide">In The Spotlight</h2>
          
          {/* Full-Width Spotlight Item */}
          {featuredPosts.length > 2 && (
            <Link to="/product-section" className="relative mb-6">
              <img 
                src={featuredPosts[2].medias?.[0]?.media_url || 
                  postMedias.find(media => media.post_id === featuredPosts[2].id)?.media_url || 
                  "https://via.placeholder.com/800x500?text=Spring+Vacay"} 
                alt="Spring Vacay" 
                className="w-full aspect-[4/5] object-cover"
              />
              <div className="absolute bottom-0 left-0 w-full p-6">
                <h3 className="text-xl font-medium text-white uppercase tracking-wide">
                  SPRING VACAY
                </h3>
              </div>
              <div className="absolute bottom-6 left-0 w-full px-6">
                <button className="px-6 py-2 bg-white text-black text-sm font-medium uppercase tracking-wider">
                  SHOP THE EDIT
                </button>
              </div>
            </Link>
          )}
          
          {/* Side-by-Side Spotlight Items */}
          <div className="flex space-x-2">
            {featuredPosts.slice(3, 5).map((post, index) => {
              const postMedia = post.medias?.[0]?.media_url || 
                postMedias.find(media => media.post_id === post.id)?.media_url || 
                `https://via.placeholder.com/400x500?text=Spotlight+${index + 1}`;
              
              const titles = ["CHIC THONGS", "BEACH ESSENTIALS"];
              
              return (
                <Link to="/product-section" key={post.id || `spotlight-${index}`} className="w-1/2">
                  <div className="relative">
                    <img 
                      src={postMedia} 
                      alt={post.caption || titles[index]}
                      className="w-full aspect-[3/4] object-cover"
                    />
                    <div className="absolute bottom-0 left-0 w-full p-4">
                      <h3 className="text-sm font-medium text-white uppercase tracking-wide">
                        {post.caption || titles[index]}
                      </h3>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        
        {/* Trending Products Section - Renamed from "Most-Wanted Bags" */}
        <div className="mt-12 px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold uppercase tracking-wide">Trending Products</h2>
            <div className="flex space-x-2">
              <button aria-label="Previous" className="p-2 border rounded-full">
                <HiOutlineChevronLeft className="w-4 h-4" />
              </button>
              <button aria-label="Next" className="p-2 border rounded-full">
                <HiOutlineChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex space-x-4 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
            {featuredPosts.slice(5, 8).map((post, index) => {
              const postMedia = post.medias?.[0]?.media_url || 
                postMedias.find(media => media.post_id === post.id)?.media_url || 
                `https://via.placeholder.com/400x400?text=Product+${index + 1}`;
              
              return (
                <Link to="/product-section" key={post.id || `product-${index}`} className="flex-shrink-0 w-[60vw]">
                  <div className="relative">
                    <img 
                      src={postMedia} 
                      alt={post.caption || `Product ${index + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        
        {/* Featured Collections */}
        <div className="mt-12 px-0">
          <h2 className="text-xl font-bold uppercase tracking-wide px-4 mb-6">Featured Collections</h2>
          
          {/* First Row - Full Width Image */}
          {featuredPosts.length > 8 && (
            <Link to="/product-section" className="relative mb-2">
              <img 
                src={featuredPosts[8].medias?.[0]?.media_url || 
                  postMedias.find(media => media.post_id === featuredPosts[8].id)?.media_url || 
                  "https://via.placeholder.com/800x400?text=Featured+Collection"} 
                alt={featuredPosts[8].caption || "Featured Collection"}
                className="w-full aspect-video object-cover"
              />
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <h3 className="text-xl font-medium text-white uppercase tracking-wide">
                  STAR OF THE STREET
                </h3>
                <div className="mt-4">
                  <button className="px-6 py-2 bg-white text-black text-sm font-medium uppercase tracking-wider">
                    SHOP THE EDIT
                  </button>
                </div>
              </div>
            </Link>
          )}
          
          {/* Second Row - Two Side-by-Side Images */}
          <div className="flex">
            {featuredPosts.slice(9, 11).map((post, index) => {
              const postMedia = post.medias?.[0]?.media_url || 
                postMedias.find(media => media.post_id === post.id)?.media_url || 
                `https://via.placeholder.com/400x600?text=Collection+${index + 1}`;
              
              const titles = ["BUILT TO BREAK THE RULES", "EFFORT MEETS EDGE"];
              
              return (
                <Link to="/product-section" key={post.id || `collection-side-${index}`} className="w-1/2 relative">
                  <img 
                    src={postMedia} 
                    alt={post.caption || titles[index]}
                    className="w-full aspect-[3/4] object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <h3 className="text-sm font-medium text-white uppercase tracking-wide">
                      {post.caption || titles[index]}
                    </h3>
                    <div className="mt-3">
                      <button className="px-4 py-2 bg-white text-black text-xs font-medium uppercase tracking-wider">
                        SHOP THE EDIT
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          
          {/* Third Row - Full Width Image */}
          {featuredPosts.length > 11 && (
            <Link to="/product-section" className="relative mt-2">
              <img 
                src={featuredPosts[11].medias?.[0]?.media_url || 
                  postMedias.find(media => media.post_id === featuredPosts[11].id)?.media_url || 
                  "https://via.placeholder.com/800x400?text=Street+Meets+Chic"} 
                alt={featuredPosts[11].caption || "Street Meets Chic"}
                className="w-full aspect-video object-cover"
              />
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <h3 className="text-xl font-medium text-white uppercase tracking-wide">
                  STREET MEETS CHIC
                </h3>
                <div className="mt-4">
                  <button className="px-6 py-2 bg-white text-black text-sm font-medium uppercase tracking-wider">
                    SHOP THE EDIT
                  </button>
                </div>
              </div>
            </Link>
          )}
        </div>
        
        {/* Texture Talks Section */}
        {featuredPosts.length > 12 && (
          <Link to="/product-section" className="mt-12 px-0">
            <div className="relative">
              <img 
                src={featuredPosts[12].medias?.[0]?.media_url || 
                  postMedias.find(media => media.post_id === featuredPosts[12].id)?.media_url || 
                  "https://via.placeholder.com/800x400?text=Texture+Talks"} 
                alt={featuredPosts[12].caption || "Texture Talks"}
                className="w-full aspect-[3/2] object-cover"
              />
              <div className="absolute inset-0 flex flex-col justify-center items-start p-8">
                <h2 className="text-2xl font-semibold text-white mb-2">Texture Talks</h2>
                <p className="text-white text-sm mb-6">Feel the Fabric</p>
                <button className="px-6 py-3 bg-white text-black text-sm font-medium uppercase tracking-wider rounded-full">
                  SHOP NOW
                </button>
              </div>
            </div>
          </Link>
        )}
        
        {/* All Posts Section - Display remaining posts */}
        <div className="mt-12 px-4 mb-16">
          <h2 className="text-xl font-bold uppercase tracking-wide mb-6">Explore All Highlights</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {featuredPosts.slice(13).map((post, index) => {
              const postMedia = post.medias?.[0]?.media_url || 
                postMedias.find(media => media.post_id === post.id)?.media_url || 
                `https://via.placeholder.com/400x400?text=Item+${index + 1}`;
              
              return (
                <Link to="/product-section" key={post.id || `all-item-${index}`} className="flex flex-col">
                  <div className="relative">
                    <img 
                      src={postMedia} 
                      alt={post.caption || `Item ${index + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black/30 to-transparent">
                      <h3 className="text-sm font-medium text-white">
                        {post.caption || `Item ${index + 1}`}
                      </h3>
                    </div>
                  </div>
                  <div className="py-2">
                    <button className="w-full py-2 mt-2 border border-gray-300 text-xs font-medium uppercase tracking-wider">
                      SHOP NOW
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighlightsPage; 