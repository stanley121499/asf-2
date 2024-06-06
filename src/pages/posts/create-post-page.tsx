import React, { useEffect } from "react";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import { Button, Card, Label } from "flowbite-react";
import {
  usePostFolderContext,
  PostFolder,
  PostFolderInsert,
} from "../../context/post/PostFolderContext";
import { usePostContext, Post } from "../../context/post/PostContext";
import {
  usePostFolderMediaContext,
  PostFolderMediaInsert,
} from "../../context/post/PostFolderMediaContext";
import { useAlertContext } from "../../context/AlertContext";
import { supabase } from "../../utils/supabaseClient";
import ReactDropzone from "react-dropzone";
import PostEditor from "./post-editor";
import { useParams } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa6";

const CreatePostPage: React.FC = () => {
  const { postFolders, createPostFolder } = usePostFolderContext();
  const { posts } = usePostContext();
  const { showAlert } = useAlertContext();
  const { createPostFolderMedia } = usePostFolderMediaContext();
  const [selectedFolder, setSelectedFolder] = React.useState<PostFolder | null>(
    null
  );
  const [selectedPost, setSelectedPost] = React.useState<Post | null>(null);
  const { folderId, postId } = useParams();

  useEffect(() => {
    if (folderId) {
      setSelectedFolder(
        postFolders.find((folder) => folder.id === folderId) || null
      );
    }

    if (postId) {
      setSelectedPost(posts.find((post) => post.id === postId) || null);
    }
  }, [folderId, postFolders, postId, posts]);

  // Function to handle changes when files are selected
  const handleUpload = (acceptedFiles: File[], folderName: string) => {
    // Create a new Post Folder
    const newPostFolder: PostFolderInsert = {
      name: folderName,
      image_count: acceptedFiles.filter(
        (file) =>
          file.type.includes("png") ||
          file.type.includes("jpg") ||
          file.type.includes("jpeg") ||
          file.type.includes("gif")
      ).length,
      video_count: acceptedFiles.filter(
        (file) =>
          file.type.includes("mp4") ||
          file.type.includes("mov") ||
          file.type.includes("avi")
      ).length,
    };

    createPostFolder(newPostFolder).then((postFolder) => {
      if (postFolder) {
        acceptedFiles.forEach(async (file) => {
          // Generate Random Unique ID for the media
          const randomId = Math.random().toString(36).substring(2);

          const { data, error } = await supabase.storage
            .from("post_medias")
            .upload(`${randomId}`, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (error) {
            console.error(error);
            showAlert("Failed to upload file", "error");
            return;
          }

          const newPostFolderMedia: PostFolderMediaInsert = {
            post_folder_id: postFolder.id,
            media_url:
              "https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/" +
              data.path,
          };

          createPostFolderMedia(newPostFolderMedia)
            .then(() => {
              showAlert("Files uploaded successfully", "success");
            })
            .catch((error) => {
              showAlert(error.message, "error");
              console.error(error);
            });
        });
      }
    });
  };

  return (
    <NavbarSidebarLayout>
      <div className="grid grid-cols-1 px-4 pt-6 xl:grid-cols-6 xl:gap-4 h-[100vh] overflow-y-auto hide-scrollbar">
        <div className="col-span-1 border-r border-gray-200 dark:border-gray-700 p-2 h-full overflow-y-auto hide-scrollbar max-h-[100vh]">
          <h5 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Folders
          </h5>
          <div className="grid grid-cols-1 gap-4 relative">
            {postFolders.length > 6 && (
              <div className="absolute bottom-4 right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center z-50">
                <span className="text-white text-lg">
                  <FaChevronDown />
                </span>
              </div>
            )}
            <ReactDropzone
              onDrop={(acceptedFiles) => {
                // Get Folder Name using split, could be first or second index, could be /  or \\
                let folderName =
                  (acceptedFiles[0] as any).path.split(/[/\\]/)[1] ||
                  (acceptedFiles[0] as any).path.split(/\/|\\/)[0];

                handleUpload(acceptedFiles, folderName);
              }}>
              {({ getRootProps, getInputProps }) => (
                <div
                  style={{ height: `calc((100vh - 10rem) / 6)` }}
                  className="flex w-full items-center justify-center"
                  {...getRootProps()}>
                  <Label
                    htmlFor="dropzone-file"
                    className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                    <div className="flex flex-col items-center justify-center pb-6 pt-5">
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        SVG, PNG, JPG or GIF (MAX. 800x400px)
                      </p>
                    </div>
                    <input {...getInputProps({ webkitdirectory: "true" })} />
                  </Label>
                </div>
              )}
            </ReactDropzone>

            {postFolders.map((folder) =>
              Array(1)
                .fill(null)
                .map((_, index) => (
                  <Card
                    key={`${folder.id}-${index}`}
                    onClick={() => {
                      setSelectedFolder(folder);
                      setSelectedPost(null);
                    }}
                    style={{ height: `calc((100vh - 10rem) / 6)` }}
                    className="bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer dark:bg-gray-900">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white m-0">
                        {folder.name}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Photos: {folder.image_count} <br /> Videos:{" "}
                        {folder.video_count} <br /> Created:{" "}
                        {folder.created_at.split("T")[0]}
                      </p>
                    </div>
                  </Card>
                ))
            )}
          </div>
        </div>

        <div className="col-span-4">
          <PostEditor
            selectedFolder={selectedFolder}
            setSelectedFolder={setSelectedFolder}
            setSelectedPost={setSelectedPost}
            selectedPost={selectedPost}
          />
        </div>
        <div className="col-span-1 border-l border-gray-200 dark:border-gray-700 p-2 h-full">
          <Button
            className="btn btn-primary w-full mb-4"
            onClick={() => {
              setSelectedPost(null);
            }}>
            New Post
          </Button>
          <h5 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Posts
          </h5>
          <div className="grid grid-cols-1 gap-4 relative max-h-[calc(100vh-9rem)] overflow-y-auto hide-scrollbar">
            {posts.length > 6 && (
              <div className="absolute bottom-4 right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center z-50">
                <span className="text-white text-lg">
                  <FaChevronDown />
                </span>
              </div>
            )}
            {posts
              .filter((post) => post.post_folder_id === selectedFolder?.id)
              .flatMap((post) =>
                Array(1)
                  .fill(null)
                  .map((_, index) => (
                    <Card
                      key={`${post.id}-${index}`}
                      onClick={() => setSelectedPost(post)}
                      style={{ height: `calc((100vh - 9rem) / 8)` }}
                      className="bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer dark:bg-gray-900">
                      <div className="flex flex-col items-start justify-center h-full">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {post.name}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Created: {post.created_at.split("T")[0]}{" "}
                          {post.created_at.split("T")[1].split(".")[0]}
                        </p>
                      </div>
                    </Card>
                  ))
              )}
          </div>
        </div>
      </div>
    </NavbarSidebarLayout>
  );
};

export default CreatePostPage;
