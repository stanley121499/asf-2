/* eslint-disable react/no-unknown-property */
/* eslint-disable jsx-a11y/anchor-is-valid */
import { Badge, Button, Datepicker, Label, TextInput } from "flowbite-react";
import React, { useEffect } from "react";
import { HiPlus } from "react-icons/hi";
import { IoIosSearch } from "react-icons/io";
import PostComponent from "../../components/post/post";
import { useAlertContext } from "../../context/AlertContext";
import {
  Post,
  PostUpdate,
  usePostContext,
} from "../../context/post/PostContext";
import { usePostMediaContext } from "../../context/post/PostMediaContext";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import { FaChevronDown } from "react-icons/fa6";
import "../customDatePickerWidth.css";
import { useParams } from "react-router-dom";

/**
 * Builds a validated ISO timestamp string for the `time_post` column.
 *
 * NOTE:
 * - We store a full ISO string (`toISOString()`), so comparisons against
 *   `new Date().toISOString()` are consistent.
 *
 * @param date - The selected date.
 * @param timeHHMM - Time in `HH:MM` 24-hour format.
 * @returns ISO timestamp string.
 * @throws Error when the date or time is invalid.
 */
const buildIsoTimePost = (date: Date, timeHHMM: string): string => {
  // Validate date input
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error("Please select a valid date.");
  }

  // Validate time format HH:MM
  const match = /^(\d{2}):(\d{2})$/.exec(timeHHMM);
  if (!match) {
    throw new Error("Please select a valid time (HH:MM).");
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error("Please select a valid time (HH:MM).");
  }

  // Use local time for the chosen date, then persist as UTC ISO
  const scheduled = new Date(date);
  scheduled.setHours(hours, minutes, 0, 0);
  return scheduled.toISOString();
};

/**
 * Converts an unknown caught error to a safe human-readable message.
 *
 * @param error - The caught error value.
 * @returns A safe string message for alerts.
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown error";
};

const SchedulePostListPage: React.FC = function () {
  const { posts, loading, updatePost } = usePostContext();
  const [selectedPost, setSelectedPost] = React.useState<Post | null>(null);
  const [dateInput, setDateInput] = React.useState<Date | null>(null);
  const [searchValue, setSearchValue] = React.useState("");
  const { postMedias } = usePostMediaContext();
  const [postTime, setPostTime] = React.useState("");
  const { showAlert } = useAlertContext();
  const { postId } = useParams();

  useEffect(() => {
    if (postId) {
      setSelectedPost(posts.find((post) => post.id === postId) || null);
    }
  }, [postId, posts]);

  useEffect(() => {
    if (selectedPost) {
      // When rescheduling, pre-populate both the date and time inputs.
      if (selectedPost.time_post) {
        const parsed = new Date(selectedPost.time_post);
        if (!Number.isNaN(parsed.getTime())) {
          setDateInput(parsed);
          const hours = `${parsed.getHours()}`.padStart(2, "0");
          const minutes = `${parsed.getMinutes()}`.padStart(2, "0");
          setPostTime(`${hours}:${minutes}`);
          return;
        }
      }

      // If not scheduled (or invalid date in DB), clear inputs.
      setDateInput(null);
      setPostTime("");
    }
  }, [selectedPost]);

  if (loading) {
    return <LoadingPage />;
  }

  /**
   * Saves (re)scheduling for a post by persisting `posts.time_post`.
   *
   * @param post - Post update object; must include `id`.
   */
  const handleSavePostSchedule = async (post: PostUpdate) => {
    try {
      // Scheduling requires a date + time.
      if (!dateInput) {
        throw new Error("Please select a date.");
      }
      if (!postTime) {
        throw new Error("Please select a time.");
      }

      const timePostIso = buildIsoTimePost(dateInput, postTime);
      await updatePost({ ...post, time_post: timePostIso });

      // Reset editor state on success only.
      setSelectedPost(null);
      setDateInput(null);
      setPostTime("");
      showAlert("Post updated successfully", "success");
    } catch (error: unknown) {
      const message = `Failed to update post schedule: ${getErrorMessage(error)}`;
      console.error(error);
      showAlert(message, "error");
    }
  };

  /**
   * Clears a post schedule by setting `posts.time_post` to `null`.
   *
   * @param postId - The post id to update.
   */
  const handleClearPostSchedule = async (postId: string) => {
    try {
      await updatePost({ id: postId, time_post: null });
      showAlert("Post unpublished successfully", "success");
    } catch (error: unknown) {
      const message = `Failed to unpublish post: ${getErrorMessage(error)}`;
      console.error(error);
      showAlert(message, "error");
    }
  };

  return (
    <NavbarSidebarLayout>
      <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
        <div className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-3">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                Schedule Posts
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

      <div className="flex flex-col p-4">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4">
            {selectedPost && (
              <div className="col-span-1 border-gray-200 dark:border-gray-700 p-4 h-[calc(100vh-7rem)] flex items-center justify-center">
                <div className="">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl mb-4">
                    Preview
                  </h2>
                  <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
                    <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
                    <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
                    <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
                    <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
                    <div className="rounded-[2rem] overflow-hidden w-[272px] h-[572px] bg-white">
                      <div className="pt-5">
                        <PostComponent
                          caption={selectedPost.caption || ""}
                          medias={postMedias
                            .filter(
                              (media) => media.post_id === selectedPost.id
                            )
                            .map((media) => media.media_url)}
                          captionPosition={selectedPost.caption_position || ""}
                          ctaText={selectedPost.cta_text || ""}
                          photoSize={selectedPost.photo_size || ""}
                          fontFamily={selectedPost.font_family || ""}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {selectedPost && (
              <div className="col-span-1 border-gray-200 dark:border-gray-700 p-4 h-[calc(100vh-7rem)] flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl mb-4">
                    Edit Post
                  </h2>

                  {/* Datepicker */}
                  <div className="mb-4 w-full">
                    <Label
                      htmlFor="time_post"
                      className="text-sm text-gray-500 dark:text-gray-400">
                      Schedule Post
                    </Label>
                    <div className="customDatePickerWidth">
                      <Datepicker
                        inline
                        onSelectedDateChanged={(date) => {
                          setDateInput(date);
                        }}
                      />
                    </div>
                    <div>
                      Selected Date:{" "}
                      {dateInput ? dateInput.toDateString() : "None"}
                    </div>
                  </div>

                  <div className="mb-4 w-full">
                    <label
                      htmlFor="time"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Select time:
                    </label>
                    <div className="relative w-full">
                      <div className="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-500 dark:text-gray-400"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            fillRule="evenodd"
                            d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <input
                        type="time"
                        id="time"
                        className="bg-gray-50 border leading-none border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        min="09:00"
                        max="18:00"
                        value={postTime}
                        required
                        onChange={(e) => setPostTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    color={"info"}
                    onClick={() => handleSavePostSchedule(selectedPost)}
                    className="mb-4 w-full">
                    Save
                  </Button>
                </div>
              </div>
            )}

            <div className={selectedPost ? "col-span-2" : "col-span-4"}>
              <div className="overflow-hidden shadow">
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
                {posts.length > 8 && (
                  <div className="absolute bottom-4 right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center z-50">
                    <span className="text-white text-lg">
                      <FaChevronDown />
                    </span>
                  </div>
                )}
                {posts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-1 max-h-[calc(100vh-11rem)] overflow-y-auto hide-scrollbar">
                    {posts
                      .filter((post) =>
                        post.name
                          .toLowerCase()
                          .includes(searchValue.toLowerCase())
                      )
                      .sort((a, b) =>
                        (a.time_post ?? "") < (b.time_post ?? "") ? 1 : -1
                      )
                      .map((post) => (
                        <div
                          key={post.id}
                          style={{ height: `calc((100vh - 11rem) / 8)` }}
                          className="rounded-lg shadow-md p-4 flex justify-between border border-gray-200 dark:border-gray-500 bg-transparent rounded-lg">
                          <div className="flex items-center gap-4">
                            <img
                              src={
                                postMedias.find(
                                  (media) => media.post_id === post.id
                                )?.media_url
                              }
                              alt={post.name}
                              className="w-16 h-16 object-cover rounded-md"
                            />
                            <div className="w-[20vw]" style={{ maxWidth: "50%" }}>
                              <div className="flex items-center gap-x-5">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl flex items-center gap-x-2 truncate">
                                  {post.name}
                                </h2>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(post.time_post)}
                              </p>
                            </div>
                            {getBadge(post)}
                          </div>
                          <div className="flex items-center gap-4">
                            {/* If no time post */}
                            {!post.time_post && (
                              <Button
                                className="w-40"
                                color={"info"}
                                onClick={() => setSelectedPost(post)}>
                                Schedule
                              </Button>
                            )}

                            {/* If time post is in the future */}
                            {post.time_post &&
                              post.time_post > new Date().toISOString() && (
                                <Button
                                  className="w-40"
                                  color={"info"}
                                  onClick={() => setSelectedPost(post)}>
                                  Reschedule
                                </Button>
                              )}

                            {/* If time post is in the past */}
                            {post.time_post &&
                              post.time_post < new Date().toISOString() && (
                                <Button
                                  className="w-40"
                                  color="failure"
                                  onClick={() =>
                                        handleClearPostSchedule(post.id)
                                  }>
                                  Unpublish
                                </Button>
                              )}

                            <Button
                              className="w-40"
                              color={"info"}
                              onClick={() => setSelectedPost(post)}>
                              Preview
                            </Button>
                          </div>
                        </div>
                      ))}
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
            </div>
          </div>
        </div>
      </div>
      {/* <Pagination /> */}
    </NavbarSidebarLayout>
  );
};

const getBadge = (post: Post) => {
  // Generate based on time post and status
  if (post.time_post && post.time_post > new Date().toISOString()) {
    return (
      <Badge color="yellow" className="text-xs w-fit">
        Scheduled
      </Badge>
    );
  }

  if (post.time_post && post.time_post < new Date().toISOString()) {
    return (
      <Badge color="green" className="text-xs w-fit">
        Published
      </Badge>
    );
  }

  return (
    <Badge color="gray" className="text-xs w-filter">
      Draft
    </Badge>
  );
};

export default SchedulePostListPage;

const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return "Not scheduled";

  const dateObj = date instanceof Date ? date : new Date(date);

  return dateObj.toLocaleString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // Ensures 24-hour format
  });
};
