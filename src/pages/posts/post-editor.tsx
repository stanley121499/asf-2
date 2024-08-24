import { Button } from "flowbite-react";
import React, { useEffect } from "react";
import { PostFolder } from "../../context/post/PostFolderContext";
import {
  Post,
  PostInsert,
  usePostContext,
} from "../../context/post/PostContext";
import {
  PostFolderMedia,
  usePostFolderMediaContext,
} from "../../context/post/PostFolderMediaContext";
import {
  usePostMediaContext,
  PostMediaInsert,
} from "../../context/post/PostMediaContext";
import * as flowbiteReact from "flowbite-react";
import { useAlertContext } from "../../context/AlertContext";
import PostComponent from "../../components/post/post";
import { FaChevronDown } from "react-icons/fa6";

interface PostEditorProps {
  selectedFolder: PostFolder | null;
  setSelectedFolder: React.Dispatch<React.SetStateAction<PostFolder | null>>;
  selectedPost: Post | null;
  setSelectedPost: React.Dispatch<React.SetStateAction<Post | null>>;
}

const PostEditor: React.FC<PostEditorProps> = ({
  selectedFolder,
  setSelectedFolder,
  setSelectedPost,
  selectedPost,
}) => {
  const { createPostMedia, deleteAllPostMediaByPostId, postMedias } =
    usePostMediaContext();
  const { createPost, updatePost } = usePostContext();
  const { showAlert } = useAlertContext();
  const { postFolderMedias } = usePostFolderMediaContext();
  const [postDetailToggle, setPostDetailToggle] = React.useState(false);
  const [selectedMedias, setSelectedMedias] = React.useState<PostFolderMedia[]>(
    []
  );
  const [arrangedMedias, setArrangedMedias] = React.useState<PostFolderMedia[]>(
    []
  );
  const [previewMedia, setPreviewMedia] = React.useState<string>("");

  const [postData, setPostData] = React.useState<PostInsert>({
    name: selectedPost?.name || "",
    post_folder_id: selectedFolder?.id,
    caption: selectedPost?.caption || "",
    caption_position: selectedPost?.caption_position || "BOTTOM",
    photo_size: selectedPost?.photo_size || "MEDIUM",
    cta_text: selectedPost?.cta_text || "",
  });

  const handleSave = () => {
    // Check if all fields are filled
    if (!postData.name || !postData.caption || !postData.cta_text) {
      showAlert("Please fill all fields", "error");
      return;
    }

    console.log("Save post");
    console.log(postData);
    if (selectedPost) {
      updatePost({ ...postData, id: selectedPost.id }).then(() => {
        deleteAllPostMediaByPostId(selectedPost.id);

        arrangedMedias.forEach((media, index) => {
          const newPostMedia: PostMediaInsert = {
            post_id: selectedPost.id,
            media_url: media.media_url,
            arrangement: index,
          };

          createPostMedia(newPostMedia);
        });

        setSelectedFolder(null);
        setSelectedPost(null);
        showAlert("Post updated successfully", "success");
      });
    } else {
      createPost(postData).then((post) => {
        if (post) {
          arrangedMedias.forEach((media, index) => {
            const newPostMedia: PostMediaInsert = {
              post_id: post.id,
              media_url: media.media_url,
              arrangement: index,
            };

            createPostMedia(newPostMedia);
          });

          setSelectedFolder(null);
          setSelectedPost(post);
          showAlert("Post created successfully", "success");
        }
      });
    }
  };

  useEffect(() => {
    if (selectedPost) {
      setPostData({
        name: selectedPost.name,
        post_folder_id: selectedPost.post_folder_id,
        caption: selectedPost.caption,
        caption_position: selectedPost.caption_position,
        photo_size: selectedPost.photo_size,
        cta_text: selectedPost.cta_text,
      });

      selectedPost.medias = postMedias.filter(
        (media) => media.post_id === selectedPost.id
      );

      // Compare media_url in selectedPost.medias and postFolderMedias to generate an array of PostFolderMedia
      const selectedPostMedias = selectedPost.medias.map((media) => {
        return (
          postFolderMedias.find((pfm) => pfm.media_url === media.media_url) ||
          null
        );
      });

      setArrangedMedias(
        selectedPostMedias.filter(
          (media) => media !== null
        ) as PostFolderMedia[]
      );
    } else {
      setPostData({
        name: "",
        post_folder_id: selectedFolder?.id,
        caption: "",
        caption_position: "BOTTOM",
        photo_size: "MEDIUM",
        cta_text: "",
      });

      setArrangedMedias([]);
      setSelectedMedias([]);
    }
  }, [postFolderMedias, postMedias, selectedFolder?.id, selectedPost]);

  return (
    <>
      {selectedFolder && (
        <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-4">
          <div className="col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                {postDetailToggle ? "Post Details" : "Medias"}
              </h2>
              <div className="flex items-center space-x-2">
                <Button
                  className="btn btn-primary"
                  onClick={() => {
                    setPostDetailToggle(!postDetailToggle);
                  }}>
                  {postDetailToggle ? "Medias" : "Post Details"}
                </Button>
                <Button className="btn btn-green" onClick={handleSave}>
                  Save
                </Button>
              </div>
            </div>

            {!postDetailToggle && (
              <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-4 mt-4 overflow-auto hide-scrollbar max-h-[calc(100vh-4rem)] relative">
                {selectedFolder.medias.length > 12 && (
                  <div className="absolute bottom-4 right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center z-50">
                    <span className="text-white text-lg">
                      <FaChevronDown />
                    </span>
                  </div>
                )}
                {selectedFolder.medias.map((media) => (
                  // <Card key={media.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <>
                    <div
                      className="relative group cursor-pointer"
                      key={media.id}
                      onClick={() => {
                        const isMediaSelected = selectedMedias.find(
                          (m) => m.id === media.id
                        );
                        if (isMediaSelected) {
                          setPreviewMedia(media.media_url);
                        } else {
                          setSelectedMedias((prev) => [...prev, media]);
                          setPreviewMedia(media.media_url);
                        }
                      }}>
                      <img
                        src={media.media_url}
                        alt="media"
                        className="w-full object-cover rounded"
                        style={{ height: `calc((100vh - 9rem) / 4)` }}
                      />
                      {/* Show a tick on top of the image if selected */}
                      {(selectedMedias.find((m) => m.id === media.id) ||
                        arrangedMedias.find((m) => m.id === media.id)) && (
                        <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 p-1 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-green-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </>
                ))}
              </div>
            )}

            {postDetailToggle && (
              <>
                {/* Name */}
                <div className="mt-4">
                  <flowbiteReact.Label>Name</flowbiteReact.Label>
                  <flowbiteReact.TextInput
                    id="name"
                    name="name"
                    placeholder="Enter name"
                    // icon={HiMail}
                    value={postData?.name}
                    onChange={(e) =>
                      setPostData({ ...postData, name: e.target.value })
                    }
                  />
                </div>

                {/* Caption */}
                <div className="mt-4">
                  <flowbiteReact.Label>Caption</flowbiteReact.Label>
                  <flowbiteReact.Textarea
                    id="caption"
                    name="caption"
                    placeholder="Enter caption"
                    value={postData?.caption || ""}
                    onChange={(e) =>
                      setPostData({ ...postData, caption: e.target.value })
                    }
                  />
                </div>

                {/* Create a divider here */}
                <div className="border-t border-gray-200 dark:border-gray-800 my-4"></div>

                {/* Photo Size */}
                <div className="mt-4">
                  <flowbiteReact.Label>Photo Size</flowbiteReact.Label>
                  <flowbiteReact.Select
                    id="photo_size"
                    name="photo_size"
                    value={postData?.photo_size || "MEDIUM"}
                    onChange={(e) =>
                      setPostData({ ...postData, photo_size: e.target.value })
                    }>
                    <option value="SMALL">Small</option>
                    <option value="MEDIUM">Medium</option>
                    {/* <option value="LARGE">Large</option> */}
                  </flowbiteReact.Select>
                </div>

                {/* Caption Position */}
                <div className="mt-4">
                  <flowbiteReact.Label>Caption Position</flowbiteReact.Label>
                  <flowbiteReact.Select
                    id="caption_position"
                    name="caption_position"
                    value={postData?.caption_position || "BOTTOM"}
                    onChange={(e) =>
                      setPostData({
                        ...postData,
                        caption_position: e.target.value,
                      })
                    }>
                    <option value="TOP">Top</option>
                    <option value="MIDDLE">Middle</option>
                    <option value="BOTTOM">Bottom</option>
                  </flowbiteReact.Select>
                </div>

                {/* Font Family */}
                <div className="mt-4">
                  <flowbiteReact.Label>Font Family</flowbiteReact.Label>
                  <flowbiteReact.Select
                    id="font_family"
                    name="font_family"
                    value={postData?.font_family || "DEFAULT"}
                    onChange={(e) =>
                      setPostData({ ...postData, font_family: e.target.value })
                    }>
                    <option value="DEFAULT">Default</option>
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Tahoma">Tahoma</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Lobster">Lobster</option>
                    <option value="Dancing Script">Dancing Script</option>
                  </flowbiteReact.Select>
                </div>

                {/* Create a divider here */}
                <div className="border-t border-gray-200 dark:border-gray-800 my-4"></div>

                {/* Call to Action Text */}
                <div className="mt-4">
                  <flowbiteReact.Label>Call to Action Text</flowbiteReact.Label>
                  <flowbiteReact.TextInput
                    id="cta_text"
                    name="cta_text"
                    placeholder="Enter call to action text"
                    value={postData?.cta_text || ""}
                    onChange={(e) =>
                      setPostData({ ...postData, cta_text: e.target.value })
                    }
                  />
                </div>
              </>
            )}
          </div>
          <div className="col-span-1">
            <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
              <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
              <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
              <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
              <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
              <div className="rounded-[2rem] overflow-hidden w-[272px] h-[572px] bg-white">
                <div className="pt-5">
                  <PostComponent
                    caption={postData.caption || ""}
                    medias={arrangedMedias.map((m) => m.media_url)}
                    captionPosition={postData.caption_position || ""}
                    ctaText={postData.cta_text || ""}
                    photoSize={postData.photo_size || ""}
                    previewMedia={previewMedia}
                    fontFamily={postData.font_family || ""}
                  />
                </div>
              </div>
            </div>

            <h5 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">
              Selected Medias
            </h5>
            <div className="grid grid-cols-4 gap-2 mt-4">
              {arrangedMedias.map((media) => (
                <div
                  key={media.id}
                  className="relative group cursor-pointer"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setArrangedMedias((prev) =>
                      prev.filter((m) => m.id !== media.id)
                    );
                  }}>
                  <img
                    src={media.media_url}
                    alt="media"
                    className="w-16 h-16 object-cover rounded"
                  />
                  {/* Show the arrangement index on top of the image */}
                  <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 p-1 rounded-full">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {arrangedMedias.indexOf(media) + 1}
                    </p>
                  </div>
                </div>
              ))}

              {selectedMedias
                .filter(
                  (media) => !arrangedMedias.find((m) => m.id === media.id)
                )
                .map((media) => (
                  <div
                    key={media.id}
                    className="relative group cursor-pointer"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setSelectedMedias((prev) =>
                        prev.filter((m) => m.id !== media.id)
                      );
                    }}
                    onClick={() => {
                      setArrangedMedias((prev) => [...prev, media]);
                    }}>
                    <img
                      src={media.media_url}
                      alt="media"
                      className="w-16 h-16 object-cover rounded"
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
      {!selectedFolder && (
        <div
          className="flex items-center justify-center"
          style={{ height: "calc(100vh - 4rem)" }}>
          <div className="text-center">
            <img
              alt=""
              src="/images/illustrations/sign-in.svg"
              className="lg:max-w-md"
            />
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Select a folder to start
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default PostEditor;
