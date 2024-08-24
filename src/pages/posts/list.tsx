/* eslint-disable jsx-a11y/anchor-is-valid */
import { Button, Label, TextInput } from "flowbite-react";
import React from "react";
import { HiPlus } from "react-icons/hi";
import { IoIosSearch } from "react-icons/io";
import { Posts, usePostContext, Post } from "../../context/post/PostContext";
import { usePostMediaContext } from "../../context/post/PostMediaContext";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import PostComponent from "../../components/post/post";

const PostListPage: React.FC = function () {
  const { posts, loading } = usePostContext();
  const [searchValue, setSearchValue] = React.useState("");
  const [postData, setPostData] = React.useState<Post | null>(null);
  const { postMedias } = usePostMediaContext();

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <NavbarSidebarLayout>
      <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
        <div className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-3">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                Posts
              </h1>
              <a
                href="/posts/list"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                All Posts
              </a>
              <a
                href="/posts/schedule"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Schedule
              </a>
            </div>
            <Button href="/posts/create" className="btn btn-primary">
              <HiPlus className="text-xl" />
              Add Post
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col p-4 ">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle grid grid-cols-4">
            {postData && (
              <div className="overflow-hidden shadow col-span-1 flex justify-center items-center">
                <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
                  <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
                  <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
                  <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
                  <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
                  <div className="rounded-[2rem] overflow-auto w-[272px] h-[572px] bg-white hide-scrollbar">
                    <div className="pt-5">
                      <PostComponent
                        caption={postData?.caption || ""}
                        medias={postMedias
                          .filter((media) => media.post_id === postData?.id)
                          .map((media) => media.media_url)}
                        captionPosition={postData?.caption_position || ""}
                        ctaText={postData?.cta_text || ""}
                        photoSize={postData?.photo_size || ""}
                        fontFamily={postData.font_family || ""}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div
              className={`overflow-hidden shadow ${
                postData ? "col-span-3" : "col-span-4"
              }`}>
              <form className="lg:pr-3">
                <Label htmlFor="posts-search" className="sr-only">
                  Search
                </Label>
                <div className="relative mt-1">
                  <TextInput
                    id="posts-search"
                    name="posts-search"
                    placeholder="Search for Posts"
                    className="w-full mb-4"
                    style={{ background: "transparent" }}
                    value={searchValue}
                    icon={IoIosSearch}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                </div>
              </form>
              {posts.length > 0 ? (
                <PostsTable
                  posts={posts.filter((post) =>
                    post.name.toLowerCase().includes(searchValue.toLowerCase())
                  )}
                  setPostData={setPostData}
                />
              ) : (
                <>
                  <img
                    src="/images/illustrations/404.svg"
                    alt="No posts found"
                    className="mx-auto"
                  />
                  <div className="p-4 text-center">No posts found</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* <Pagination /> */}
    </NavbarSidebarLayout>
  );
};

interface PostsTableProps {
  posts: Post[];
  setPostData?: React.Dispatch<React.SetStateAction<Post | null>>;
}

const PostsTable: React.FC<PostsTableProps> = function ({
  posts,
  setPostData,
}) {
  const { postMedias } = usePostMediaContext();
  const { deletePost } = usePostContext();

  return (
    <div>
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-1 max-h-[calc(100vh-167px)] overflow-y-auto hide-scrollbar">
          {posts.flatMap((post) =>
            Array(10)
              .fill(null)
              .map((_, index) => (
                <div
                  key={`${post.id}-${index}`}
                  style={{ height: `calc((100vh - 167px) / 8)` }}
                  onClick={() => setPostData && setPostData(post)}
                  className="rounded-lg shadow-md p-4 flex justify-between border border-gray-200 dark:border-gray-500 bg-transparent rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        postMedias.find((media) => media.post_id === post.id)
                          ?.media_url
                      }
                      alt={post.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                      {post.name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      className="w-40"
                      color={"info"}
                      href={`/posts/create/${post.post_folder_id}/${post.id}`}>
                      Edit
                    </Button>
                    <Button
                      className="w-40"
                      color={"red"}
                      onClick={() => deletePost(post.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))
          )}
        </div>
      ) : (
        <>
          <img
            src="/images/illustrations/404.svg"
            alt="No posts found"
            className="mx-auto"
          />
          <div className="p-4 text-center">No posts found</div>
        </>
      )}
    </div>
  );
};

export default PostListPage;
