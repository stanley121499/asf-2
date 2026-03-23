"use client";
import React, { useState } from "react";
import { HiX, HiStar } from "react-icons/hi";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose }) => {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (rating === 0) return;
    setToastMessage("评价已提交");
    setTimeout(() => {
      setToastMessage("");
      setText("");
      setRating(0);
      onClose();
    }, 2000);
  };

  return (
    <>
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-full text-sm z-[110]">
          {toastMessage}
        </div>
      )}
      <div className="fixed inset-0 z-[100] flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-t-3xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] w-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display text-xl text-[var(--color-text)]">撰写评价</h3>
            <button onClick={onClose}>
              <HiX size={24} className="text-[var(--color-muted)]" />
            </button>
          </div>
          
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setRating(star)}>
                <HiStar size={32} className={star <= rating ? "text-yellow-400" : "text-gray-200"} />
              </button>
            ))}
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="分享您的购物体验..."
            className="w-full h-32 p-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-panel)] text-[var(--color-text)] resize-none outline-none focus:ring-2 focus:ring-[var(--color-accent)] mb-4 shrink-0"
          />

          <button 
            onClick={handleSubmit}
            disabled={rating === 0}
            className="w-full btn-primary rounded-xl disabled:opacity-50"
          >
            提交评价
          </button>
        </div>
      </div>
    </>
  );
};

export default ReviewModal;
