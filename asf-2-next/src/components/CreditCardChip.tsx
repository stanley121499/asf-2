import React from "react";

/**
 * Credit card chip icon for visual enhancement
 * Adds a realistic chip element to the card UI
 */
interface CreditCardChipProps {
  className?: string;
}

const CreditCardChip: React.FC<CreditCardChipProps> = ({ className = "" }) => {
  return (
    <div className={`w-10 h-7 rounded bg-gradient-to-b from-yellow-400 to-yellow-600 relative overflow-hidden ${className}`}>
      {/* Chip lines */}
      <div className="absolute top-1 left-1 w-8 h-0.5 bg-gray-700 bg-opacity-50"></div>
      <div className="absolute top-2 left-1 w-8 h-0.5 bg-gray-700 bg-opacity-50"></div>
      <div className="absolute top-3 left-1 w-8 h-0.5 bg-gray-700 bg-opacity-50"></div>
      
      {/* Vertical lines */}
      <div className="absolute top-1 left-2 w-0.5 h-5 bg-gray-700 bg-opacity-50"></div>
      <div className="absolute top-1 left-4 w-0.5 h-5 bg-gray-700 bg-opacity-50"></div>
      <div className="absolute top-1 left-6 w-0.5 h-5 bg-gray-700 bg-opacity-50"></div>
      <div className="absolute top-1 left-8 w-0.5 h-5 bg-gray-700 bg-opacity-50"></div>
      
      {/* Shine effect */}
      <div className="absolute -top-1 -right-1 w-3 h-8 bg-white bg-opacity-30 transform rotate-45"></div>
    </div>
  );
};

export default CreditCardChip; 