import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PaperAirplaneIcon, 
  PaperClipIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import AuthContext from '../../context/AuthContext';
import SocketContext from '../../context/SocketContext';
import useApi from '../../hooks/useApi';
import { formatDate } from '../../utils/helpers';
import ConversationList from '../../components/common/ConversationList';
import MessageBubble from '../../components/common/MessageBubble';

const Messages = () => {
  const { user } = useContext(AuthContext);
  const { socket, sendPrivateMessage } = useContext(SocketContext);
  const { get, post, loading } = useApi();
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentReceiver, setCurrentReceiver] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  
  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await get('/messages/conversations');
        if (response.success) {
          setConversations(response.data.conversations);
          
          // If userId is provided in URL, set current receiver
          if (userId) {
            const conversation = response.data.conversations.find(
              conv => conv.user._id === userId
            );
            
            if (conversation) {
              setCurrentReceiver(conversation.user);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
      }
    };
    
    fetchConversations();
  }, [get, userId]);
  
  // Fetch messages when current receiver changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentReceiver) return;
      
      setIsLoading(true);
      try {
        const response = await get(`/messages/${currentReceiver._id}`);
        if (response.success) {
          setMessages(response.data.messages);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessages();
    
    // Update URL
    if (currentReceiver) {
      navigate(`/client/messages/${currentReceiver._id}`, { replace: true });
    } else {
      navigate('/client/messages', { replace: true });
    }
  }, [currentReceiver, get, navigate]);
  
  // Listen for new messages
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (data) => {
      if (currentReceiver && data.senderId === currentReceiver._id) {
        setMessages(prev => [...prev, {
          sender: { _id: data.senderId },
          receiver: { _id: user._id },
          content: data.content,
          createdAt: data.timestamp
        }]);
      }
      
      // Update conversations list
      setConversations(prev => {
        const updatedConversations = [...prev];
        const conversationIndex = updatedConversations.findIndex(
          conv => conv.user._id === data.senderId
        );
        
        if (conversationIndex !== -1) {
          // Update existing conversation
          updatedConversations[conversationIndex] = {
            ...updatedConversations[conversationIndex],
            lastMessage: {
              content: data.content,
              createdAt: data.timestamp
            },
            unreadCount: currentReceiver && currentReceiver._id === data.senderId 
              ? 0 
              : updatedConversations[conversationIndex].unreadCount + 1
          };
        } else {
          // Add new conversation
          // In a real app, you would fetch user details
          updatedConversations.unshift({
            user: { _id: data.senderId, name: 'User' },
            lastMessage: {
              content: data.content,
              createdAt: data.timestamp
            },
            unreadCount: 1
          });
        }
        
        return updatedConversations;
      });
    };
    
    socket.on('newMessage', handleNewMessage);
    
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, currentReceiver, user]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentReceiver) return;
    
    try {
      // Send message via socket
      sendPrivateMessage(currentReceiver._id, newMessage);
      
      // Add message to UI immediately
      setMessages(prev => [...prev, {
        sender: { _id: user._id },
        receiver: { _id: currentReceiver._id },
        content: newMessage,
        createdAt: new Date()
      }]);
      
      // Clear input
      setNewMessage('');
      
      // Save message to database
      await post('/messages', {
        receiverId: currentReceiver._id,
        content: newMessage
      });
      
      // Update conversations list
      setConversations(prev => {
        const updatedConversations = [...prev];
        const conversationIndex = updatedConversations.findIndex(
          conv => conv.user._id === currentReceiver._id
        );
        
        if (conversationIndex !== -1) {
          // Update existing conversation
          updatedConversations[conversationIndex] = {
            ...updatedConversations[conversationIndex],
            lastMessage: {
              content: newMessage,
              createdAt: new Date()
            },
            unreadCount: 0
          };
          
          // Move to top
          const conversation = updatedConversations.splice(conversationIndex, 1)[0];
          updatedConversations.unshift(conversation);
        } else {
          // Add new conversation
          updatedConversations.unshift({
            user: currentReceiver,
            lastMessage: {
              content: newMessage,
              createdAt: new Date()
            },
            unreadCount: 0
          });
        }
        
        return updatedConversations;
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };
  
  // Handle select conversation
  const handleSelectConversation = (conversation) => {
    setCurrentReceiver(conversation.user);
    
    // Mark as read
    if (conversation.unreadCount > 0) {
      setConversations(prev => {
        const updatedConversations = [...prev];
        const conversationIndex = updatedConversations.findIndex(
          conv => conv.user._id === conversation.user._id
        );
        
        if (conversationIndex !== -1) {
          updatedConversations[conversationIndex] = {
            ...updatedConversations[conversationIndex],
            unreadCount: 0
          };
        }
        
        return updatedConversations;
      });
    }
  };
  
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>
      
      <div className="flex flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-gray-200">
          <ConversationList 
            conversations={conversations}
            currentReceiverId={currentReceiver?._id}
            onSelectConversation={handleSelectConversation}
          />
        </div>
        
        {/* Messages */}
        <div className="w-2/3 flex flex-col">
          {currentReceiver ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex items-center">
                <button 
                  className="md:hidden mr-2 text-gray-500"
                  onClick={() => setCurrentReceiver(null)}
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div className="flex-shrink-0">
                  {currentReceiver.profileImage ? (
                    <img 
                      src={currentReceiver.profileImage} 
                      alt={currentReceiver.name}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-800 font-medium text-sm">
                        {currentReceiver.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{currentReceiver.name}</p>
                  <p className="text-xs text-gray-500">
                    {currentReceiver.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              
              {/* Messages List */}
              <div className="flex-1 p-4 overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <MessageBubble
                        key={index}
                        message={message}
                        isOwn={message.sender._id === user._id}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No messages yet</p>
                    <p className="text-sm text-gray-400">Send a message to start the conversation</p>
                  </div>
                )}
              </div>
              
              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex items-center">
                  <button
                    type="button"
                    className="p-2 rounded-full text-gray-500 hover:text-gray-600 focus:outline-none"
                  >
                    <PaperClipIcon className="h-5 w-5" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border-0 focus:ring-0 focus:outline-none px-4 py-2"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2 rounded-full text-white bg-primary-600 hover:bg-primary-700 focus:outline-none disabled:opacity-50"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-500">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
