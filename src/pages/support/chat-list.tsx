import React, { useState } from "react";
import { Label, TextInput } from "flowbite-react";
import { Conversation } from "../../context/ConversationContext";
import { useUserContext } from "../../context/UserContext";

interface ChatListProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
}

const ChatList: React.FC<ChatListProps> = ({
  conversations,
  onSelectConversation,
}) => {
  const {users} = useUserContext();
  const [search, setSearch] = useState("");

  return (
    <div className="overflow-y-auto h-full divide-gray-200 dark:divide-gray-700">
      <div className="p-4 bg-white dark:bg-gray-800 flex justify-between items-center space-x-4">
        <form className="lg:pr-3">
          <Label htmlFor="users-search" className="sr-only">
            Search
          </Label>
          <div className="relative mt-1 lg:w-32 xl:w-48">
            <TextInput
              id="users-search"
              name="users-search"
              placeholder="Search for users"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />
          </div>
        </form>
      </div>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700 overflow-y-auto flex-grow">
        {conversations
        .filter((conversation) => {
          const customerUserId = conversation.participants.find((p) => p.user_id)?.user_id;
          const email = users.find((u) => u.id === customerUserId)?.email ?? "";
          return email.toLowerCase().includes(search.toLowerCase());
        })
        .map((conversation, index) => (
          <li
            key={index}
            className={`p-4 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-600`}
            onClick={() => onSelectConversation(conversation)}>
            <div className="flex justify-between 2xl:space-x-4 items-center">
              <div className="flex space-x-4 xl:mb-4 2xl:mb-0 w-full items-center">
                <div className="min-w-0 flex-1 w-fit">
                  <p className="mb-0.5 truncate text-base font-semibold leading-none text-gray-900 dark:text-white flex items-center gap-x-2">
                    {(() => {
                      const customerUserId = conversation.participants.find((p) => p.user_id)?.user_id;
                      return users.find((u) => u.id === customerUserId)?.email;
                    })()}
                  </p>
                  {conversation.messages.length > 0 && (
                    <>
                      <p className="mb-1 truncate text-sm text-gray-500 dark:text-gray-400 font-normal">
                        {conversation.messages[0].content}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatList;
