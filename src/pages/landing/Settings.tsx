import React from "react";
import { Button, Card, Avatar } from "flowbite-react";
import NavbarHome from "../../components/navbar-home";
import { Link, useNavigate } from "react-router-dom";

const ProfileSettingsPage: React.FC = () => {
  const navigate = useNavigate(); // Hook for programmatic navigation

  const handleLogout = () => {
    console.log("Logging out...");
    // Add your logout functionality here
    navigate("/logout"); // Example redirect to a logout or login page
  };

  return (
    <>
      <NavbarHome />
      <section className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-6 rounded-lg shadow-md dark:bg-gray-800">
          {/* Profile Header */}
          <div className="flex flex-col items-center">
            <Avatar
              img="/images/users/roberta-casas-2x.png"
              alt="Profile Picture"
              rounded={true}
              size="xl"
            />
            <h2 className="mt-4 text-xl font-semibold text-gray-800 dark:text-white">
              John Doe
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              john.doe@example.com
            </p>

            {/* Points */}
            <div className="flex items-center mt-4 space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Points:
              </span>
              <span className="text-sm text-gray-800 dark:text-white font-semibold">
                1000
              </span>
            </div>
          </div>

          {/* Settings Options */}
          <div className="mt-6 space-y-4">
            {/* Check Orders */}
            <Link to="/orders">
              <Button size="lg" fullSized color="gray">
                Check Orders
              </Button>
            </Link>

            {/* Change Profile Information */}
            {/* <Link to="/profile-info">
              <Button size="lg" fullSized color="gray">
                Change Profile Information
              </Button>
            </Link> */}

            {/* Chat with Support */}
            <Link to="/support-chat">
              <Button size="lg" fullSized color="gray">
                Chat with Support
              </Button>
            </Link>

            {/* Logout */}
            <Button size="lg" fullSized color="red" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </Card>
      </section>
    </>
  );
};

export default ProfileSettingsPage;
