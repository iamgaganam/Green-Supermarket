package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

// CreateFeedbackHandler creates feedback
func CreateFeedbackHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}

		userID := GetUserIDFromRequest(r)
		if userID == 0 {
			RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		var req FeedbackRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		if req.Rating < 1 || req.Rating > 5 {
			RespondWithError(w, http.StatusBadRequest, "Rating must be between 1 and 5")
			return
		}

		var feedbackID int
		err := db.QueryRow(
			"INSERT INTO feedback (user_id, order_id, product_id, rating, title, comment) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
			userID, req.OrderID, req.ProductID, req.Rating, req.Title, req.Comment,
		).Scan(&feedbackID)

		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to create feedback")
			return
		}

		RespondWithJSON(w, http.StatusCreated, map[string]interface{}{
			"id":      feedbackID,
			"message": "Feedback created successfully",
		})
	}
}

// GetFeedbackHandler gets feedback
func GetFeedbackHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := GetUserIDFromRequest(r)
		if userID == 0 {
			RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		rows, err := db.Query(`
			SELECT id, user_id, order_id, product_id, rating, title, comment, created_at, updated_at
			FROM feedback
			WHERE user_id = $1
			ORDER BY created_at DESC
		`, userID)

		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch feedback")
			return
		}
		defer rows.Close()

		var feedbacks []Feedback
		for rows.Next() {
			var feedback Feedback
			if err := rows.Scan(&feedback.ID, &feedback.UserID, &feedback.OrderID, &feedback.ProductID, &feedback.Rating, &feedback.Title, &feedback.Comment, &feedback.CreatedAt, &feedback.UpdatedAt); err != nil {
				continue
			}
			feedbacks = append(feedbacks, feedback)
		}

		if feedbacks == nil {
			feedbacks = []Feedback{}
		}

		RespondWithJSON(w, http.StatusOK, feedbacks)
	}
}

// GetProductFeedbackHandler gets feedback for a specific product
func GetProductFeedbackHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := strings.TrimPrefix(r.URL.Path, "/api/products/")
		parts := strings.Split(idStr, "/")
		if len(parts) < 2 {
			RespondWithError(w, http.StatusBadRequest, "Invalid request")
			return
		}
		idStr = parts[0]
		id, _ := strconv.Atoi(idStr)

		rows, err := db.Query(`
			SELECT f.id, f.user_id, f.order_id, f.product_id, f.rating, f.title, f.comment, f.created_at, u.first_name, u.last_name
			FROM feedback f
			JOIN users u ON f.user_id = u.id
			WHERE f.product_id = $1
			ORDER BY f.created_at DESC
		`, id)

		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch feedback")
			return
		}
		defer rows.Close()

		var feedbacks []map[string]interface{}
		for rows.Next() {
			var feedback Feedback
			var firstName, lastName string
			if err := rows.Scan(&feedback.ID, &feedback.UserID, &feedback.OrderID, &feedback.ProductID, &feedback.Rating, &feedback.Title, &feedback.Comment, &feedback.CreatedAt, &firstName, &lastName); err != nil {
				continue
			}
			feedbacks = append(feedbacks, map[string]interface{}{
				"id":         feedback.ID,
				"rating":     feedback.Rating,
				"title":      feedback.Title,
				"comment":    feedback.Comment,
				"author":     firstName + " " + lastName,
				"created_at": feedback.CreatedAt,
			})
		}

		if feedbacks == nil {
			feedbacks = []map[string]interface{}{}
		}

		RespondWithJSON(w, http.StatusOK, feedbacks)
	}
}

// GetAllFeedbackHandler gets all feedback (admin only)
func GetAllFeedbackHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := GetUserIDFromRequest(r)
		if userID == 0 {
			RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		// Check if admin
		var isAdmin bool
		db.QueryRow("SELECT is_admin FROM users WHERE id = $1", userID).Scan(&isAdmin)
		if !isAdmin {
			RespondWithError(w, http.StatusForbidden, "Admin access required")
			return
		}

		rows, err := db.Query(`
			SELECT f.id, f.user_id, f.order_id, f.product_id, f.rating, f.title, f.comment, f.created_at, u.first_name, u.last_name
			FROM feedback f
			JOIN users u ON f.user_id = u.id
			ORDER BY f.created_at DESC
		`)

		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch feedback")
			return
		}
		defer rows.Close()

		var feedbacks []map[string]interface{}
		for rows.Next() {
			var feedback Feedback
			var firstName, lastName string
			if err := rows.Scan(&feedback.ID, &feedback.UserID, &feedback.OrderID, &feedback.ProductID, &feedback.Rating, &feedback.Title, &feedback.Comment, &feedback.CreatedAt, &firstName, &lastName); err != nil {
				continue
			}
			feedbacks = append(feedbacks, map[string]interface{}{
				"id":         feedback.ID,
				"user_id":    feedback.UserID,
				"product_id": feedback.ProductID,
				"order_id":   feedback.OrderID,
				"rating":     feedback.Rating,
				"title":      feedback.Title,
				"comment":    feedback.Comment,
				"author":     firstName + " " + lastName,
				"created_at": feedback.CreatedAt,
			})
		}

		if feedbacks == nil {
			feedbacks = []map[string]interface{}{}
		}

		RespondWithJSON(w, http.StatusOK, feedbacks)
	}
}

// GetFeedbackStatisticsHandler gets feedback statistics (admin only)
func GetFeedbackStatisticsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := GetUserIDFromRequest(r)
		if userID == 0 {
			RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		// Check if admin
		var isAdmin bool
		db.QueryRow("SELECT is_admin FROM users WHERE id = $1", userID).Scan(&isAdmin)
		if !isAdmin {
			RespondWithError(w, http.StatusForbidden, "Admin access required")
			return
		}

		// Get average rating
		var avgRating float64
		var totalFeedback int
		db.QueryRow(`
			SELECT COALESCE(AVG(rating), 0), COUNT(*) FROM feedback
		`).Scan(&avgRating, &totalFeedback)

		// Get rating distribution
		var ratingDist []map[string]interface{}
		rows, err := db.Query(`
			SELECT rating, COUNT(*) as count
			FROM feedback
			GROUP BY rating
			ORDER BY rating DESC
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var rating, count int
				if err := rows.Scan(&rating, &count); err == nil {
					ratingDist = append(ratingDist, map[string]interface{}{
						"rating": rating,
						"count":  count,
					})
				}
			}
		}

		RespondWithJSON(w, http.StatusOK, map[string]interface{}{
			"average_rating":      avgRating,
			"total_feedback":      totalFeedback,
			"rating_distribution": ratingDist,
		})
	}
}

// DeleteFeedbackHandler deletes feedback (user can delete own, admin can delete any)
func DeleteFeedbackHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}

		userID := GetUserIDFromRequest(r)
		if userID == 0 {
			RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		// Extract feedback ID from URL
		idStr := strings.TrimPrefix(r.URL.Path, "/api/feedback/")
		feedbackID, err := strconv.Atoi(idStr)
		if err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid feedback ID")
			return
		}

		// Get feedback owner and check permissions
		var feedbackUserID int
		err = db.QueryRow("SELECT user_id FROM feedback WHERE id = $1", feedbackID).Scan(&feedbackUserID)
		if err != nil {
			RespondWithError(w, http.StatusNotFound, "Feedback not found")
			return
		}

		// Check if user is the owner or admin
		var isAdmin bool
		db.QueryRow("SELECT is_admin FROM users WHERE id = $1", userID).Scan(&isAdmin)

		if userID != feedbackUserID && !isAdmin {
			RespondWithError(w, http.StatusForbidden, "You can only delete your own feedback")
			return
		}

		// Delete the feedback
		_, err = db.Exec("DELETE FROM feedback WHERE id = $1", feedbackID)
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to delete feedback")
			return
		}

		RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Feedback deleted successfully"})
	}
}
