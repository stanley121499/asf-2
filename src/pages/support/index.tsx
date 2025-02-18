/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from "react";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import ChatList from "./chat-list";
import ChatWindow from "./chat-window";
import {
  Conversation,
  useConversationContext,
} from "../../context/ConversationContext";
import LoadingPage from "../pages/loading";

const SupportPage: React.FC = function () {
  const { conversations, loading } = useConversationContext();
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  useEffect(() => {}, []);

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <NavbarSidebarLayout>
      <div className="relative grid grid-cols-1 overflow-y-hidden xl:h-[calc(100vh)] xl:grid-cols-4 xl:gap-4">
        <ChatList
          conversations={conversations}
          onSelectConversation={setSelectedConversation}
        />
        {selectedConversation && (
          <ChatWindow
            conversation={selectedConversation}
            messages={selectedConversation.messages}
          />
        )}

        {!selectedConversation && (
          <div className="flex items-center justify-center h-full col-span-3">
            <div className="text-center">
              <img
                alt=""
                src="/images/illustrations/404.svg"
                className="lg:max-w-md"
              />
              <h1 className="text-2xl font-bold dark:text-white">
                Select a conversation to start chatting
              </h1>
            </div>
          </div>
        )}
      </div>
    </NavbarSidebarLayout>
  );
};

export default SupportPage;
