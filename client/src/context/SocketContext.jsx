import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import AuthContext from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, token } = useContext(AuthContext);

  useEffect(() => {
    // Only connect to socket if user is authenticated
    if (token && user) {
      // Create socket connection
      const newSocket = io("http://localhost:8000", {
        auth: {
          token,
        },
      });

      // Set socket state
      setSocket(newSocket);

      // Join user's room for private messages
      newSocket.emit("join", user._id);
      console.log(`User ${user._id} joining socket room for notifications`);

      // Socket event listeners
      newSocket.on("connect", () => {
        console.log("Connected to socket server");
      });

      newSocket.on("disconnect", () => {
        console.log("Disconnected from socket server");
      });

      // Listen for bid acceptance
      newSocket.on("yourBidAccepted", (data) => {
        console.log("Received bid acceptance notification:", data);
      });

      // Clean up on unmount
      return () => {
        newSocket.disconnect();
      };
    } else {
      // Disconnect socket if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [token, user]);

  // Send a private message
  const sendPrivateMessage = (receiverId, content) => {
    if (socket && user) {
      const messageData = {
        senderId: user._id,
        receiverId,
        content,
      };

      socket.emit("privateMessage", messageData);
      return true;
    }
    return false;
  };

  // Submit a bid
  const submitBid = (projectId, bid) => {
    if (socket && user) {
      const bidData = {
        projectId,
        bid,
      };

      socket.emit("newBid", bidData);
      return true;
    }
    return false;
  };

  // Notify about bid acceptance
  const notifyBidAccepted = (projectId, freelancerId, project) => {
    if (socket && user) {
      console.log(`Emitting bidAccepted event to freelancer ${freelancerId}`);
      console.log("Project data being sent:", project);

      // Make sure the project has the freelancer field set
      const projectToSend = {
        ...project,
        freelancer: project.freelancer || { _id: freelancerId },
      };

      socket.emit("bidAccepted", {
        projectId,
        freelancerId,
        project: projectToSend,
      });

      console.log("Bid acceptance notification sent");
      return true;
    }
    return false;
  };

  // Send counter offer
  const sendCounterOffer = (projectId, bidId, freelancerId, counterOffer) => {
    if (socket && user) {
      console.log(`Emitting counterOffer event to freelancer ${freelancerId}`);

      socket.emit("counterOffer", {
        projectId,
        bidId,
        freelancerId,
        counterOffer,
        clientId: user._id,
        clientName: user.name,
      });

      console.log("Counter offer notification sent");
      return true;
    }
    return false;
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected: socket?.connected || false,
        sendPrivateMessage,
        submitBid,
        notifyBidAccepted,
        sendCounterOffer,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
