"use client";
import React from "react";
import { HiStar } from "react-icons/hi";

const mockReviews = [
  { id: 1, name: "Li**", date: "2026-03-15", rating: 5, text: "质量非常好，尺码标准，非常喜欢这款设计！" },
  { id: 2, name: "Zh**", date: "2026-03-12", rating: 4, text: "发货速度很快，包装精美，但是稍微有点色差。" },
  { id: 3, name: "Wa**", date: "2026-03-01", rating: 5, text: "完美！材质很舒服，细节处理得很到位，会再次回购。" }
];

const ReviewsList: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 mt-4">
      {mockReviews.map((review) => (
        <div key={review.id} className="border-b border-[var(--color-border)] pb-6 last:border-0">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="font-medium text-sm text-[var(--color-text)] mr-2">{review.name}</span>
              <span className="text-xs text-[var(--color-muted)]">{review.date}</span>
            </div>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <HiStar key={star} size={14} className={star <= review.rating ? "text-yellow-400" : "text-gray-200"} />
              ))}
            </div>
          </div>
          <p className="text-sm text-[var(--color-text)] leading-relaxed">
            {review.text}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ReviewsList;
