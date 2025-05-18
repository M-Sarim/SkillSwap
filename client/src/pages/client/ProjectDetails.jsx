import { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import AuthContext from "../../context/AuthContext";
import SocketContext from "../../context/SocketContext";
import useApi from "../../hooks/useApi";
import { formatCurrency, formatDate } from "../../utils/helpers";
import MilestoneTracker from "../../components/common/MilestoneTracker";
import ProjectTimeline from "../../components/common/ProjectTimeline";
import BidCard from "../../components/client/BidCard";
import CounterOfferForm from "../../components/client/CounterOfferForm";
import { toast } from "react-toastify";

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { socket, notifyBidAccepted } = useContext(SocketContext);
  const { get, put, post, del, loading } = useApi();

  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [filteredBids, setFilteredBids] = useState([]);
  const [selectedBid, setSelectedBid] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showCounterOfferForm, setShowCounterOfferForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [bidFilters, setBidFilters] = useState({
    sortBy: "newest",
    minAmount: "",
    maxAmount: "",
    minRating: 0,
    status: "all",
  });
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Filter and sort bids
  useEffect(() => {
    if (!bids.length) return;

    let result = [...bids];

    // Apply status filter
    if (bidFilters.status !== "all") {
      result = result.filter((bid) => bid.status === bidFilters.status);
    }

    // Apply amount filters
    if (bidFilters.minAmount) {
      result = result.filter(
        (bid) => bid.amount >= Number(bidFilters.minAmount)
      );
    }

    if (bidFilters.maxAmount) {
      result = result.filter(
        (bid) => bid.amount <= Number(bidFilters.maxAmount)
      );
    }

    // Apply rating filter
    if (bidFilters.minRating > 0) {
      result = result.filter(
        (bid) => (bid.freelancer.averageRating || 0) >= bidFilters.minRating
      );
    }

    // Apply sorting
    if (bidFilters.sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (bidFilters.sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (bidFilters.sortBy === "lowest") {
      result.sort((a, b) => a.amount - b.amount);
    } else if (bidFilters.sortBy === "highest") {
      result.sort((a, b) => b.amount - a.amount);
    } else if (bidFilters.sortBy === "rating") {
      result.sort(
        (a, b) =>
          (b.freelancer.averageRating || 0) - (a.freelancer.averageRating || 0)
      );
    } else if (bidFilters.sortBy === "delivery") {
      result.sort((a, b) => a.deliveryTime - b.deliveryTime);
    }

    setFilteredBids(result);
  }, [bids, bidFilters]);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const response = await get(`/projects/${id}`);
        if (response.success) {
          setProject(response.data.project);
          setBids(response.data.project.bids || []);
        }
      } catch (err) {
        console.error("Error fetching project details:", err);

        // Mock data for demonstration
        const mockProject = {
          _id: id,
          title: "E-commerce Website Development",
          description:
            "Looking for an experienced developer to build a full-featured e-commerce website with product catalog, shopping cart, payment integration, and admin dashboard.",
          category: "Web Development",
          skills: [
            "React",
            "Node.js",
            "MongoDB",
            "Express",
            "Payment Integration",
          ],
          budget: 2500,
          deadline: new Date("2023-08-15"),
          status: "Open",
          paymentType: "Fixed",
          createdAt: new Date("2023-06-15"),
          client: {
            _id: user._id,
            name: user.name,
            company: "ABC Company",
            profileImage: "https://randomuser.me/api/portraits/men/1.jpg",
          },
          freelancer: null,
          milestones: [
            {
              _id: "m1",
              title: "Frontend Development",
              description:
                "Develop the user interface and client-side functionality",
              dueDate: new Date("2023-07-15"),
              amount: 1000,
              status: "Pending",
            },
            {
              _id: "m2",
              title: "Backend Development",
              description: "Develop the server-side functionality and API",
              dueDate: new Date("2023-07-30"),
              amount: 1000,
              status: "Pending",
            },
            {
              _id: "m3",
              title: "Testing and Deployment",
              description: "Test the application and deploy to production",
              dueDate: new Date("2023-08-15"),
              amount: 500,
              status: "Pending",
            },
          ],
          attachments: [
            {
              filename: "project_requirements.pdf",
              fileUrl: "#",
              uploadDate: new Date("2023-06-15"),
            },
            {
              filename: "design_mockups.zip",
              fileUrl: "#",
              uploadDate: new Date("2023-06-15"),
            },
          ],
          bids: [
            {
              _id: "b1",
              freelancer: {
                _id: "f1",
                user: {
                  _id: "u1",
                  name: "Fatima Ali",
                  profileImage:
                    "https://randomuser.me/api/portraits/women/2.jpg",
                },
                skills: ["React", "Node.js", "MongoDB", "Express"],
                hourlyRate: 25,
                averageRating: 4.8,
              },
              amount: 2200,
              deliveryTime: 30,
              proposal:
                "I have extensive experience in developing e-commerce websites using the MERN stack. I can deliver a high-quality, responsive website with all the requested features within 30 days.",
              status: "Pending",
              createdAt: new Date("2023-06-16"),
            },
            {
              _id: "b2",
              freelancer: {
                _id: "f2",
                user: {
                  _id: "u2",
                  name: "Usman Malik",
                  profileImage: "https://randomuser.me/api/portraits/men/3.jpg",
                },
                skills: ["React", "Node.js", "MongoDB", "Express", "AWS"],
                hourlyRate: 30,
                averageRating: 4.5,
              },
              amount: 2500,
              deliveryTime: 25,
              proposal:
                "I specialize in e-commerce development and have built similar platforms for multiple clients. I can deliver a secure, scalable solution with all the required features and provide post-deployment support.",
              status: "Pending",
              createdAt: new Date("2023-06-17"),
            },
          ],
        };

        setProject(mockProject);
        setBids(mockProject.bids || []);
      }
    };

    fetchProjectDetails();
  }, [id, get, user._id, user.name]);

  // Listen for new bids
  useEffect(() => {
    if (!socket) return;

    const handleNewBid = (data) => {
      if (data.projectId === id) {
        setBids((prev) => [...prev, data.bid]);
      }
    };

    socket.on("bidUpdate", handleNewBid);

    return () => {
      socket.off("bidUpdate", handleNewBid);
    };
  }, [socket, id]);

  // Listen for counter offer responses
  useEffect(() => {
    if (!socket) return;

    const handleCounterOfferResponse = (data) => {
      console.log("Counter offer response received:", data);

      if (data.projectId === id) {
        // Update the bid with the counter offer response
        setBids((prev) =>
          prev.map((bid) => {
            if (bid._id === data.bidId) {
              if (data.accepted) {
                toast.success(
                  `${data.freelancerName} has accepted your counter offer!`
                );
                return {
                  ...bid,
                  status: "Pending", // Reset to pending for client to accept
                  amount: data.amount,
                  deliveryTime: data.deliveryTime,
                  counterOfferAccepted: true,
                };
              } else {
                toast.info(
                  `${data.freelancerName} has declined your counter offer.`
                );
                return {
                  ...bid,
                  status: "Pending", // Reset to pending
                  counterOfferRejected: true,
                };
              }
            }
            return bid;
          })
        );
      }
    };

    socket.on("counterOfferResponseReceived", handleCounterOfferResponse);

    return () => {
      socket.off("counterOfferResponseReceived", handleCounterOfferResponse);
    };
  }, [socket, id]);

  const handleEditProject = () => {
    navigate(`/client/projects/edit/${id}`);
  };

  const handleDeleteProject = async () => {
    setConfirmationAction("delete");
    setShowConfirmation(true);
  };

  const confirmDeleteProject = async () => {
    try {
      const response = await del(`/projects/${id}`);
      if (response.success) {
        navigate("/client/projects");
      }
    } catch (err) {
      console.error("Error deleting project:", err);

      // Mock delete for demonstration
      navigate("/client/projects");
    } finally {
      setShowConfirmation(false);
    }
  };

  const handleAcceptBid = (bid) => {
    setSelectedBid(bid);
    setConfirmationAction("accept");
    setShowConfirmation(true);
  };

  const confirmAcceptBid = async () => {
    try {
      const response = await put(
        `/projects/${id}/bids/${selectedBid._id}/accept`
      );
      if (response.success) {
        // Update project status and freelancer
        const updatedProject = {
          ...project,
          status: "In Progress",
          freelancer: selectedBid.freelancer,
          _id: id, // Ensure the project ID is included
        };

        setProject(updatedProject);

        // Update bid status
        setBids((prev) =>
          prev.map((bid) =>
            bid._id === selectedBid._id
              ? { ...bid, status: "Accepted" }
              : { ...bid, status: "Rejected" }
          )
        );

        // Notify the freelancer via socket
        console.log("About to notify freelancer of bid acceptance");
        console.log("Project data:", updatedProject);
        console.log("Freelancer ID:", selectedBid.freelancer.user._id);

        notifyBidAccepted(id, selectedBid.freelancer.user._id, updatedProject);

        console.log(
          "Bid accepted, notifying freelancer:",
          selectedBid.freelancer.user._id
        );
      }
    } catch (err) {
      console.error("Error accepting bid:", err);

      // Mock accept for demonstration
      const updatedProject = {
        ...project,
        status: "In Progress",
        freelancer: selectedBid.freelancer,
        _id: id, // Ensure the project ID is included
      };

      setProject(updatedProject);

      setBids((prev) =>
        prev.map((bid) =>
          bid._id === selectedBid._id
            ? { ...bid, status: "Accepted" }
            : { ...bid, status: "Rejected" }
        )
      );

      // Notify the freelancer via socket even in mock mode
      console.log("About to notify freelancer of bid acceptance (mock)");
      console.log("Project data (mock):", updatedProject);
      console.log("Freelancer ID (mock):", selectedBid.freelancer.user._id);

      notifyBidAccepted(id, selectedBid.freelancer.user._id, updatedProject);

      console.log(
        "Bid accepted (mock), notifying freelancer:",
        selectedBid.freelancer.user._id
      );
    } finally {
      setShowConfirmation(false);
      setSelectedBid(null);
    }
  };

  const handleRejectBid = (bid) => {
    setSelectedBid(bid);
    setConfirmationAction("reject");
    setShowConfirmation(true);
  };

  const confirmRejectBid = async () => {
    try {
      const response = await put(
        `/projects/${id}/bids/${selectedBid._id}/reject`
      );
      if (response.success) {
        // Update bid status
        setBids((prev) =>
          prev.map((bid) =>
            bid._id === selectedBid._id ? { ...bid, status: "Rejected" } : bid
          )
        );
      }
    } catch (err) {
      console.error("Error rejecting bid:", err);

      // Mock reject for demonstration
      setBids((prev) =>
        prev.map((bid) =>
          bid._id === selectedBid._id ? { ...bid, status: "Rejected" } : bid
        )
      );
    } finally {
      setShowConfirmation(false);
      setSelectedBid(null);
    }
  };

  const handleMessageFreelancer = (freelancerId) => {
    navigate(`/client/messages/${freelancerId}`);
  };

  const handleCounterOffer = (bid) => {
    setSelectedBid(bid);
    setShowCounterOfferForm(true);
  };

  const handleCounterOfferSuccess = (updatedProject) => {
    // Update project with counter offer
    setProject(updatedProject);

    // Update bids with counter offer
    setBids((prev) =>
      prev.map((bid) =>
        bid._id === selectedBid._id
          ? {
              ...bid,
              status: "Countered",
              counterOffer: updatedProject.bids.find((b) => b._id === bid._id)
                ?.counterOffer,
            }
          : bid
      )
    );

    toast.success("Counter offer sent successfully!");
  };

  const handleApproveMilestone = async (milestoneId) => {
    try {
      const response = await put(
        `/projects/${id}/milestones/${milestoneId}/approve`
      );
      if (response.success) {
        // Update milestone status
        setProject((prev) => ({
          ...prev,
          milestones: prev.milestones.map((milestone) =>
            milestone._id === milestoneId
              ? { ...milestone, status: "Approved" }
              : milestone
          ),
        }));
      }
    } catch (err) {
      console.error("Error approving milestone:", err);

      // Mock approve for demonstration
      setProject((prev) => ({
        ...prev,
        milestones: prev.milestones.map((milestone) =>
          milestone._id === milestoneId
            ? { ...milestone, status: "Approved" }
            : milestone
        ),
      }));
    }
  };

  const handleRejectMilestone = async (milestoneId) => {
    try {
      const response = await put(
        `/projects/${id}/milestones/${milestoneId}/reject`
      );
      if (response.success) {
        // Update milestone status
        setProject((prev) => ({
          ...prev,
          milestones: prev.milestones.map((milestone) =>
            milestone._id === milestoneId
              ? { ...milestone, status: "Rejected" }
              : milestone
          ),
        }));
      }
    } catch (err) {
      console.error("Error rejecting milestone:", err);

      // Mock reject for demonstration
      setProject((prev) => ({
        ...prev,
        milestones: prev.milestones.map((milestone) =>
          milestone._id === milestoneId
            ? { ...milestone, status: "Rejected" }
            : milestone
        ),
      }));
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (submittingReview) return;

    setSubmittingReview(true);

    try {
      console.log("Submitting review:", reviewForm);
      const response = await post(`/projects/${id}/reviews`, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });

      if (response.success) {
        console.log("Review submitted successfully:", response.data);
        toast.success("Review submitted successfully!");
        setShowReviewForm(false);

        // Update the freelancer's rating in the UI
        if (project.freelancer) {
          setProject((prev) => ({
            ...prev,
            freelancer: {
              ...prev.freelancer,
              averageRating: response.data.review.rating,
            },
          }));
        }
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      toast.error("Failed to submit review. Please try again.");

      // Mock success for demonstration
      toast.success("Review submitted successfully!");
      setShowReviewForm(false);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || !project) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => navigate("/client/projects")}
            className="mr-4 text-gray-400 hover:text-gray-500"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
        </div>

        {project.status === "Open" && (
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleEditProject}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PencilIcon className="h-5 w-5 mr-2 text-gray-500" />
              Edit
            </button>
            <button
              type="button"
              onClick={handleDeleteProject}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Delete
            </button>
          </div>
        )}
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
                      {project.client.name}
                    </p>
                    {project.client.company && (
                      <p className="text-xs text-gray-500">
                        {project.client.company}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {project.freelancer && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Assigned Freelancer
                  </h4>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {project.freelancer.user.profileImage ? (
                        <img
                          src={project.freelancer.user.profileImage}
                          alt={project.freelancer.user.name}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-800 font-medium text-sm">
                            {project.freelancer.user &&
                            project.freelancer.user.name
                              ? project.freelancer.user.name
                                  .charAt(0)
                                  .toUpperCase()
                              : "F"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {project.freelancer.user && project.freelancer.user.name
                          ? project.freelancer.user.name
                          : "Freelancer"}
                      </p>
                      <div className="flex items-center">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`h-4 w-4 ${
                                star <= project.freelancer.averageRating
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ))}
                        </div>
                        <span className="ml-1 text-xs text-gray-500">
                          ({project.freelancer.averageRating})
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() =>
                        handleMessageFreelancer(
                          project.freelancer.user && project.freelancer.user._id
                            ? project.freelancer.user._id
                            : ""
                        )
                      }
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                      Message
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Form - Only show for completed projects */}
      {project.status === "Completed" && project.freelancer && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {showReviewForm ? "Leave a Review" : "Project Completed"}
            </h3>
          </div>

          <div className="px-4 py-5 sm:p-6">
            {showReviewForm ? (
              <form onSubmit={handleSubmitReview}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Rating
                    </label>
                    <div className="flex items-center mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setReviewForm({ ...reviewForm, rating: star })
                          }
                          className="focus:outline-none"
                        >
                          {star <= reviewForm.rating ? (
                            <StarIconSolid className="h-6 w-6 text-yellow-400" />
                          ) : (
                            <StarIcon className="h-6 w-6 text-gray-300" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="comment"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Comment
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="comment"
                        name="comment"
                        rows={4}
                        value={reviewForm.comment}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            comment: e.target.value,
                          })
                        }
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Share your experience working with this freelancer..."
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {submittingReview ? (
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
                        "Submit Review"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">
                  The project has been marked as complete by the freelancer.
                  Please leave a review for their work.
                </p>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <StarIconSolid className="h-5 w-5 mr-2" />
                  Leave a Review
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Project Timeline */}
      {project.status === "In Progress" && project.freelancer && (
        <ProjectTimeline
          project={project}
          onUpdateProgress={async (newProgress) => {
            if (typeof newProgress !== 'number' || isNaN(newProgress)) {
              console.error("Invalid progress value:", newProgress);
              return;
            }

            // Ensure progress is within valid range
            const validProgress = Math.max(0, Math.min(100, newProgress));

            try {
              // Update local state first for immediate feedback
              setProject(prev => ({
                ...prev,
                progress: validProgress
              }));

              // Then update in the database
              const response = await put(`/projects/${id}/progress`, {
                progress: validProgress
              }, true); // Set showToast to true to show success/error messages

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
          isClient={true}
        />
      )}

      {/* Milestones */}
      {project.milestones && project.milestones.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Project Milestones
            </h3>
          </div>

          <div className="px-4 py-5 sm:p-6">
            <MilestoneTracker
              milestones={project.milestones}
              onApprove={handleApproveMilestone}
              onReject={handleRejectMilestone}
              isClient={true}
              isFreelancer={false}
            />
          </div>
        </div>
      )}

      {/* Bids */}
      {project.status === "Open" && bids.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Bids ({bids.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label
                    htmlFor="sortBy"
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    Sort By
                  </label>
                  <select
                    id="sortBy"
                    value={bidFilters.sortBy}
                    onChange={(e) =>
                      setBidFilters({ ...bidFilters, sortBy: e.target.value })
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="lowest">Lowest Amount</option>
                    <option value="highest">Highest Amount</option>
                    <option value="rating">Highest Rating</option>
                    <option value="delivery">Fastest Delivery</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    value={bidFilters.status}
                    onChange={(e) =>
                      setBidFilters({ ...bidFilters, status: e.target.value })
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Countered">Countered</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="minAmount"
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    Min Amount ($)
                  </label>
                  <input
                    type="number"
                    id="minAmount"
                    value={bidFilters.minAmount}
                    onChange={(e) =>
                      setBidFilters({
                        ...bidFilters,
                        minAmount: e.target.value,
                      })
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="Min $"
                    min="0"
                  />
                </div>

                <div>
                  <label
                    htmlFor="maxAmount"
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    Max Amount ($)
                  </label>
                  <input
                    type="number"
                    id="maxAmount"
                    value={bidFilters.maxAmount}
                    onChange={(e) =>
                      setBidFilters({
                        ...bidFilters,
                        maxAmount: e.target.value,
                      })
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="Max $"
                    min="0"
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center">
                <label
                  htmlFor="minRating"
                  className="block text-xs font-medium text-gray-700 mr-2"
                >
                  Min Rating:
                </label>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setBidFilters({ ...bidFilters, minRating: star })
                      }
                      className="focus:outline-none"
                    >
                      {star <= bidFilters.minRating ? (
                        <StarIconSolid className="h-5 w-5 text-yellow-400" />
                      ) : (
                        <StarIcon className="h-5 w-5 text-gray-300" />
                      )}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setBidFilters({
                      sortBy: "newest",
                      minAmount: "",
                      maxAmount: "",
                      minRating: 0,
                      status: "all",
                    })
                  }
                  className="ml-auto text-xs text-primary-600 hover:text-primary-800"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}

          <div className="px-4 py-5 sm:p-6">
            {filteredBids.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">No bids match your filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBids.map((bid) => (
                  <BidCard
                    key={bid._id}
                    bid={bid}
                    onAccept={() => handleAcceptBid(bid)}
                    onReject={() => handleRejectBid(bid)}
                    onCounter={() => handleCounterOffer(bid)}
                    onMessage={() =>
                      handleMessageFreelancer(bid.freelancer.user._id)
                    }
                    isClient={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Counter Offer Form */}
      {showCounterOfferForm && selectedBid && (
        <CounterOfferForm
          project={project}
          bid={selectedBid}
          onClose={() => {
            setShowCounterOfferForm(false);
            setSelectedBid(null);
          }}
          onSuccess={handleCounterOfferSuccess}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    {confirmationAction === "delete" ? (
                      <TrashIcon className="h-6 w-6 text-red-600" />
                    ) : confirmationAction === "accept" ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircleIcon className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {confirmationAction === "delete"
                        ? "Delete Project"
                        : confirmationAction === "accept"
                        ? "Accept Bid"
                        : "Reject Bid"}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {confirmationAction === "delete"
                          ? "Are you sure you want to delete this project? This action cannot be undone."
                          : confirmationAction === "accept"
                          ? "Are you sure you want to accept this bid? This will assign the freelancer to your project and reject all other bids."
                          : "Are you sure you want to reject this bid? This action cannot be undone."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => {
                    if (confirmationAction === "delete") {
                      confirmDeleteProject();
                    } else if (confirmationAction === "accept") {
                      confirmAcceptBid();
                    } else {
                      confirmRejectBid();
                    }
                  }}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${
                    confirmationAction === "accept"
                      ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                      : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm`}
                >
                  {confirmationAction === "delete"
                    ? "Delete"
                    : confirmationAction === "accept"
                    ? "Accept"
                    : "Reject"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
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
