/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Badge,
  Button,
  Label,
  Table,
  TextInput,
  Datepicker
} from "flowbite-react";
import React, { useEffect } from "react";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import { usePostContext, Posts, Post, PostUpdate } from "../../context/post/PostContext";
import { usePostMediaContext } from "../../context/post/PostMediaContext";
import PostComponent from "../../components/post/post";
import { useAlertContext } from "../../context/AlertContext";

const SchedulePostListPage: React.FC = function () {
  const { posts, loading, updatePost } = usePostContext();
  const [selectedPost, setSelectedPost] = React.useState<Post | null>(null);
  const [searchValue, setSearchValue] = React.useState("");
  const { postMedias } = usePostMediaContext();
  const [postTime, setPostTime] = React.useState("");
  const { showAlert } = useAlertContext();

  useEffect(() => {
    if (selectedPost) {
      setPostTime(selectedPost.time_post?.split("T")[1] || "");
    }
  }, [selectedPost]);

  if (loading) {
    return <LoadingPage />;
  }

  const handleUpdatePost = async (post: PostUpdate) => {
    // Add time to post
    if (postTime) {
      post.time_post = new Date(`${post.time_post} ${postTime}`).toISOString();
    }

    await updatePost(post);
    setSelectedPost(null);
    setPostTime("");
    showAlert("Post updated successfully", "success");
  }

  return (
    <NavbarSidebarLayout>
      <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
        <div className="mb-1 w-full">
          <div className="mb-2 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              Schedule Posts
            </h1>
            <form className="lg:pr-3">
              <Label htmlFor="posts-search" className="sr-only">
                Search
              </Label>
              <div className="relative mt-1 lg:w-64 xl:w-96">
                <TextInput
                  id="posts-search"
                  name="posts-search"
                  placeholder="Search for Posts"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="flex flex-col p-4 ">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
            <div className={selectedPost? "col-span-2" : "col-span-3"}>
              <div className="overflow-hidden shadow">
                {posts.length > 0 ? (
                  <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <Table.Body className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                      {posts.filter((post) => post.name.toLowerCase().includes(searchValue.toLowerCase())).map((post) => (
                        <Table.Row key={post.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                          <Table.Cell width={150}>
                            <img src={postMedias.find((media) => media.post_id === post.id)?.media_url} alt={post.name} className="w-10 h-10 object-cover rounded-full" />
                          </Table.Cell>
                          <Table.Cell>
                            <div>
                              <div className="flex items-center gap-x-5">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                                  {post.name}
                                </h2>
                                {getBadge(post)}
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {post.caption}
                              </p>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex items-center gap-x-3 whitespace-nowrap justify-end">
                              {/* If no time post  */}
                              {!post.time_post && (
                                <Button color={"info"} onClick={() => setSelectedPost(post)}>
                                  Schedule
                                </Button>
                              )}

                              {/* If time post is in the future */}
                              {post.time_post && post.time_post > new Date().toISOString() && (
                                <Button color={"info"} onClick={() => setSelectedPost(post)}>
                                  Reschedule
                                </Button>
                              )}

                              {/* If time post is in the past */}
                              {post.time_post && post.time_post < new Date().toISOString() && (
                                <Button color={"red"} onClick={() => handleUpdatePost({ ...post, time_post: null })}>
                                  Unpublish
                                </Button>
                              )}

                              <Button color={"info"} onClick={() => setSelectedPost(post)}>
                                Preview
                              </Button>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>

                ) : (
                  <div className="p-4 text-center">No posts found</div>
                )}
              </div>
            </div>
            {selectedPost && (
              <div className="col-span-1">
                {/* Datepicker */}
                <div className="mb-4">
                  <Label htmlFor="time_post" className="text-sm text-gray-500 dark:text-gray-400">Schedule Post</Label>
                  <Datepicker
                    id="time_post"
                    name="time_post"
                    value={selectedPost.time_post?.split("T")[0] || ""}
                    onSelectedDateChanged={(date) => setSelectedPost({ ...selectedPost, time_post: date.toLocaleDateString() })}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="time" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Select time:</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input type="time" id="time" className="bg-gray-50 border leading-none border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" min="09:00" max="18:00" value={postTime} required
                      onChange={(e) => setPostTime(e.target.value)}
                    />
                  </div>
                </div>

                <Button color={"info"} onClick={() => handleUpdatePost(selectedPost)} className="mb-4">
                  Save
                </Button>

                <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[500px] w-[300px] shadow-xl">
                  <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
                  <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
                  <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
                  <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
                  <div className="rounded-[2rem] overflow-hidden w-[272px] h-[472px] bg-white dark:bg-gray-800">
                    <div className="pt-5">
                      <PostComponent
                        caption={selectedPost.caption || ""}
                        medias={postMedias.filter((media) => media.post_id === selectedPost.id).map((media) => media.media_url)}
                        captionPosition={selectedPost.caption_position || ""}
                        ctaText={selectedPost.cta_text || ""}
                        photoSize={selectedPost.photo_size || ""} />
                    </div>
                  </div>
                </div>


              </div>
            )}

          </div>
        </div>
      </div>
      {/* <Pagination /> */}
    </NavbarSidebarLayout >
  );
};

const getBadge = (post: Post) => {
  // Generate based on time post and status
  if (post.time_post && post.time_post > new Date().toISOString()) {
    return (
      <Badge color="yellow" className="text-xs">
        Scheduled
      </Badge>
    );
  }

  if (post.time_post && post.time_post < new Date().toISOString()) {
    return (
      <Badge color="green" className="text-xs">
        Published
      </Badge>
    );
  }

  return (
    <Badge color="gray" className="text-xs">
      Draft
    </Badge>
  );
};

export default SchedulePostListPage;
