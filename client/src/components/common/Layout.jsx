import { Outlet } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../../context/AuthContext";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gradient-subtle from-neutral-50 via-white to-neutral-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col transition-colors duration-200">
      <Navbar />

      <div className="flex flex-1 pt-2">
        {user && <Sidebar />}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
