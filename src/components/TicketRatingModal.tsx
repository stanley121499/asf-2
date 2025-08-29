import React, { useState } from "react";
import { Button, Modal } from "flowbite-react";
import { FiStar } from "react-icons/fi";
import { useTicketContext } from "../context/TicketContext";

interface TicketRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  customerName?: string;
  ticketSubject?: string;
}

/**
 * Modal component for rating support ticket experience
 */
const TicketRatingModal: React.FC<TicketRatingModalProps> = ({
  isOpen,
  onClose,
  ticketId,
  customerName = "Customer",
  ticketSubject = "Support Ticket"
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { updateTicket } = useTicketContext();

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating: number) => {
    setHoveredRating(starRating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      return; // Require at least 1 star
    }

    setIsSubmitting(true);
    try {
      await updateTicket(ticketId, {
        rating,
      });
      
      // Close modal and reset form
      onClose();
      setRating(0);
    } catch (error) {
      console.error("Error submitting ticket rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
    setRating(0);
  };



  return (
    <Modal show={isOpen} onClose={onClose} size="md" popup>
      <Modal.Header className="border-b dark:border-gray-600 p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center">
          Rate Your Support Experience
        </h3>
      </Modal.Header>
      
      <Modal.Body className="p-6">
        <div className="text-center space-y-6">
          {/* Ticket Information */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
              {ticketSubject}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Support provided to {customerName}
            </p>
          </div>

          {/* Rating Question */}
          <div className="py-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              How would you rate our support?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Your feedback helps us improve our service
            </p>
          </div>

          {/* Star Rating */}
          <div className="flex justify-center items-center space-x-2 py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => handleStarHover(star)}
                onMouseLeave={handleStarLeave}
                className="p-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded"
              >
                <FiStar
                  size={36}
                  className={`transition-colors duration-150 ${
                    star <= (hoveredRating || rating)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="border-t dark:border-gray-600 p-6">
        <div className="flex justify-center gap-4 w-full">
          <Button
            color="gray"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="px-6"
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmitRating}
            disabled={rating === 0 || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 px-6"
          >
            {isSubmitting ? "Submitting..." : "Submit Rating"}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default TicketRatingModal;
