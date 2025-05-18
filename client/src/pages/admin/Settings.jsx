import { useState } from "react";
import {
  Cog6ToothIcon,
  BellIcon,
  LockClosedIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  UserGroupIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "Freelance Platform",
    siteDescription: "Connect with top freelancers and clients",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    maintenanceMode: false,
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    newProjectAlert: true,
    newMessageAlert: true,
    paymentAlert: true,
  });
  
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    passwordExpiry: 90,
    sessionTimeout: 30,
    loginAttempts: 5,
  });
  
  const [paymentSettings, setPaymentSettings] = useState({
    platformFee: 10,
    minimumWithdrawal: 50,
    paymentMethods: ["paypal", "bank_transfer", "credit_card"],
    currency: "USD",
    taxRate: 5,
  });

  const handleGeneralSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGeneralSettings({
      ...generalSettings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleNotificationSettingsChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings({
      ...notificationSettings,
      [name]: checked,
    });
  };

  const handleSecuritySettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecuritySettings({
      ...securitySettings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handlePaymentSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPaymentSettings({
      ...paymentSettings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handlePaymentMethodToggle = (method) => {
    if (paymentSettings.paymentMethods.includes(method)) {
      setPaymentSettings({
        ...paymentSettings,
        paymentMethods: paymentSettings.paymentMethods.filter((m) => m !== method),
      });
    } else {
      setPaymentSettings({
        ...paymentSettings,
        paymentMethods: [...paymentSettings.paymentMethods, method],
      });
    }
  };

  const handleSaveSettings = () => {
    toast.success("Settings saved successfully!");
  };

  const tabs = [
    { id: "general", name: "General", icon: Cog6ToothIcon },
    { id: "notifications", name: "Notifications", icon: BellIcon },
    { id: "security", name: "Security", icon: LockClosedIcon },
    { id: "payments", name: "Payments", icon: CurrencyDollarIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <button
          onClick={handleSaveSettings}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
        >
          Save Changes
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="px-6 pt-4 pb-0">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors duration-200`}
                >
                  <tab.icon
                    className={`${
                      activeTab === tab.id ? "text-primary-500" : "text-gray-400"
                    } h-5 w-5 mr-2`}
                    aria-hidden="true"
                  />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* General Settings */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <GlobeAltIcon className="h-5 w-5 mr-2 text-primary-500" />
                  General Settings
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">
                      Site Name
                    </label>
                    <input
                      type="text"
                      name="siteName"
                      id="siteName"
                      value={generalSettings.siteName}
                      onChange={handleGeneralSettingsChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700">
                      Site Description
                    </label>
                    <input
                      type="text"
                      name="siteDescription"
                      id="siteDescription"
                      value={generalSettings.siteDescription}
                      onChange={handleGeneralSettingsChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                      Timezone
                    </label>
                    <select
                      id="timezone"
                      name="timezone"
                      value={generalSettings.timezone}
                      onChange={handleGeneralSettingsChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">EST (Eastern Standard Time)</option>
                      <option value="CST">CST (Central Standard Time)</option>
                      <option value="PST">PST (Pacific Standard Time)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700">
                      Date Format
                    </label>
                    <select
                      id="dateFormat"
                      name="dateFormat"
                      value={generalSettings.dateFormat}
                      onChange={handleGeneralSettingsChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex items-center">
                      <input
                        id="maintenanceMode"
                        name="maintenanceMode"
                        type="checkbox"
                        checked={generalSettings.maintenanceMode}
                        onChange={handleGeneralSettingsChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-700">
                        Enable Maintenance Mode
                      </label>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      When enabled, only administrators can access the site.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <BellIcon className="h-5 w-5 mr-2 text-primary-500" />
                  Notification Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Email Notifications</p>
                      <p className="text-xs text-gray-500">Receive notifications via email</p>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="emailNotifications"
                        name="emailNotifications"
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={handleNotificationSettingsChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Push Notifications</p>
                      <p className="text-xs text-gray-500">Receive notifications in the browser</p>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="pushNotifications"
                        name="pushNotifications"
                        type="checkbox"
                        checked={notificationSettings.pushNotifications}
                        onChange={handleNotificationSettingsChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Marketing Emails</p>
                      <p className="text-xs text-gray-500">Receive marketing and promotional emails</p>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="marketingEmails"
                        name="marketingEmails"
                        type="checkbox"
                        checked={notificationSettings.marketingEmails}
                        onChange={handleNotificationSettingsChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-700">New Project Alerts</p>
                      <p className="text-xs text-gray-500">Get notified when new projects are posted</p>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="newProjectAlert"
                        name="newProjectAlert"
                        type="checkbox"
                        checked={notificationSettings.newProjectAlert}
                        onChange={handleNotificationSettingsChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <LockClosedIcon className="h-5 w-5 mr-2 text-primary-500" />
                  Security Settings
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <div className="flex items-center">
                      <input
                        id="twoFactorAuth"
                        name="twoFactorAuth"
                        type="checkbox"
                        checked={securitySettings.twoFactorAuth}
                        onChange={handleSecuritySettingsChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="twoFactorAuth" className="ml-2 block text-sm text-gray-700">
                        Enable Two-Factor Authentication
                      </label>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Require users to confirm their identity with a second factor when logging in.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="passwordExpiry" className="block text-sm font-medium text-gray-700">
                      Password Expiry (days)
                    </label>
                    <input
                      type="number"
                      name="passwordExpiry"
                      id="passwordExpiry"
                      value={securitySettings.passwordExpiry}
                      onChange={handleSecuritySettingsChange}
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Set to 0 for no expiry
                    </p>
                  </div>
                  <div>
                    <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      name="sessionTimeout"
                      id="sessionTimeout"
                      value={securitySettings.sessionTimeout}
                      onChange={handleSecuritySettingsChange}
                      min="5"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="loginAttempts" className="block text-sm font-medium text-gray-700">
                      Max Login Attempts
                    </label>
                    <input
                      type="number"
                      name="loginAttempts"
                      id="loginAttempts"
                      value={securitySettings.loginAttempts}
                      onChange={handleSecuritySettingsChange}
                      min="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Settings */}
          {activeTab === "payments" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 mr-2 text-primary-500" />
                  Payment Settings
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="platformFee" className="block text-sm font-medium text-gray-700">
                      Platform Fee (%)
                    </label>
                    <input
                      type="number"
                      name="platformFee"
                      id="platformFee"
                      value={paymentSettings.platformFee}
                      onChange={handlePaymentSettingsChange}
                      min="0"
                      max="100"
                      step="0.1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="minimumWithdrawal" className="block text-sm font-medium text-gray-700">
                      Minimum Withdrawal Amount
                    </label>
                    <input
                      type="number"
                      name="minimumWithdrawal"
                      id="minimumWithdrawal"
                      value={paymentSettings.minimumWithdrawal}
                      onChange={handlePaymentSettingsChange}
                      min="0"
                      step="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                      Default Currency
                    </label>
                    <select
                      id="currency"
                      name="currency"
                      value={paymentSettings.currency}
                      onChange={handlePaymentSettingsChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      name="taxRate"
                      id="taxRate"
                      value={paymentSettings.taxRate}
                      onChange={handlePaymentSettingsChange}
                      min="0"
                      max="100"
                      step="0.1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Methods
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          id="paypal"
                          type="checkbox"
                          checked={paymentSettings.paymentMethods.includes("paypal")}
                          onChange={() => handlePaymentMethodToggle("paypal")}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="paypal" className="ml-2 block text-sm text-gray-700">
                          PayPal
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="bank_transfer"
                          type="checkbox"
                          checked={paymentSettings.paymentMethods.includes("bank_transfer")}
                          onChange={() => handlePaymentMethodToggle("bank_transfer")}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="bank_transfer" className="ml-2 block text-sm text-gray-700">
                          Bank Transfer
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="credit_card"
                          type="checkbox"
                          checked={paymentSettings.paymentMethods.includes("credit_card")}
                          onChange={() => handlePaymentMethodToggle("credit_card")}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="credit_card" className="ml-2 block text-sm text-gray-700">
                          Credit Card
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
