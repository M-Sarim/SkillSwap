import React, { useState, useContext, useEffect } from "react";
import { toast } from "react-toastify";
import AuthContext from "../../context/AuthContext";
import axios from "axios";
import { CameraIcon } from "@heroicons/react/24/outline";

const Profile = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [freelancerProfile, setFreelancerProfile] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    skills: "",
    hourlyRate: "",
    portfolio: "",
    education: "",
    experience: "",
  });

  // Fetch freelancer profile data
  useEffect(() => {
    const fetchFreelancerProfile = async () => {
      try {
        // Make sure we're using the correct API endpoint
        const response = await axios.get("/freelancer/profile");
        console.log("Freelancer profile response:", response);

        if (response.data && response.data.success) {
          if (response.data.data && response.data.data.freelancer) {
            setFreelancerProfile(response.data.data.freelancer);
          } else {
            console.warn("Freelancer profile data not found in response");
          }
        }
      } catch (error) {
        console.error("Error fetching freelancer profile:", error);
        toast.error("Failed to load freelancer profile");
      }
    };

    if (user && user.role === "freelancer") {
      fetchFreelancerProfile();
    }
  }, [user]);

  // Update form data when user or freelancer profile changes
  useEffect(() => {
    if (user && freelancerProfile) {
      // Format education data
      let educationText = "";
      if (
        freelancerProfile.education &&
        freelancerProfile.education.length > 0
      ) {
        // If education is an array of objects, extract the institution or degree
        if (typeof freelancerProfile.education[0] === "object") {
          educationText =
            freelancerProfile.education[0].institution ||
            freelancerProfile.education[0].degree ||
            "";
        } else {
          // If it's just a string
          educationText = freelancerProfile.education[0];
        }
      }

      // Format experience data
      let experienceText = "";
      if (
        freelancerProfile.experience &&
        freelancerProfile.experience.length > 0
      ) {
        // If experience is an array of objects, extract the description
        if (typeof freelancerProfile.experience[0] === "object") {
          experienceText = freelancerProfile.experience[0].description || "";
        } else {
          // If it's just a string
          experienceText = freelancerProfile.experience[0];
        }
      }

      // Format portfolio data
      let portfolioText = "";
      if (
        freelancerProfile.portfolio &&
        freelancerProfile.portfolio.length > 0
      ) {
        portfolioText = freelancerProfile.portfolio[0];
      }

      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: freelancerProfile.bio || "",
        skills: freelancerProfile.skills
          ? freelancerProfile.skills.join(", ")
          : "",
        hourlyRate: freelancerProfile.hourlyRate || "",
        portfolio: portfolioText,
        education: educationText,
        experience: experienceText,
      });

      // Set image preview from user profile image
      setImagePreview(user.profileImage);
    } else if (user) {
      // Fallback to user data only if freelancer profile is not available
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: "",
        skills: "",
        hourlyRate: "",
        portfolio: "",
        education: "",
        experience: "",
      });
      // Set image preview from user profile image
      setImagePreview(user.profileImage);
    }
  }, [user, freelancerProfile]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle profile image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Parse and format the data
      let updatedData = {
        name: formData.name,
        // Don't send email as it can't be changed
        phone: formData.phone || undefined,
        bio: formData.bio || undefined,
        // Format skills as array
        skills: formData.skills
          ? formData.skills.split(",").map((skill) => skill.trim())
          : [],
        hourlyRate: formData.hourlyRate
          ? parseFloat(formData.hourlyRate)
          : undefined,
      };

      // Only add profileImage if it's a valid URL
      if (
        imagePreview &&
        (imagePreview.startsWith("http://") ||
          imagePreview.startsWith("https://"))
      ) {
        updatedData.profileImage = imagePreview;
      }

      // Convert string fields to proper format based on server validation
      if (formData.portfolio) {
        // Add https:// prefix if missing
        let portfolioUrl = formData.portfolio;
        if (
          !portfolioUrl.startsWith("http://") &&
          !portfolioUrl.startsWith("https://")
        ) {
          portfolioUrl = `https://${portfolioUrl}`;
        }
        // Server expects portfolio to be an array
        updatedData.portfolio = [portfolioUrl];
      } else {
        // Send empty array if no portfolio
        updatedData.portfolio = [];
      }

      if (formData.education) {
        // Server expects education to be an array of objects or strings
        // If it's just a string, wrap it in an object in an array
        updatedData.education = [
          {
            institution: formData.education,
            degree: formData.education,
            fieldOfStudy: "",
            from: "",
            to: "",
            current: false,
            description: "",
          },
        ];
      } else {
        // Send empty array if no education
        updatedData.education = [];
      }

      if (formData.experience) {
        // Server expects experience to be an array of objects or strings
        // If it's just a string, wrap it in an object in an array
        updatedData.experience = [
          {
            company: "",
            position: "",
            from: "",
            to: "",
            current: false,
            description: formData.experience,
          },
        ];
      } else {
        // Send empty array if no experience
        updatedData.experience = [];
      }

      console.log("Sending profile update data:", updatedData);

      // Use the AuthContext's updateProfile function
      const response = await updateProfile(updatedData);
      console.log("Profile update response:", response);

      if (response && response.success) {
        // Refresh the profile data
        try {
          const profileResponse = await axios.get("/freelancer/profile");
          if (
            profileResponse.data &&
            profileResponse.data.success &&
            profileResponse.data.data &&
            profileResponse.data.data.freelancer
          ) {
            setFreelancerProfile(profileResponse.data.data.freelancer);
          }
        } catch (refreshError) {
          console.warn("Error refreshing profile data:", refreshError);
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      // Error handling is already done in the AuthContext's updateProfile function
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Freelancer Profile</h1>

        <form onSubmit={handleSubmit}>
          {/* Profile Image Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 mb-2">
                <img
                  src={imagePreview || "https://via.placeholder.com/100"}
                  alt={user?.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <label
                htmlFor="profile-image"
                className="absolute bottom-0 right-0 p-1 rounded-full bg-white border border-gray-300 cursor-pointer"
              >
                <CameraIcon className="h-5 w-5 text-gray-500" />
                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleImageChange}
                />
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">Profile Picture</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="name">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled
              />
              <p className="text-sm text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="phone">
                Phone Number
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="hourlyRate">
                Hourly Rate (USD)
              </label>
              <input
                type="number"
                id="hourlyRate"
                name="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="bio">
              Bio{" "}
              <span className="text-gray-500 text-sm font-normal">
                (Optional)
              </span>
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell clients about yourself, your skills, and experience"
            ></textarea>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="skills">
              Skills (comma separated){" "}
              <span className="text-gray-500 text-sm font-normal">
                (Optional)
              </span>
            </label>
            <input
              type="text"
              id="skills"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. JavaScript, React, Node.js"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="portfolio">
              Portfolio URL{" "}
              <span className="text-gray-500 text-sm font-normal">
                (Optional)
              </span>
            </label>
            <input
              type="url"
              id="portfolio"
              name="portfolio"
              value={formData.portfolio}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://yourportfolio.com"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="education">
              Education{" "}
              <span className="text-gray-500 text-sm font-normal">
                (Optional)
              </span>
            </label>
            <textarea
              id="education"
              name="education"
              value={formData.education}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your educational background"
            ></textarea>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="experience">
              Work Experience{" "}
              <span className="text-gray-500 text-sm font-normal">
                (Optional)
              </span>
            </label>
            <textarea
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your previous work experience"
            ></textarea>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
