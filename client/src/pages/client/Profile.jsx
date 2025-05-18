import { useState, useEffect, useContext } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import axios from "axios";
import {
  UserIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";
import AuthContext from "../../context/AuthContext";
import useApi from "../../hooks/useApi";

const Profile = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const { get, put, loading, error } = useApi();
  const [clientProfile, setClientProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await get("/client/profile");
        if (response.success) {
          setClientProfile(response.data.client);
          setImagePreview(user?.profileImage);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, [get, user]);

  // Validation schema for profile
  const profileValidationSchema = Yup.object({
    name: Yup.string()
      .required("Name is required")
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name cannot exceed 50 characters"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    phone: Yup.string()
      .matches(
        /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
        "Invalid phone number"
      )
      .nullable(),
    company: Yup.string().max(100, "Company name cannot exceed 100 characters"),
    position: Yup.string().max(100, "Position cannot exceed 100 characters"),
    website: Yup.string().url("Invalid URL").nullable(),
    location: Yup.string().max(100, "Location cannot exceed 100 characters"),
    bio: Yup.string().max(500, "Bio cannot exceed 500 characters"),
  });

  // Validation schema for password
  const passwordValidationSchema = Yup.object({
    currentPassword: Yup.string().required("Current password is required"),
    newPassword: Yup.string()
      .required("New password is required")
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
      .required("Confirm password is required"),
  });

  // Validation schema for notification preferences
  const notificationValidationSchema = Yup.object({
    email: Yup.boolean(),
    sms: Yup.boolean(),
    inApp: Yup.boolean(),
  });

  // Handle profile image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (values) => {
    try {
      // Format the data according to server validation requirements
      const profileData = {
        name: values.name,
        // Don't send email as it can't be changed
        phone: values.phone || undefined,
        company: values.company || undefined,
        position: values.position || undefined,
        location: values.location || undefined,
        bio: values.bio || undefined,
      };

      // Handle website URL - add https:// prefix if missing
      if (values.website) {
        // If website doesn't start with http:// or https://, add https://
        if (
          !values.website.startsWith("http://") &&
          !values.website.startsWith("https://")
        ) {
          profileData.website = `https://${values.website}`;
        } else {
          profileData.website = values.website;
        }
      }

      // Only add profileImage if it's a valid URL
      if (
        imagePreview &&
        (imagePreview.startsWith("http://") ||
          imagePreview.startsWith("https://"))
      ) {
        profileData.profileImage = imagePreview;
      }

      console.log("Sending profile update data:", profileData);

      // Use the AuthContext's updateProfile function
      const response = await updateProfile(profileData);
      console.log("Profile update response:", response);

      if (response && response.success) {
        // Refresh the profile data
        try {
          const profileResponse = await get("/client/profile");
          if (
            profileResponse.success &&
            profileResponse.data &&
            profileResponse.data.client
          ) {
            setClientProfile(profileResponse.data.client);
          }
        } catch (refreshError) {
          console.warn("Error refreshing profile data:", refreshError);
        }
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      // Error handling is already done in the AuthContext's updateProfile function
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (values, { resetForm }) => {
    try {
      const response = await put("/auth/change-password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      if (response.success) {
        resetForm();
      }
    } catch (err) {
      console.error("Error updating password:", err);
    }
  };

  // Handle notification preferences update
  const handleNotificationUpdate = async (values) => {
    try {
      const response = await put("/notify/preferences", values);
    } catch (err) {
      console.error("Error updating notification preferences:", err);
    }
  };

  if (!clientProfile) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "profile"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("profile")}
            >
              Profile Information
            </button>
            <button
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "password"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("password")}
            >
              Change Password
            </button>
            <button
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "notifications"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("notifications")}
            >
              Notification Settings
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "profile" && (
            <Formik
              initialValues={{
                name: user?.name || "",
                email: user?.email || "",
                phone: user?.phone || "",
                company: clientProfile?.company || "",
                position: clientProfile?.position || "",
                website: clientProfile?.website || "",
                location: clientProfile?.location || "",
                bio: clientProfile?.bio || "",
              }}
              validationSchema={profileValidationSchema}
              onSubmit={handleProfileUpdate}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100">
                        <img
                          src={
                            imagePreview || "https://via.placeholder.com/100"
                          }
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
                    <div className="flex-1">
                      <h1 className="text-xl font-bold text-gray-900">
                        {user?.name}
                      </h1>
                      <p className="text-sm text-gray-500 capitalize">
                        {user?.role}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Member since{" "}
                        {new Date(user?.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Full Name
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UserIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <Field
                          type="text"
                          name="name"
                          id="name"
                          className="block w-full pl-10 rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                      <ErrorMessage
                        name="name"
                        component="p"
                        className="mt-2 text-sm text-red-600"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Email Address
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <Field
                          type="email"
                          name="email"
                          id="email"
                          className="block w-full pl-10 rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                      <ErrorMessage
                        name="email"
                        component="p"
                        className="mt-2 text-sm text-red-600"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Phone Number
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <PhoneIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <Field
                          type="text"
                          name="phone"
                          id="phone"
                          className="block w-full pl-10 rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <ErrorMessage
                        name="phone"
                        component="p"
                        className="mt-2 text-sm text-red-600"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="company"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Company
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <Field
                          type="text"
                          name="company"
                          id="company"
                          className="block w-full pl-10 rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                      <ErrorMessage
                        name="company"
                        component="p"
                        className="mt-2 text-sm text-red-600"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="position"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Position
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <Field
                          type="text"
                          name="position"
                          id="position"
                          className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          placeholder="e.g., Project Manager"
                        />
                      </div>
                      <ErrorMessage
                        name="position"
                        component="p"
                        className="mt-2 text-sm text-red-600"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="website"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Website
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <Field
                          type="text"
                          name="website"
                          id="website"
                          className="block w-full pl-10 rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          placeholder="https://example.com"
                        />
                      </div>
                      <ErrorMessage
                        name="website"
                        component="p"
                        className="mt-2 text-sm text-red-600"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="location"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Location
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPinIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <Field
                          type="text"
                          name="location"
                          id="location"
                          className="block w-full pl-10 rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          placeholder="e.g., Karachi, Pakistan"
                        />
                      </div>
                      <ErrorMessage
                        name="location"
                        component="p"
                        className="mt-2 text-sm text-red-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="bio"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Bio
                    </label>
                    <div className="mt-1">
                      <Field
                        as="textarea"
                        name="bio"
                        id="bio"
                        rows={4}
                        className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="Tell us about yourself or your company"
                      />
                    </div>
                    <ErrorMessage
                      name="bio"
                      component="p"
                      className="mt-2 text-sm text-red-600"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting || loading}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
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
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          )}

          {activeTab === "password" && (
            <Formik
              initialValues={{
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              }}
              validationSchema={passwordValidationSchema}
              onSubmit={handlePasswordUpdate}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-6">
                  <div>
                    <label
                      htmlFor="currentPassword"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Current Password
                    </label>
                    <Field
                      type="password"
                      name="currentPassword"
                      id="currentPassword"
                      className="mt-1 block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                    <ErrorMessage
                      name="currentPassword"
                      component="p"
                      className="mt-2 text-sm text-red-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium text-gray-700"
                    >
                      New Password
                    </label>
                    <Field
                      type="password"
                      name="newPassword"
                      id="newPassword"
                      className="mt-1 block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                    <ErrorMessage
                      name="newPassword"
                      component="p"
                      className="mt-2 text-sm text-red-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Confirm New Password
                    </label>
                    <Field
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      className="mt-1 block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                    <ErrorMessage
                      name="confirmPassword"
                      component="p"
                      className="mt-2 text-sm text-red-600"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting || loading}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
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
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          )}

          {activeTab === "notifications" && (
            <Formik
              initialValues={{
                email: clientProfile?.notificationPreferences?.email || true,
                sms: clientProfile?.notificationPreferences?.sms || false,
                inApp: clientProfile?.notificationPreferences?.inApp || true,
              }}
              validationSchema={notificationValidationSchema}
              onSubmit={handleNotificationUpdate}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-6">
                  <div className="space-y-4">
                    <div className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <Field
                          type="checkbox"
                          name="email"
                          id="email-notifications"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="email-notifications"
                          className="font-medium text-gray-700"
                        >
                          Email Notifications
                        </label>
                        <p className="text-gray-500">
                          Receive email notifications for project updates, bids,
                          and messages.
                        </p>
                      </div>
                    </div>

                    <div className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <Field
                          type="checkbox"
                          name="sms"
                          id="sms-notifications"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="sms-notifications"
                          className="font-medium text-gray-700"
                        >
                          SMS Notifications
                        </label>
                        <p className="text-gray-500">
                          Receive SMS alerts for important updates and
                          time-sensitive information.
                        </p>
                      </div>
                    </div>

                    <div className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <Field
                          type="checkbox"
                          name="inApp"
                          id="inapp-notifications"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="inapp-notifications"
                          className="font-medium text-gray-700"
                        >
                          In-App Notifications
                        </label>
                        <p className="text-gray-500">
                          Receive notifications within the SkillSwap platform.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting || loading}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
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
                          Saving...
                        </>
                      ) : (
                        "Save Preferences"
                      )}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
