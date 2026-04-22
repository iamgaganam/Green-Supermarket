"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import { Star, Trash2 } from "lucide-react";

interface GeneralFeedback {
  id: number;
  email: string;
  name: string;
  message: string;
  rating: number;
  created_at: string;
}

export default function UserFeedbackPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<GeneralFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (!token) {
      router.push("/");
      return;
    }
    apiClient.setToken(token);
    fetchFeedbacks();
  }, [token, router]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUserGeneralFeedback();
      setFeedbacks(response.data || []);
    } catch (error) {
      console.error("Failed to fetch feedbacks", error);
      toast.error("Failed to load your feedbacks");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (feedbackId: number) => {
    if (!confirm("Are you sure you want to delete this feedback?")) {
      return;
    }

    try {
      setDeleting(feedbackId);
      await apiClient.deleteGeneralFeedback(feedbackId);
      toast.success("Feedback deleted successfully");
      setFeedbacks((prev) => prev.filter((f) => f.id !== feedbackId));
    } catch (error) {
      toast.error("Failed to delete feedback");
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 transition-colors dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-48 rounded-lg bg-gray-200 animate-pulse dark:bg-gray-800"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 transition-colors dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-800 dark:text-white">
            My Feedback
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage your feedback submissions
          </p>
        </div>

        {feedbacks.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-md transition-colors dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-4 text-lg text-gray-600 dark:text-gray-400">
              You haven't submitted any feedback yet
            </p>
            <a
              href="/"
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition"
            >
              Go Back and Submit Feedback
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {feedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="rounded-lg border border-gray-200 border-l-4 border-l-green-600 bg-white p-6 shadow-md transition-colors dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="mb-1 text-xl font-bold text-gray-800 dark:text-white">
                      {feedback.name}
                    </h3>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      {feedback.email}
                    </p>
                    <div className="flex items-center gap-1 mb-2">
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(feedback.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(feedback.id)}
                    disabled={deleting === feedback.id}
                    className="text-red-600 transition hover:text-red-800 disabled:opacity-50 dark:text-red-300 dark:hover:text-red-200"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  {feedback.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
