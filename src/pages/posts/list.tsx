/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Button,
  Label,
  Table,
  TextInput
} from "flowbite-react";
import React from "react";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import { usePostContext, Posts } from "../../context/post/PostContext";
import { usePostMediaContext } from "../../context/post/PostMediaContext";

const PostListPage: React.FC = function () {
  const { posts, loading } = usePostContext();

  const [searchValue, setSearchValue] = React.useState("");

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <NavbarSidebarLayout>
      <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
        <div className="mb-1 w-full">
          <div className="mb-4">  
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              All Posts
            </h1>
          </div>
          <div className="sm:flex">
            <div className="mb-3 hidden items-center dark:divide-gray-700 sm:mb-0 sm:flex sm:divide-x sm:divide-gray-100">
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
            <div className="ml-auto flex items-center space-x-2 sm:space-x-3">
              <Button href="/posts/create" className="btn btn-primary">
                Create Post
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col p-4 ">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow">
              {posts.length > 0 ? (
                <PostsTable posts={posts.filter((post) => post.name.toLowerCase().includes(searchValue.toLowerCase()))} />

              ) : (
                <div className="p-4 text-center">No posts found</div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* <Pagination /> */}
    </NavbarSidebarLayout>
  );
};

const PostsTable: React.FC<Posts> = function ({ posts }) {
  const { postMedias } = usePostMediaContext();
  const { deletePost } = usePostContext();

  return (
    <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
      {/* <Table.Head className="bg-gray-100 dark:bg-gray-700">
        <Table.HeadCell>Name</Table.HeadCell>
        <Table.HeadCell>Created</Table.HeadCell>
        <Table.HeadCell>Actions</Table.HeadCell>
      </Table.Head> */}
      <Table.Body className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
        {posts.map((post) => (
          <Table.Row key={post.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
            <Table.Cell width={150}>
              <img src={postMedias.find((media) => media.post_id === post.id)?.media_url} alt={post.name} className="w-10 h-10 object-cover rounded-full" />
            </Table.Cell>
            <Table.Cell>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                  {post.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {post.caption}
                </p>
              </div>
            </Table.Cell>
            <Table.Cell>
              <div className="flex items-center gap-x-3 whitespace-nowrap justify-end">
                <Button href={`/posts/create/${post.post_folder_id}/${post.id}`} className="btn btn-primary">
                  Edit
                </Button>
                <Button onClick={() => deletePost(post.id)} color={"red"} >
                  Delete
                </Button>
              </div>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
};


export default PostListPage;
