"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { Star } from "lucide-react";

interface Feedback {
  id: number;
  email: string;
  name: string;
  message: string;
  rating: number;
  created_at: string;
}

interface GeneralFeedbackDisplayProps {
  onUpdate?: number;
}

export default function GeneralFeedbackDisplay({
  onUpdate,
}: GeneralFeedbackDisplayProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
  }, [onUpdate]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getGeneralFeedback();
      setFeedbacks(response.data || []);
    } catch (error) {
      console.error("Failed to fetch feedback", error);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-64 rounded-lg bg-gray-200 animate-pulse dark:bg-gray-800"
          />
        ))}
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <p className="text-center text-gray-600 dark:text-gray-400">
        No feedback yet. Be the first to share your experience!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {feedbacks.map((feedback) => (
        <div
          key={feedback.id}
          className="rounded-lg border border-gray-200 border-l-4 border-l-green-600 bg-white p-6 shadow-md transition-colors dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="font-bold text-gray-800 dark:text-white">
                {feedback.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {feedback.email}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={`${
                    i < feedback.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="mb-3 line-clamp-3 text-gray-700 dark:text-gray-300">
            {feedback.message}
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(feedback.created_at)}
          </div>
        </div>
      ))}
    </div>
  );
}
