import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

const ConversationList = ({ conversations, currentReceiverId, onSelectConversation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter conversations by search term
  const filteredConversations = conversations.filter(
    conversation => conversation.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>
      
      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredConversations.map((conversation) => (
              <li 
                key={conversation.user._id}
                className={`hover:bg-gray-50 cursor-pointer ${
                  currentReceiverId === conversation.user._id ? 'bg-gray-50' : ''
                }`}
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="px-4 py-4 flex items-center">
                  <div className="flex-shrink-0 relative">
                    {conversation.user.profileImage ? (
                      <img 
                        src={conversation.user.profileImage} 
                        alt={conversation.user.name}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-800 font-medium text-sm">
                          {conversation.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {conversation.user.isOnline && (
                      <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-green-400" />
                    )}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conversation.user.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {conversation.lastMessage?.createdAt && 
                          formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.lastMessage?.content || 'No messages yet'}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No conversations found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
