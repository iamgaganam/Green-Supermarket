"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { apiClient } from "@/lib/api";
import { ArrowLeft, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface UserFeedback {
  id: number;
  product_id?: number;
  order_id?: number;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
}

export default function FeedbackPage() {
  const router = useRouter();
  const { token, isHydrated } = useAuthStore();
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isHydrated) return;

    if (!token) {
      router.push("/login");
      return;
    }

    fetchFeedbacks();
  }, [isHydrated, token]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getFeedback();
      setFeedbacks(response.data || []);
    } catch (error) {
      console.error("Failed to fetch feedbacks", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId: number) => {
    if (!confirm("Are you sure you want to delete this feedback?")) return;

    try {
      await apiClient.deleteFeedback(feedbackId);
      toast.success("Feedback deleted successfully");
      setFeedbacks((prev) => prev.filter((f) => f.id !== feedbackId));
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete feedback");
    }
  };

  if (!isHydrated) {
    return (
      <div className="py-12 text-center text-gray-600 dark:text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 mb-4"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            My Feedback
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View all the feedback you've shared with us
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Loading your feedback...
            </p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-md transition-colors dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-4 text-gray-500 dark:text-gray-400">
              You haven't left any feedback yet.
            </p>
            <button
              onClick={() => router.push("/")}
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-md transition hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={18}
                          className={
                            star <= feedback.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 dark:text-gray-600"
                          }
                        />
                      ))}
                    </div>

                    {/* Title and metadata */}
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {feedback.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {feedback.product_id && `Product #${feedback.product_id}`}
                      {feedback.product_id && feedback.order_id && " • "}
                      {feedback.order_id && `Order #${feedback.order_id}`}
                      {" • "}
                      {new Date(feedback.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteFeedback(feedback.id)}
                    className="ml-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-red-600 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>

                {/* Comment */}
                {feedback.comment && (
                  <p className="text-gray-700 dark:text-gray-300">
                    {feedback.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
