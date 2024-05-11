import React from "react";
import { Route, Routes } from "react-router";
import { BrowserRouter } from "react-router-dom";
import FlowbiteWrapper from "./components/FlowbiteWrapper";
import ProtectedRoute from "./components/ProtectedRoute";
import { AlertProvider } from "./context/AlertContext";
import { AuthProvider } from "./context/AuthContext";
import { UserProvider } from "./context/UserContext";
import './index.css';
import DashboardPage from "./pages";
import SignInPage from "./pages/authentication/sign-in";
import HomePage from "./pages/landing/home";
import PrivacyPage from "./pages/legal/privacy";
import NotFoundPage from "./pages/pages/404";
import ServerErrorPage from "./pages/pages/500";
import MaintenancePage from "./pages/pages/maintenance";
import UserListPage from "./pages/users/list";
import UserSettingsPage from "./pages/users/settings";
import { AlertComponent } from "./components/AlertComponent";
import { PostProvider } from "./context/post/PostContext";
import { PostFolderProvider } from "./context/post/PostFolderContext";
import { PostMediaProvider } from "./context/post/PostMediaContext";
import { PostFolderMediaProvider } from "./context/post/PostFolderMediaContext";
import PostListPage from "./pages/posts/list";
import CreatePostPage from "./pages/posts/create-post-page";

const App: React.FC = () => (
  <AlertProvider>
    <AuthProvider>
      <UserProvider>
        <PostProvider>
          <PostFolderMediaProvider>
            <PostFolderProvider>
              <PostMediaProvider>
                <AlertComponent />
                <BrowserRouter>
                  <Routes>
                    <Route element={<FlowbiteWrapper />}>
                      {/* Protected Routes */}
                      <Route element={<ProtectedRoute />} >
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/users/list" element={<UserListPage />} />
                        <Route path="/users/settings" element={<UserSettingsPage />} />
                        <Route path="/posts/list" element={<PostListPage />} />
                        <Route path="/posts/create" element={<CreatePostPage />} />
                      </Route>

                      {/* Public Routes */}
                      <Route path="/" element={<HomePage />} />
                      <Route path="/pages/maintenance" element={<MaintenancePage />} />
                      <Route path="/authentication/sign-in" element={<SignInPage />} />

                      {/* Legal Pages */}
                      <Route path="/legal/privacy" element={<PrivacyPage />} />

                      {/* Error Handling Routes */}
                      <Route path="/500" element={<ServerErrorPage />} />
                      <Route path="*" element={<NotFoundPage />} />

                    </Route>
                  </Routes>
                </BrowserRouter>
              </PostMediaProvider>
            </PostFolderProvider>
          </PostFolderMediaProvider>
        </PostProvider>
      </UserProvider>
    </AuthProvider>
  </AlertProvider>
);

export default App;