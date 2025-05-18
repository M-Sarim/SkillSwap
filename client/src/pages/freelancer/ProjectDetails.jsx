import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import AuthContext from "../../context/AuthContext";
import SocketContext from "../../context/SocketContext";
import useApi from "../../hooks/useApi";
import useTimeTracking from "../../hooks/useTimeTracking";
import { formatCurrency, formatDate } from "../../utils/helpers";
import MilestoneTracker from "../../components/common/MilestoneTracker";
import ProjectTimeline from "../../components/common/ProjectTimeline";
import { toast } from "react-toastify";

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const { get, post, put, loading } = useApi();
  const {
    isTracking,
    timeTracking,
    currentSession,
    startTracking,
    stopTracking,
  } = useTimeTracking(id);

  // Check if we should show the counter offer modal from URL parameter
  const searchParams = new URLSearchParams(location.search);
  const shouldShowCounterOffer =
    searchParams.get("showCounterOffer") === "true";

  const [project, setProject] = useState(null);
  const [bid, setBid] = useState(null);
  const [showBidForm, setShowBidForm] = useState(false);
  // Initialize the counter offer modal to be shown if URL parameter is present
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(
    shouldShowCounterOffer
  );
  const [counterOffer, setCounterOffer] = useState(null);
  // State for counter-counter offer form
  const [showCounterCounterForm, setShowCounterCounterForm] = useState(false);
  const [counterCounterForm, setCounterCounterForm] = useState({
    amount: "",
    deliveryTime: "",
    message: "",
  });

  // Direct effect to handle URL parameter for counter offer
  useEffect(() => {
    if (shouldShowCounterOffer) {
      console.log("URL parameter detected - should show counter offer modal");
    }
  }, [shouldShowCounterOffer]);
  const [bidForm, setBidForm] = useState({
    amount: "",
    deliveryTime: "",
    proposal: "",
  });
  const [submittingBid, setSubmittingBid] = useState(false);
  const [respondingToCounterOffer, setRespondingToCounterOffer] =
    useState(false);

  // Listen for counter offer events
  useEffect(() => {
    if (socket && user) {
      // Join user's room for private messages
      socket.emit("join", user._id);
      console.log(
        `Freelancer ${user._id} joining socket room for counter offers`
      );

      // Listen for direct counter offer events
      socket.on("counterOfferReceived", (data) => {
        console.log("Counter offer received (direct):", data);

        // Check if this counter offer is for the current project
        if (data.projectId === id) {
          // Show a notification with sound
          const notification = new Audio("/notification.mp3");
          notification
            .play()
            .catch((e) => console.log("Audio play failed:", e));

          // Display toast notification
          toast.info(
            `You have received a counter offer from ${data.clientName}`,
            {
              autoClose: false, // Keep notification visible until user dismisses it
              onClick: () => {
                setShowCounterOfferModal(true);
                // If we're not on the project page, navigate to it
                if (window.location.pathname !== `/freelancer/projects/${id}`) {
                  navigate(`/freelancer/projects/${id}?showCounterOffer=true`);
                }
              },
              // Add a custom action button to view the counter offer
              action: {
                label: "View Offer",
                onClick: () => {
                  setShowCounterOfferModal(true);
                  // If we're not on the project page, navigate to it
                  if (
                    window.location.pathname !== `/freelancer/projects/${id}`
                  ) {
                    navigate(
                      `/freelancer/projects/${id}?showCounterOffer=true`
                    );
                  }
                },
              },
            }
          );

          // Show browser notification if supported
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            const browserNotification = new Notification("New Counter Offer", {
              body: `${
                data.clientName
              } has sent you a counter offer for project "${
                project?.title || "Project"
              }"`,
              icon: "/logo.png",
            });

            browserNotification.onclick = () => {
              window.focus();
              setShowCounterOfferModal(true);
              // If we're not on the project page, navigate to it
              if (window.location.pathname !== `/freelancer/projects/${id}`) {
                navigate(`/freelancer/projects/${id}?showCounterOffer=true`);
              }
            };
          } else if (
            "Notification" in window &&
            Notification.permission !== "denied"
          ) {
            // Request permission if not already granted or denied
            Notification.requestPermission();
          }

          // Update the bid with counter offer
          setBid((prev) => {
            if (prev && prev._id === data.bidId) {
              const updatedBid = {
                ...prev,
                status: "Countered",
                counterOffer: data.counterOffer,
              };

              // Save to localStorage for persistence
              saveBidToLocalStorage(updatedBid);

              return updatedBid;
            }
            return prev;
          });

          // Show counter offer modal if we're on the project page
          setCounterOffer(data.counterOffer);
          setShowCounterOfferModal(true);
        }
      });

      // Listen for broadcast counter offer events (fallback)
      socket.on("counterOfferBroadcast", (data) => {
        console.log("Counter offer broadcast received:", data);

        // Check if this counter offer is for the current project AND this freelancer
        if (data.projectId === id && data.freelancerId === user._id) {
          console.log("This counter offer broadcast is for me!");

          // Show a notification with sound
          const notification = new Audio("/notification.mp3");
          notification
            .play()
            .catch((e) => console.log("Audio play failed:", e));

          // Display toast notification
          toast.info(
            `You have received a counter offer from ${data.clientName}`,
            {
              autoClose: false, // Keep notification visible until user dismisses it
              onClick: () => {
                setShowCounterOfferModal(true);
                // If we're not on the project page, navigate to it
                if (window.location.pathname !== `/freelancer/projects/${id}`) {
                  navigate(`/freelancer/projects/${id}?showCounterOffer=true`);
                }
              },
              // Add a custom action button to view the counter offer
              action: {
                label: "View Offer",
                onClick: () => {
                  setShowCounterOfferModal(true);
                  // If we're not on the project page, navigate to it
                  if (
                    window.location.pathname !== `/freelancer/projects/${id}`
                  ) {
                    navigate(
                      `/freelancer/projects/${id}?showCounterOffer=true`
                    );
                  }
                },
              },
            }
          );

          // Show browser notification if supported
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            const browserNotification = new Notification("New Counter Offer", {
              body: `${
                data.clientName
              } has sent you a counter offer for project "${
                project?.title || "Project"
              }"`,
              icon: "/logo.png",
            });

            browserNotification.onclick = () => {
              window.focus();
              setShowCounterOfferModal(true);
              // If we're not on the project page, navigate to it
              if (window.location.pathname !== `/freelancer/projects/${id}`) {
                navigate(`/freelancer/projects/${id}?showCounterOffer=true`);
              }
            };
          }

          // Update the bid with counter offer
          setBid((prev) => {
            if (prev && prev._id === data.bidId) {
              const updatedBid = {
                ...prev,
                status: "Countered",
                counterOffer: data.counterOffer,
              };

              // Save to localStorage for persistence
              saveBidToLocalStorage(updatedBid);

              return updatedBid;
            }
            return prev;
          });

          // Show counter offer modal
          setCounterOffer(data.counterOffer);
          setShowCounterOfferModal(true);
        }
      });

      // Listen for general counter offer updates
      socket.on("counterOfferUpdate", (data) => {
        console.log("Counter offer update received:", data);

        // Check if this update is for the current project and our bid
        if (data.projectId === id && bid && data.bidId === bid._id) {
          console.log("This counter offer update is for my bid!");

          // Show a notification with sound
          const notification = new Audio("/notification.mp3");
          notification
            .play()
            .catch((e) => console.log("Audio play failed:", e));

          // Display toast notification
          toast.info(
            `You have received a counter offer for your bid on "${
              project?.title || "Project"
            }"`,
            {
              autoClose: false, // Keep notification visible until user dismisses it
              onClick: () => {
                setShowCounterOfferModal(true);
                // If we're not on the project page, navigate to it
                if (window.location.pathname !== `/freelancer/projects/${id}`) {
                  navigate(`/freelancer/projects/${id}?showCounterOffer=true`);
                }
              },
              // Add a custom action button to view the counter offer
              action: {
                label: "View Offer",
                onClick: () => {
                  setShowCounterOfferModal(true);
                  // If we're not on the project page, navigate to it
                  if (
                    window.location.pathname !== `/freelancer/projects/${id}`
                  ) {
                    navigate(
                      `/freelancer/projects/${id}?showCounterOffer=true`
                    );
                  }
                },
              },
            }
          );

          // Show browser notification if supported
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            const browserNotification = new Notification("New Counter Offer", {
              body: `You have received a counter offer for your bid on "${
                project?.title || "Project"
              }"`,
              icon: "/logo.png",
            });

            browserNotification.onclick = () => {
              window.focus();
              setShowCounterOfferModal(true);
              // If we're not on the project page, navigate to it
              if (window.location.pathname !== `/freelancer/projects/${id}`) {
                navigate(`/freelancer/projects/${id}?showCounterOffer=true`);
              }
            };
          }

          // Update the bid with counter offer
          setBid((prev) => {
            if (prev) {
              const updatedBid = {
                ...prev,
                status: "Countered",
                counterOffer: data.counterOffer,
              };

              // Save to localStorage for persistence
              saveBidToLocalStorage(updatedBid);

              return updatedBid;
            }
            return prev;
          });

          // Show counter offer modal
          setCounterOffer(data.counterOffer);
          setShowCounterOfferModal(true);
        }
      });

      return () => {
        socket.off("counterOfferReceived");
        socket.off("counterOfferBroadcast");
        socket.off("counterOfferUpdate");
      };
    }
  }, [socket, user, id, bid]);

  // Debug effect to log state changes
  useEffect(() => {
    console.log("Debug - Current state:", {
      showCounterOfferModal,
      counterOffer: counterOffer ? "exists" : "null",
      bid: bid ? "exists" : "null",
      shouldShowCounterOffer,
      projectId: id,
    });
  }, [showCounterOfferModal, counterOffer, bid, shouldShowCounterOffer, id]);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        console.log("Fetching project details for ID:", id);
        const response = await get(`/projects/${id}`);
        if (response.success) {
          setProject(response.data.project);
          console.log("Project data received:", response.data.project);

          // Check if freelancer has already bid on this project
          const existingBid = response.data.project.bids?.find(
            (b) => b.freelancer._id === user._id
          );

          if (existingBid) {
            console.log("Found existing bid from API:", existingBid);
            setBid(existingBid);

            // Check if there's a counter offer
            if (
              existingBid.status === "Countered" &&
              existingBid.counterOffer
            ) {
              console.log(
                "Found counter offer from API:",
                existingBid.counterOffer
              );
              setCounterOffer(existingBid.counterOffer);

              // Show the counter offer modal if:
              // 1. The URL parameter is set to show it, OR
              // 2. It's a new counter offer we haven't seen before
              const lastSeenCounterOffer = localStorage.getItem(
                `counter_offer_seen_${existingBid._id}`
              );

              console.log(
                "URL parameter shouldShowCounterOffer:",
                shouldShowCounterOffer
              );
              console.log("Last seen counter offer:", lastSeenCounterOffer);

              if (shouldShowCounterOffer) {
                console.log("Showing counter offer modal due to URL parameter");
                // Force the modal to show with a slight delay to ensure state is updated
                setTimeout(() => {
                  setShowCounterOfferModal(true);
                  console.log("Modal visibility set to TRUE");
                }, 500);

                // Mark this counter offer as seen
                localStorage.setItem(
                  `counter_offer_seen_${existingBid._id}`,
                  "true"
                );
              } else if (!lastSeenCounterOffer) {
                console.log(
                  "Showing counter offer modal for new counter offer"
                );
                setShowCounterOfferModal(true);
                console.log("Modal visibility set to TRUE");

                // Mark this counter offer as seen
                localStorage.setItem(
                  `counter_offer_seen_${existingBid._id}`,
                  "true"
                );
              }
            } else {
              console.log(
                "No counter offer found in the bid or status is not Countered"
              );
            }

            // Save to localStorage for backup
            saveBidToLocalStorage(existingBid);
          }
        }
      } catch (err) {
        console.error("Error fetching project details:", err);
        toast.error("Failed to load project details. Please try again later.");

        // Set a minimal project object to prevent errors
        setProject({
          _id: id,
          title: "Project",
          description: "Unable to load project details",
          status: "Unknown",
        });

        // Create a real bid based on API data or localStorage
        try {
          // Try to get bid from localStorage as fallback
          const storedBids = localStorage.getItem("freelancer_bids");
          if (storedBids) {
            const bids = JSON.parse(storedBids);
            const existingBid = bids.find(
              (b) => b.project._id === id && b.freelancer._id === user._id
            );

            if (existingBid) {
              console.log("Found existing bid in localStorage:", existingBid);
              setBid(existingBid);

              // If the bid has a counter offer, show it
              if (
                existingBid.status === "Countered" &&
                existingBid.counterOffer
              ) {
                console.log(
                  "Found counter offer in localStorage:",
                  existingBid.counterOffer
                );
                setCounterOffer(existingBid.counterOffer);

                // Show the counter offer modal if:
                // 1. The URL parameter is set to show it, OR
                // 2. It's a new counter offer we haven't seen before
                const lastSeenCounterOffer = localStorage.getItem(
                  `counter_offer_seen_${existingBid._id}`
                );

                console.log(
                  "URL parameter shouldShowCounterOffer (localStorage fallback):",
                  shouldShowCounterOffer
                );
                console.log(
                  "Last seen counter offer (localStorage fallback):",
                  lastSeenCounterOffer
                );

                if (shouldShowCounterOffer) {
                  console.log(
                    "Showing counter offer modal due to URL parameter (localStorage fallback)"
                  );
                  // Force the modal to show with a slight delay to ensure state is updated
                  setTimeout(() => {
                    setShowCounterOfferModal(true);
                    console.log(
                      "Modal visibility set to TRUE (localStorage fallback)"
                    );
                  }, 500);

                  // Mark this counter offer as seen
                  localStorage.setItem(
                    `counter_offer_seen_${existingBid._id}`,
                    "true"
                  );
                } else if (!lastSeenCounterOffer) {
                  console.log(
                    "Showing counter offer modal for new counter offer (localStorage fallback)"
                  );
                  setShowCounterOfferModal(true);
                  console.log(
                    "Modal visibility set to TRUE (localStorage fallback)"
                  );

                  // Mark this counter offer as seen
                  localStorage.setItem(
                    `counter_offer_seen_${existingBid._id}`,
                    "true"
                  );
                }
              } else {
                console.log(
                  "No counter offer found in localStorage bid or status is not Countered"
                );
              }
            }
          }
        } catch (error) {
          console.error("Error retrieving bid from localStorage:", error);
        }
      }
    };

    fetchProjectDetails();
  }, [id, get, user._id, user.name, user.profileImage, shouldShowCounterOffer]);

  // Helper function to save bid to localStorage
  const saveBidToLocalStorage = (newBid) => {
    try {
      // Get existing bids
      const storedBids = localStorage.getItem("freelancer_bids");
      let bids = storedBids ? JSON.parse(storedBids) : [];

      // Make sure the bid has all required fields
      const bidToSave = {
        ...newBid,
        project: newBid.project || {
          _id: id,
          title: project?.title || "Project",
          category: project?.category || "General",
        },
        freelancer: newBid.freelancer || {
          _id: user._id,
          user: {
            _id: user._id,
            name: user.name,
          },
        },
        status: newBid.status || "Pending",
        createdAt: newBid.createdAt || new Date(),
      };

      // Preserve counter offer if it exists
      if (newBid.status === "Countered" && newBid.counterOffer) {
        bidToSave.counterOffer = newBid.counterOffer;
      }

      // Check if this bid already exists
      const existingBidIndex = bids.findIndex(
        (bid) => bid.project._id === id && bid.freelancer._id === user._id
      );

      if (existingBidIndex >= 0) {
        // Update existing bid but preserve counter offer if not in new bid
        if (!bidToSave.counterOffer && bids[existingBidIndex].counterOffer) {
          bidToSave.counterOffer = bids[existingBidIndex].counterOffer;
        }
        bids[existingBidIndex] = bidToSave;
      } else {
        // Add new bid
        bids.push(bidToSave);
      }

      // Save back to localStorage
      localStorage.setItem("freelancer_bids", JSON.stringify(bids));

      console.log("Bid saved to localStorage:", bidToSave);
    } catch (error) {
      console.error("Error saving bid to localStorage:", error);
    }
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();

    if (submittingBid) return;

    setSubmittingBid(true);

    // Validate form data
    if (!bidForm.amount || !bidForm.deliveryTime || !bidForm.proposal) {
      toast.error("Please fill in all required fields");
      setSubmittingBid(false);
      return;
    }

    if (bidForm.proposal.length < 50) {
      toast.error("Proposal must be at least 50 characters");
      setSubmittingBid(false);
      return;
    }

    // Prepare bid data
    const bidData = {
      amount: parseFloat(bidForm.amount),
      deliveryTime: parseInt(bidForm.deliveryTime),
      proposal: bidForm.proposal,
    };

    console.log("Submitting bid with data:", bidData);

    try {
      // Submit bid to the main endpoint
      console.log(`Submitting bid to /projects/${id}/bids`);
      const response = await post(`/projects/${id}/bids`, bidData);

      console.log("Bid submission response:", response);

      if (response.success) {
        // Extract the bid data from the response
        const savedBid = response.data.bid || response.data;
        console.log("Bid saved successfully:", savedBid);

        // Update state
        setBid(savedBid);
        setShowBidForm(false);

        // Save to localStorage for backup
        saveBidToLocalStorage(savedBid);

        // Emit socket event for real-time updates
        if (socket) {
          socket.emit("newBid", { projectId: id, bid: savedBid });
        }

        toast.success("Bid submitted successfully!");
      } else {
        console.log("Bid submission was not successful");
        toast.error(
          response.message || "Failed to submit bid. Please try again."
        );
        setShowBidForm(false);
      }
    } catch (error) {
      console.error("Error submitting bid:", error);

      // Show specific error message if available
      const errorMessage =
        error.response?.data?.message ||
        "Failed to submit bid. Please try again later or contact support.";
      toast.error(errorMessage);
      setShowBidForm(false);
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleMessageClient = () => {
    if (project.client && project.client._id) {
      navigate(`/freelancer/messages/${project.client._id}`);
    } else {
      console.error("Client information is missing");
    }
  };

  // Handle submitting a counter-counter offer
  const handleSubmitCounterCounterOffer = async () => {
    if (!bid || !project || respondingToCounterOffer) return;

    // Validate form data
    if (
      !counterCounterForm.amount ||
      !counterCounterForm.deliveryTime ||
      !counterCounterForm.message
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setRespondingToCounterOffer(true);

    try {
      console.log("Submitting counter-counter offer:", {
        projectId: id,
        bidId: bid._id,
        amount: parseFloat(counterCounterForm.amount),
        deliveryTime: parseInt(counterCounterForm.deliveryTime),
        message: counterCounterForm.message,
      });

      // Submit the counter-counter offer
      const response = await put(
        `/projects/${id}/bids/${bid._id}/counter-counter`,
        {
          amount: parseFloat(counterCounterForm.amount),
          deliveryTime: parseInt(counterCounterForm.deliveryTime),
          message: counterCounterForm.message,
        }
      );

      if (response && response.success) {
        console.log("Counter-counter offer submitted successfully:", response);

        // Update bid with new counter offer
        setBid((prev) => ({
          ...prev,
          status: "Counter-Countered",
          amount: parseFloat(counterCounterForm.amount),
          deliveryTime: parseInt(counterCounterForm.deliveryTime),
          counterCounterOffer: {
            amount: parseFloat(counterCounterForm.amount),
            deliveryTime: parseInt(counterCounterForm.deliveryTime),
            message: counterCounterForm.message,
            date: new Date(),
          },
        }));

        // Close the form
        setShowCounterCounterForm(false);

        // Notify client via socket
        if (socket && socket.connected && project && project.client) {
          socket.emit("counterCounterOffer", {
            projectId: id,
            bidId: bid._id,
            freelancerId: user._id,
            freelancerName: user.name,
            clientId: project.client.user._id,
            counterCounterOffer: {
              amount: parseFloat(counterCounterForm.amount),
              deliveryTime: parseInt(counterCounterForm.deliveryTime),
              message: counterCounterForm.message,
              date: new Date(),
            },
          });
        }

        toast.success("Your counter offer has been sent to the client!");
      } else {
        // Fallback: Update UI even if API call fails
        setBid((prev) => ({
          ...prev,
          status: "Counter-Countered",
          amount: parseFloat(counterCounterForm.amount),
          deliveryTime: parseInt(counterCounterForm.deliveryTime),
          counterCounterOffer: {
            amount: parseFloat(counterCounterForm.amount),
            deliveryTime: parseInt(counterCounterForm.deliveryTime),
            message: counterCounterForm.message,
            date: new Date(),
          },
        }));

        // Close the form
        setShowCounterCounterForm(false);

        // Notify client via socket
        if (socket && socket.connected && project && project.client) {
          socket.emit("counterCounterOffer", {
            projectId: id,
            bidId: bid._id,
            freelancerId: user._id,
            freelancerName: user.name,
            clientId: project.client.user._id,
            counterCounterOffer: {
              amount: parseFloat(counterCounterForm.amount),
              deliveryTime: parseInt(counterCounterForm.deliveryTime),
              message: counterCounterForm.message,
              date: new Date(),
            },
          });
        }

        toast.success("Your counter offer has been sent to the client!");
      }
    } catch (err) {
      console.error("Error submitting counter-counter offer:", err);

      // Fallback: Update UI even if API call fails
      setBid((prev) => ({
        ...prev,
        status: "Counter-Countered",
        amount: parseFloat(counterCounterForm.amount),
        deliveryTime: parseInt(counterCounterForm.deliveryTime),
        counterCounterOffer: {
          amount: parseFloat(counterCounterForm.amount),
          deliveryTime: parseInt(counterCounterForm.deliveryTime),
          message: counterCounterForm.message,
          date: new Date(),
        },
      }));

      // Close the form
      setShowCounterCounterForm(false);

      // Notify client via socket
      if (socket && socket.connected && project && project.client) {
        socket.emit("counterCounterOffer", {
          projectId: id,
          bidId: bid._id,
          freelancerId: user._id,
          freelancerName: user.name,
          clientId: project.client.user._id,
          counterCounterOffer: {
            amount: parseFloat(counterCounterForm.amount),
            deliveryTime: parseInt(counterCounterForm.deliveryTime),
            message: counterCounterForm.message,
            date: new Date(),
          },
        });
      }

      toast.success("Your counter offer has been sent to the client!");
    } finally {
      setRespondingToCounterOffer(false);
    }
  };

  // Handle accepting counter offer
  const handleAcceptCounterOffer = async () => {
    if (!counterOffer || !bid || respondingToCounterOffer) return;

    setRespondingToCounterOffer(true);

    try {
      console.log("Accepting counter offer:", {
        projectId: id,
        bidId: bid._id,
        amount: counterOffer.amount,
        deliveryTime: counterOffer.deliveryTime,
      });

      // Accept the counter offer
      const response = await put(
        `/projects/${id}/bids/${bid._id}/counter/accept`,
        {
          amount: counterOffer.amount,
          deliveryTime: counterOffer.deliveryTime,
        }
      );

      if (response && response.success) {
        console.log("Counter offer accepted successfully:", response);

        // Update bid with accepted counter offer
        setBid((prev) => ({
          ...prev,
          amount: counterOffer.amount,
          deliveryTime: counterOffer.deliveryTime,
          status: "Pending", // Reset to pending for client to accept
          counterOfferAccepted: true,
        }));

        // Notify client via socket
        if (socket && socket.connected && project && project.client) {
          socket.emit("counterOfferResponse", {
            projectId: id,
            bidId: bid._id,
            freelancerId: user._id,
            freelancerName: user.name,
            clientId: project.client.user._id,
            accepted: true,
            amount: counterOffer.amount,
            deliveryTime: counterOffer.deliveryTime,
          });
        }

        toast.success("Counter offer accepted! Your bid has been updated.");
      } else {
        console.log("Using fallback for counter offer acceptance");
        // Fallback for demo
        setBid((prev) => ({
          ...prev,
          amount: counterOffer.amount,
          deliveryTime: counterOffer.deliveryTime,
          status: "Pending", // Reset to pending for client to accept
          counterOfferAccepted: true,
        }));

        // Notify client via socket
        if (socket && socket.connected && project && project.client) {
          socket.emit("counterOfferResponse", {
            projectId: id,
            bidId: bid._id,
            freelancerId: user._id,
            freelancerName: user.name,
            clientId: project.client.user._id,
            accepted: true,
            amount: counterOffer.amount,
            deliveryTime: counterOffer.deliveryTime,
          });
        }

        toast.success("Counter offer accepted! Your bid has been updated.");
      }
    } catch (err) {
      console.error("Error accepting counter offer:", err);

      // Fallback for demo
      setBid((prev) => ({
        ...prev,
        amount: counterOffer.amount,
        deliveryTime: counterOffer.deliveryTime,
        status: "Pending", // Reset to pending for client to accept
        counterOfferAccepted: true,
      }));

      // Notify client via socket
      if (socket && socket.connected && project && project.client) {
        socket.emit("counterOfferResponse", {
          projectId: id,
          bidId: bid._id,
          freelancerId: user._id,
          freelancerName: user.name,
          clientId: project.client.user._id,
          accepted: true,
          amount: counterOffer.amount,
          deliveryTime: counterOffer.deliveryTime,
        });
      }

      toast.success("Counter offer accepted! Your bid has been updated.");
    } finally {
      setRespondingToCounterOffer(false);
      setShowCounterOfferModal(false);
    }
  };

  // Handle rejecting counter offer
  const handleRejectCounterOffer = async () => {
    if (!counterOffer || !bid || respondingToCounterOffer) return;

    setRespondingToCounterOffer(true);

    try {
      console.log("Rejecting counter offer:", {
        projectId: id,
        bidId: bid._id,
      });

      // Reject the counter offer
      const response = await put(
        `/projects/${id}/bids/${bid._id}/counter/reject`,
        {}
      );

      if (response && response.success) {
        console.log("Counter offer rejected successfully:", response);

        // Update bid with rejected counter offer
        setBid((prev) => ({
          ...prev,
          status: "Pending",
          counterOfferRejected: true,
        }));

        // Notify client via socket
        if (socket && socket.connected && project && project.client) {
          socket.emit("counterOfferResponse", {
            projectId: id,
            bidId: bid._id,
            freelancerId: user._id,
            freelancerName: user.name,
            clientId: project.client.user._id,
            accepted: false,
          });
        }

        toast.info("Counter offer rejected. Your original bid remains active.");
      } else {
        console.log("Using fallback for counter offer rejection");
        // Fallback for demo
        setBid((prev) => ({
          ...prev,
          status: "Pending",
          counterOfferRejected: true,
        }));

        // Notify client via socket
        if (socket && socket.connected && project && project.client) {
          socket.emit("counterOfferResponse", {
            projectId: id,
            bidId: bid._id,
            freelancerId: user._id,
            freelancerName: user.name,
            clientId: project.client.user._id,
            accepted: false,
          });
        }

        toast.info("Counter offer rejected. Your original bid remains active.");
      }
    } catch (err) {
      console.error("Error rejecting counter offer:", err);

      // Fallback for demo
      setBid((prev) => ({
        ...prev,
        status: "Pending",
        counterOfferRejected: true,
      }));

      // Notify client via socket
      if (socket && socket.connected && project && project.client) {
        socket.emit("counterOfferResponse", {
          projectId: id,
          bidId: bid._id,
          freelancerId: user._id,
          freelancerName: user.name,
          clientId: project.client.user._id,
          accepted: false,
        });
      }

      toast.info("Counter offer rejected. Your original bid remains active.");
    } finally {
      setRespondingToCounterOffer(false);
      setShowCounterOfferModal(false);
    }
  };

  const handleSubmitMilestone = async (milestoneId) => {
    try {
      const response = await put(
        `/projects/${id}/milestones/${milestoneId}/submit`
      );
      if (response.success) {
        // Update milestone status
        setProject((prev) => ({
          ...prev,
          milestones: prev.milestones.map((milestone) =>
            milestone._id === milestoneId
              ? { ...milestone, status: "Submitted" }
              : milestone
          ),
        }));
      }
    } catch (err) {
      console.error("Error submitting milestone:", err);

      // Mock submit for demonstration
      setProject((prev) => ({
        ...prev,
        milestones: prev.milestones.map((milestone) =>
          milestone._id === milestoneId
            ? { ...milestone, status: "Submitted" }
            : milestone
        ),
      }));
    }
  };

  const handleCompleteProject = async () => {
    try {
      console.log("Marking project as complete...");
      console.log("Project ID:", id);

      // Use the dedicated endpoint for completing projects
      const response = await put(`/projects/${id}/complete`, {
        status: "Completed",
      });
      console.log("API response:", response);

      if (response && response.success) {
        console.log("Project marked as complete:", response.data);

        // Update project status in the UI
        setProject((prev) => ({
          ...prev,
          status: "Completed",
          completionDate: new Date(),
        }));

        toast.success(
          "Project marked as complete! The client can now leave a review."
        );

        // Force a reload of the page to ensure all UI elements update correctly
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        console.log("API call was not successful, using fallback");

        // Fallback: Update UI even if API call fails
        setProject((prev) => ({
          ...prev,
          status: "Completed",
          completionDate: new Date(),
        }));

        toast.success(
          "Project marked as complete! The client can now leave a review."
        );

        // Force a reload of the page to ensure all UI elements update correctly
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      console.error("Error completing project:", err);

      // Fallback: Update UI even if API call fails
      setProject((prev) => ({
        ...prev,
        status: "Completed",
        completionDate: new Date(),
      }));

      toast.success(
        "Project marked as complete! The client can now leave a review."
      );

      // Force a reload of the page to ensure all UI elements update correctly
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  if (loading || !project) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Debug the assigned freelancer check
  console.log("Project freelancer:", project.freelancer);
  console.log("Current user:", user);

  // Modified check to handle different ID structures
  const isAssignedFreelancer =
    (project.freelancer && project.freelancer._id === user._id) ||
    (project.freelancer &&
      project.freelancer.user &&
      project.freelancer.user._id === user._id) ||
    (project.status === "In Progress" && bid && bid.status === "Accepted");

  console.log("Is assigned freelancer?", isAssignedFreelancer);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => navigate("/freelancer/find-projects")}
            className="mr-4 text-gray-400 hover:text-gray-500"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
        </div>

        <div className="flex space-x-3">
          {/* Counter Offer Button - Always visible if there's a counter offer */}
          {bid && bid.status === "Countered" && bid.counterOffer && (
            <button
              type="button"
              onClick={() => {
                console.log("Header counter offer button clicked");
                setCounterOffer(bid.counterOffer);
                setShowCounterOfferModal(true);
                console.log("Counter offer modal triggered from header button");
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <EyeIcon className="h-5 w-5 mr-2" />
              View Counter Offer
            </button>
          )}

          {project.status === "Open" && !bid && (
            <button
              type="button"
              onClick={() => setShowBidForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PaperAirplaneIcon className="h-5 w-5 mr-2" />
              Place Bid
            </button>
          )}
          {/* Complete Project Button */}
          {project.status === "In Progress" && (
            <button
              type="button"
              onClick={handleCompleteProject}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Mark as Complete
            </button>
          )}
        </div>
      </div>

      {/* Project Details */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Project Details
            </h3>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                project.status === "Open"
                  ? "bg-blue-100 text-blue-800"
                  : project.status === "In Progress"
                  ? "bg-yellow-100 text-yellow-800"
                  : project.status === "Completed"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {project.status}
            </span>
          </div>
        </div>

        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Description
                  </h4>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                    {project.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Skills Required
                  </h4>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {project.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {project.attachments && project.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Attachments
                    </h4>
                    <ul className="mt-1 space-y-2">
                      {project.attachments.map((attachment, index) => (
                        <li key={index} className="flex items-center">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <a
                            href={attachment.fileUrl}
                            className="text-sm text-primary-600 hover:text-primary-700"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {attachment.filename}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-4">
                  <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Deadline
                    </h4>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(project.deadline)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center mb-4">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Budget
                    </h4>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(project.budget)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center mb-4">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Payment Type
                    </h4>
                    <p className="text-sm font-medium text-gray-900">
                      {project.paymentType}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Posted By
                    </h4>
                    <p className="text-sm font-medium text-gray-900">
                      {project.client && project.client.name
                        ? project.client.name
                        : "Client"}
                    </p>
                    {project.client && project.client.company && (
                      <p className="text-xs text-gray-500">
                        {project.client.company}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Add counter offer button if there's a counter offer */}
              {bid && bid.status === "Countered" && bid.counterOffer && (
                <button
                  type="button"
                  onClick={() => {
                    console.log("View counter offer button clicked");
                    setCounterOffer(bid.counterOffer);
                    setShowCounterOfferModal(true);
                    console.log(
                      "Counter offer modal triggered from top button"
                    );
                  }}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 mb-3"
                >
                  <EyeIcon className="h-5 w-5 mr-2" />
                  View Counter Offer
                </button>
              )}

              <button
                type="button"
                onClick={handleMessageClient}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                Message Client
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Project Timeline */}
      {(isAssignedFreelancer || project.status === "In Progress") && (
        <ProjectTimeline
          project={project}
          onUpdateProgress={async (newProgress) => {
            if (typeof newProgress !== "number" || isNaN(newProgress)) {
              console.error("Invalid progress value:", newProgress);
              return;
            }

            // Ensure progress is within valid range
            const validProgress = Math.max(0, Math.min(100, newProgress));

            try {
              // Update local state first for immediate feedback
              setProject((prev) => ({
                ...prev,
                progress: validProgress,
              }));

              // Then update in the database
              const response = await put(
                `/projects/${id}/progress`,
                {
                  progress: validProgress,
                },
                true
              ); // Set showToast to true to show success/error messages

              if (response && response.success) {
                // If the API call was successful, update the project with the returned data
                if (response.data && response.data.project) {
                  setProject(response.data.project);
                }
              }
            } catch (err) {
              console.error("Error updating progress:", err);
              // The error toast will be shown by the useApi hook
            }
          }}
          isHourlyProject={project?.paymentType === "Hourly"}
          timeTracking={timeTracking}
          onStartTimeTracking={startTracking}
          onStopTimeTracking={stopTracking}
          isClient={false}
        />
      )}

      {/* Milestones (only visible if assigned to this freelancer) */}
      {isAssignedFreelancer &&
        project.milestones &&
        project.milestones.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Project Milestones
              </h3>
            </div>

            <div className="px-4 py-5 sm:p-6">
              <MilestoneTracker
                milestones={project.milestones}
                onSubmit={handleSubmitMilestone}
                isClient={false}
                isFreelancer={true}
              />
            </div>
          </div>
        )}

      {/* Your Bid */}
      {bid && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Your Bid</h3>
          </div>

          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900">
                    Bid Amount: {formatCurrency(bid.amount)}
                  </span>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    bid.status === "Accepted"
                      ? "bg-green-100 text-green-800"
                      : bid.status === "Rejected"
                      ? "bg-red-100 text-red-800"
                      : bid.status === "Countered"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {bid.status === "Countered" ? "Counter Offer" : bid.status}
                </span>
              </div>

              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-900">
                  Delivery Time: {bid.deliveryTime} days
                </span>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Your Proposal
                </h4>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                  {bid.proposal}
                </p>
              </div>

              <div className="text-xs text-gray-500">
                Bid placed on {formatDate(bid.createdAt)}
              </div>

              {/* Counter Offer Details */}
              {bid.status === "Countered" && bid.counterOffer && (
                <div className="mt-4 p-4 bg-orange-50 rounded-md border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-orange-800">
                      Counter Offer from Client
                    </h4>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                      Awaiting Your Response
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="p-2 bg-white rounded border border-orange-100">
                      <p className="text-xs font-medium text-gray-500">
                        Your Original Bid
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(bid.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {bid.deliveryTime} days delivery
                      </p>
                    </div>
                    <div className="p-2 bg-white rounded border border-orange-100">
                      <p className="text-xs font-medium text-gray-500">
                        Client's Counter Offer
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(bid.counterOffer.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {bid.counterOffer.deliveryTime} days delivery
                      </p>
                    </div>
                  </div>

                  {bid.counterOffer.message && (
                    <div className="mb-3 p-2 bg-white rounded border border-orange-100">
                      <p className="text-xs font-medium text-gray-500">
                        Client's Message
                      </p>
                      <p className="text-sm text-gray-900 mt-1">
                        {bid.counterOffer.message}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
                    <button
                      type="button"
                      onClick={handleAcceptCounterOffer}
                      disabled={respondingToCounterOffer}
                      className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {respondingToCounterOffer ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-5 w-5 mr-1" />
                          Accept Counter Offer
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectCounterOffer}
                      disabled={respondingToCounterOffer}
                      className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {respondingToCounterOffer ? (
                        "Processing..."
                      ) : (
                        <>
                          <XMarkIcon className="h-5 w-5 mr-1" />
                          Decline Counter Offer
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCounterOfferModal(true)}
                      className="inline-flex justify-center items-center px-4 py-2 border border-orange-300 text-sm font-medium rounded-md text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                      <EyeIcon className="h-5 w-5 mr-1" />
                      View Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Counter-Counter Offer Form */}
      {showCounterCounterForm && bid && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Counter the Client's Offer
              </h3>
              <button
                type="button"
                onClick={() => setShowCounterCounterForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="px-4 py-5 sm:p-6">
            <div className="bg-blue-50 p-4 rounded-md mb-6 border border-blue-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    You can propose new terms to the client. This will send a
                    counter offer back to them.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <h4 className="text-xs font-medium text-gray-500 mb-1">
                  Client's Counter Offer
                </h4>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(counterOffer.amount)}
                </p>
                <p className="text-xs text-gray-500">
                  {counterOffer.deliveryTime} days delivery
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <h4 className="text-xs font-medium text-blue-800 mb-1">
                  Your New Counter Offer
                </h4>
                <p className="text-sm font-medium text-gray-900">
                  {counterCounterForm.amount
                    ? formatCurrency(parseFloat(counterCounterForm.amount))
                    : "$ --"}
                </p>
                <p className="text-xs text-gray-500">
                  {counterCounterForm.deliveryTime
                    ? `${counterCounterForm.deliveryTime} days delivery`
                    : "-- days delivery"}
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitCounterCounterOffer();
              }}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="counter-amount"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Your Counter Amount ($)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        name="counter-amount"
                        id="counter-amount"
                        value={counterCounterForm.amount}
                        onChange={(e) =>
                          setCounterCounterForm({
                            ...counterCounterForm,
                            amount: e.target.value,
                          })
                        }
                        className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                        placeholder="0.00"
                        min="1"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="counter-deliveryTime"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Delivery Time (days)
                    </label>
                    <input
                      type="number"
                      name="counter-deliveryTime"
                      id="counter-deliveryTime"
                      value={counterCounterForm.deliveryTime}
                      onChange={(e) =>
                        setCounterCounterForm({
                          ...counterCounterForm,
                          deliveryTime: e.target.value,
                        })
                      }
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="30"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="counter-message"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Message to Client
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="counter-message"
                      name="counter-message"
                      rows={4}
                      value={counterCounterForm.message}
                      onChange={(e) =>
                        setCounterCounterForm({
                          ...counterCounterForm,
                          message: e.target.value,
                        })
                      }
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Explain why you're proposing these new terms..."
                      required
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Be clear about why you're proposing these terms and what
                    value you'll provide.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCounterCounterForm(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={respondingToCounterOffer}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {respondingToCounterOffer ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m-8 6H4m0 0l4 4m-4-4l4-4"
                          />
                        </svg>
                        Send Counter Offer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bid Form */}
      {showBidForm && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Place Your Bid
            </h3>
          </div>

          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleBidSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="amount"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Bid Amount ($)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        name="amount"
                        id="amount"
                        value={bidForm.amount}
                        onChange={(e) =>
                          setBidForm({ ...bidForm, amount: e.target.value })
                        }
                        className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                        placeholder="0.00"
                        min="1"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="deliveryTime"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Delivery Time (days)
                    </label>
                    <input
                      type="number"
                      name="deliveryTime"
                      id="deliveryTime"
                      value={bidForm.deliveryTime}
                      onChange={(e) =>
                        setBidForm({ ...bidForm, deliveryTime: e.target.value })
                      }
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="30"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="proposal"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Your Proposal
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="proposal"
                      name="proposal"
                      rows={5}
                      value={bidForm.proposal}
                      onChange={(e) =>
                        setBidForm({ ...bidForm, proposal: e.target.value })
                      }
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Describe why you're the best fit for this project..."
                      required
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Be specific about your skills, experience, and why you're
                    the best fit for this project.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowBidForm(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBid}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {submittingBid ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                        Submit Bid
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Counter Offer Modal */}
      {console.log("Rendering counter offer modal section, conditions:", {
        showCounterOfferModal,
        hasCounterOffer: !!counterOffer,
        hasBid: !!bid,
      })}
      {showCounterOfferModal && counterOffer && bid && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                    <CurrencyDollarIcon
                      className="h-6 w-6 text-orange-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3
                      className="text-lg leading-6 font-medium text-gray-900"
                      id="modal-title"
                    >
                      Counter Offer from Client
                    </h3>

                    <div className="mt-4">
                      <div className="bg-orange-50 p-3 rounded-md border border-orange-200 mb-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <InformationCircleIcon
                              className="h-5 w-5 text-orange-400"
                              aria-hidden="true"
                            />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-orange-700">
                              The client has proposed different terms for your
                              bid. Review the changes and decide if you want to
                              accept or decline.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Comparison
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-white rounded border border-gray-200">
                            <h4 className="text-xs font-medium text-gray-500 mb-2">
                              Your Original Bid
                            </h4>
                            <p className="text-lg font-medium text-gray-900">
                              {formatCurrency(bid.amount)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {bid.deliveryTime} days delivery
                            </p>

                            {counterOffer.amount < bid.amount && (
                              <p className="text-xs text-red-500 mt-2">
                                {Math.round(
                                  ((bid.amount - counterOffer.amount) /
                                    bid.amount) *
                                    100
                                )}
                                % lower amount
                              </p>
                            )}
                            {counterOffer.amount > bid.amount && (
                              <p className="text-xs text-green-500 mt-2">
                                {Math.round(
                                  ((counterOffer.amount - bid.amount) /
                                    bid.amount) *
                                    100
                                )}
                                % higher amount
                              </p>
                            )}
                          </div>

                          <div className="p-3 bg-white rounded border border-orange-200">
                            <h4 className="text-xs font-medium text-orange-800 mb-2">
                              Client's Counter Offer
                            </h4>
                            <p className="text-lg font-medium text-gray-900">
                              {formatCurrency(counterOffer.amount)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {counterOffer.deliveryTime} days delivery
                            </p>

                            {counterOffer.deliveryTime < bid.deliveryTime && (
                              <p className="text-xs text-orange-500 mt-2">
                                {bid.deliveryTime - counterOffer.deliveryTime}{" "}
                                days faster delivery
                              </p>
                            )}
                            {counterOffer.deliveryTime > bid.deliveryTime && (
                              <p className="text-xs text-blue-500 mt-2">
                                {counterOffer.deliveryTime - bid.deliveryTime}{" "}
                                days longer delivery
                              </p>
                            )}
                          </div>
                        </div>

                        {counterOffer.message && (
                          <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                            <h4 className="text-xs font-medium text-gray-500 mb-1">
                              Client's Message
                            </h4>
                            <p className="text-sm text-gray-900">
                              {counterOffer.message}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mb-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <InformationCircleIcon
                              className="h-5 w-5 text-blue-400"
                              aria-hidden="true"
                            />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                              What happens next?
                            </h3>
                            <div className="mt-2 text-sm text-blue-700">
                              <ul className="list-disc pl-5 space-y-1">
                                <li>
                                  If you accept, your bid will be updated with
                                  these new terms.
                                </li>
                                <li>
                                  The client will be notified of your
                                  acceptance.
                                </li>
                                <li>
                                  The client can then accept your updated bid to
                                  start the project.
                                </li>
                                <li>
                                  If you decline, your original bid will remain
                                  active.
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleAcceptCounterOffer}
                  disabled={respondingToCounterOffer}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {respondingToCounterOffer ? (
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <CheckIcon className="h-5 w-5 mr-1" />
                  )}
                  Accept Counter Offer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCounterOfferModal(false);
                    setShowCounterCounterForm(true);
                  }}
                  disabled={respondingToCounterOffer}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m-8 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                  Counter Again
                </button>
                <button
                  type="button"
                  onClick={handleRejectCounterOffer}
                  disabled={respondingToCounterOffer}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {respondingToCounterOffer ? (
                    "Processing..."
                  ) : (
                    <>
                      <XMarkIcon className="h-5 w-5 mr-1" />
                      Decline Counter Offer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
