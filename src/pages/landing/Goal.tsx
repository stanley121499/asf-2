import { Progress } from "flowbite-react";
import React, { useState, useEffect } from "react";
import NavbarHome from "../../components/navbar-home";

// Scratch card related types
type ScratchCardProps = {
  onComplete: () => void;
  dayNumber: number;
  isCompleted: boolean;
};

// Add these type definitions after the ScratchCardProps type
type CardData = 
  | {
      type: "scratch";
      title: string;
      dayNumber: number;
      isCompleted: boolean;
      footerText: string;
    }
  | {
      type: "goal";
      title: string;
      goal: number;
      sale: number;
      goalText: string;
      rewardText: string;
    }
  | {
      type: "reward";
      title: string;
      progress: number;
      daysLeft: number;
      rewardText: string;
    };

type CardProps = {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

const Card: React.FC<CardProps> = ({ title, children, footer, className = "" }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 shadow-lg rounded-lg w-full max-w-sm text-center flex flex-col ${className}`}>
      <div className="p-8">
        <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">
          {title}
        </h2>
        {children}
      </div>
      {footer && (
        <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 p-4 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
};

const StampCard: React.FC<ScratchCardProps> = ({ onComplete, dayNumber, isCompleted }) => {
  const totalStamps = 9; // Total number of stamps
  const completedStamps = isCompleted ? dayNumber : dayNumber - 1;
  
  // Determine which positions have gift icons instead of numbers
  const isGiftPosition = (position: number) => {
    return position === 3 || position === 6 || position === 9;
  };

  // Get completed stamps as an array of numbers
  const getCompletedStamps = () => {
    const stamps = [];
    for (let i = 1; i <= completedStamps; i++) {
      stamps.push(i);
    }
    return stamps;
  };

  const handleStampClick = () => {
    if (!isCompleted && dayNumber === completedStamps + 1) {
      onComplete();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg w-full max-w-sm text-center flex flex-col">
      <div className="p-6">
        <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">
          Loyalty Stamps
        </h2>
        
        {/* Simple instructions */}
        <div className="mb-6 text-left text-gray-500 dark:text-gray-400">
          <h3 className="text-lg font-medium mb-2">How It Works:</h3>
          <p className="mb-2">• Collect one stamp each day you visit.</p>
          <p className="mb-2">• Special rewards at stamps 3, 6, and 9!</p>
          <p>• Complete all 9 stamps to earn a free gift!</p>
        </div>
        
        {/* Stamp grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[...Array(totalStamps)].map((_, index) => {
            const position = index + 1;
            const isCompleted = getCompletedStamps().includes(position);
            
            return (
              <div 
                key={position}
                onClick={position === dayNumber && !isCompleted ? handleStampClick : undefined}
                className={`
                  relative w-16 h-16 mx-auto rounded-full flex items-center justify-center border-2
                  ${isGiftPosition(position) 
                    ? 'bg-blue-100 border-blue-300 dark:bg-blue-900 dark:border-blue-700' 
                    : 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600'
                  } 
                  ${position === dayNumber && !isCompleted 
                    ? 'cursor-pointer transform hover:scale-105 transition-transform' 
                    : ''
                  }
                `}
              >
                {isGiftPosition(position) ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                ) : (
                  <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">{position}</span>
                )}
                
                {isCompleted && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-blue-500 bg-opacity-20 dark:bg-blue-700 dark:bg-opacity-40"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Progress info */}
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {completedStamps}/{totalStamps} stamps collected
        </p>
      </div>
      
      <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 p-4 rounded-b-lg">
        <p className="font-medium">
          {completedStamps >= totalStamps 
            ? "Congratulations! Claim your reward!" 
            : `${totalStamps - completedStamps} more stamps until your reward!`
          }
        </p>
      </div>
    </div>
  );
};

const GoalPage: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [scratchedDays, setScratchedDays] = useState<number[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const totalDays = 9;
  
  // Minimum swipe distance
  const minSwipeDistance = 50;
  
  // Handle touch events for swiping
  const onTouchStart = (e: React.TouchEvent) => {
    // Prevent triggering during scratch card interaction
    if ((e.target as HTMLElement).tagName === "CANVAS") return;
    
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    // Prevent triggering during scratch card interaction
    if ((e.target as HTMLElement).tagName === "CANVAS") return;
    
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleNextCard();
    } else if (isRightSwipe) {
      handlePrevCard();
    }
  };
  
  // Simulate retrieving user progress from storage
  useEffect(() => {
    const savedProgress = localStorage.getItem("scratchCardProgress");
    if (savedProgress) {
      setScratchedDays(JSON.parse(savedProgress));
    }
  }, []);

  // Example goals and rewards
  const cardsData: CardData[] = [
    {
      type: "scratch",
      title: "Loyalty Stamps",
      dayNumber: scratchedDays.length + 1,
      isCompleted: false,
      footerText: `${scratchedDays.length}/${totalDays} stamps collected`,
    },
    {
      type: "goal",
      title: "Yearly Goal",
      goal: 10000,
      sale: 7500,
      goalText: `We have reached $7,500 of your $10,000 yearly goal!`,
      rewardText: "Reward: 80% off storewide sale!",
    },
    {
      type: "reward",
      title: "Loyalty Program",
      progress: (scratchedDays.length / totalDays) * 100,
      daysLeft: totalDays - scratchedDays.length,
      rewardText: "Complete all stamps to unlock a free gift!",
    }
  ];

  const handleScratchComplete = () => {
    const newDay = scratchedDays.length + 1;
    const updatedDays = [...scratchedDays, newDay];
    setScratchedDays(updatedDays);
    localStorage.setItem("scratchCardProgress", JSON.stringify(updatedDays));
    
    // If all days completed, show a notification or unlock the reward
    if (updatedDays.length >= totalDays) {
      alert("Congratulations! You've earned a free gift! 🎁");
    }
  };

  const handlePrevCard = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : cardsData.length - 1));
  };

  const handleNextCard = () => {
    setActiveIndex((prev) => (prev < cardsData.length - 1 ? prev + 1 : 0));
  };

  return (
    <>
      <NavbarHome />
      <section className="bg-white min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="relative w-full max-w-md px-4">
          {/* Carousel indicators */}
          <div className="flex justify-center mb-4">
            {cardsData.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-3 h-3 mx-1 rounded-full transition-all duration-300 ${
                  activeIndex === index 
                    ? "bg-blue-600 w-6" 
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Carousel container with animation */}
          <div 
            className="overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {cardsData.map((card, index) => (
                <div 
                  key={index} 
                  className="w-full flex-shrink-0 px-2 transform transition-all duration-500"
                  style={{ 
                    opacity: activeIndex === index ? 1 : 0.5,
                    transform: `scale(${activeIndex === index ? 1 : 0.95})`
                  }}
                >
                  {card.type === "scratch" && (
                    <StampCard 
                      onComplete={handleScratchComplete}
                      dayNumber={card.dayNumber}
                      isCompleted={scratchedDays.includes(card.dayNumber)}
                    />
                  )}
                  
                  {card.type === "goal" && (
                    <Card 
                      title={card.title}
                      footer={<p className="font-medium">{card.rewardText}</p>}
                    >
                      <div className="mb-8 w-64 h-64 mx-auto flex items-center justify-center">
                        <img
                          alt="Goal Illustration"
                          src="/images/illustrations/goal.svg"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="mb-4 text-gray-500 dark:text-gray-400">{card.goalText}</p>
                      <div className="w-full">
                        <Progress progress={card.sale / card.goal * 100} size="lg" color="blue" />
                      </div>
                    </Card>
                  )}
                  
                  {card.type === "reward" && (
                    <Card 
                      title={card.title}
                      footer={<p className="font-medium">{card.rewardText}</p>}
                    >
                      <div className="mb-8 w-64 h-64 mx-auto flex items-center justify-center">
                        <div className="relative w-full h-full flex items-center justify-center">
                          <div className="text-8xl">🎁</div>
                          {card.progress < 100 && (
                            <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-80 flex items-center justify-center">
                              <div className="text-center">
                                <p className="text-xl font-bold mb-2">Locked</p>
                                <p className="text-gray-600 dark:text-gray-400">
                                  {card.daysLeft} {card.daysLeft === 1 ? "day" : "days"} left!
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <Progress progress={card.progress} size="lg" color="blue" />
                    </Card>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation arrows */}
          <button 
            onClick={handlePrevCard}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-gray-700 shadow-lg flex items-center justify-center transform transition-transform hover:scale-110 focus:outline-none"
            aria-label="Previous card"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
            </svg>
          </button>
          
          <button 
            onClick={handleNextCard}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-gray-700 shadow-lg flex items-center justify-center transform transition-transform hover:scale-110 focus:outline-none"
            aria-label="Next card"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        </div>
      </section>
    </>
  );
};

export default GoalPage;