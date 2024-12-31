import { Progress } from "flowbite-react";
import React from "react";
import NavbarHome from "../../components/navbar-home";

const GoalPage: React.FC = () => {
  const goal = 10000; // Example: $10,000 sales goal
  const sale = 7500; // Example: $7,500 in sales
  const goalProgress = (sale / goal) * 100;
  const goalText = `We have reached $${sale} of your $${goal} yearly goal!`;
  const rewardText = `Reward: 80% off storewide sale!`;

  return (
    <>
      <NavbarHome />
      <section className="bg-white min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg w-full max-w-sm text-center flex flex-col">
          <div className="p-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">
              Yearly Goal
            </h2>
            <div className="mb-8 w-64 h-64 mx-auto flex items-center justify-center">
              <img
                alt="Goal Illustration"
                src="/images/illustrations/goal.svg"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="mb-4 text-gray-500 dark:text-gray-400">{goalText}</p>
            <div className="w-full">
              <Progress progress={goalProgress} size="lg" color="blue" />
            </div>
          </div>
          <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 p-4 rounded-b-lg">
            <p className="font-medium">{rewardText}</p>
          </div>
        </div>
      </section>
    </>
  );
};

export default GoalPage;
