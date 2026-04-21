package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
)

// CreateGeneralFeedbackHandler creates general website feedback
func CreateGeneralFeedbackHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}

		var req GeneralFeedbackRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		if req.Rating < 1 || req.Rating > 5 {
			RespondWithError(w, http.StatusBadRequest, "Rating must be between 1 and 5")
			return
		}

		// Get user ID if logged in
		userID := GetUserIDFromRequest(r)
		var userIDPtr *int
		if userID != 0 {
			userIDPtr = &userID
		}

		var feedbackID int
		err := db.QueryRow(
			"INSERT INTO general_feedback (user_id, email, name, message, rating, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id",
			userIDPtr, req.Email, req.Name, req.Message, req.Rating,
		).Scan(&feedbackID)

		if err != nil {
			log.Printf("Error creating feedback: %v", err)
			RespondWithError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create feedback: %v", err))
			return
		}

		RespondWithJSON(w, http.StatusCreated, map[string]interface{}{
			"id":      feedbackID,
			"message": "Thank you for your feedback!",
		})
	}
}

// GetGeneralFeedbackHandler gets general feedback for display on homepage
func GetGeneralFeedbackHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := db.Query(`
			SELECT id, email, name, message, rating, created_at
			FROM general_feedback
			ORDER BY created_at DESC
			LIMIT 10
		`)

		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch feedback")
			return
		}
		defer rows.Close()

		var feedbacks []map[string]interface{}
		for rows.Next() {
			var feedback GeneralFeedback
			if err := rows.Scan(&feedback.ID, &feedback.Email, &feedback.Name, &feedback.Message, &feedback.Rating, &feedback.CreatedAt); err != nil {
				continue
			}
			feedbacks = append(feedbacks, map[string]interface{}{
				"id":         feedback.ID,
				"name":       feedback.Name,
				"email":      feedback.Email,
				"rating":     feedback.Rating,
				"message":    feedback.Message,
				"created_at": feedback.CreatedAt,
			})
		}

		if feedbacks == nil {
			feedbacks = []map[string]interface{}{}
		}

		RespondWithJSON(w, http.StatusOK, feedbacks)
	}
}

// GetUserGeneralFeedbackHandler gets feedback submitted by logged-in user
func GetUserGeneralFeedbackHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := GetUserIDFromRequest(r)
		if userID == 0 {
			RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		rows, err := db.Query(`
			SELECT id, email, name, message, rating, created_at
			FROM general_feedback
			WHERE user_id = $1
			ORDER BY created_at DESC
		`, userID)

		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch feedback")
			return
		}
		defer rows.Close()

		var feedbacks []map[string]interface{}
		for rows.Next() {
			var feedback GeneralFeedback
			if err := rows.Scan(&feedback.ID, &feedback.Email, &feedback.Name, &feedback.Message, &feedback.Rating, &feedback.CreatedAt); err != nil {
				continue
			}
			feedbacks = append(feedbacks, map[string]interface{}{
				"id":         feedback.ID,
				"name":       feedback.Name,
				"email":      feedback.Email,
				"rating":     feedback.Rating,
				"message":    feedback.Message,
				"created_at": feedback.CreatedAt,
			})
		}

		if feedbacks == nil {
			feedbacks = []map[string]interface{}{}
		}

		RespondWithJSON(w, http.StatusOK, feedbacks)
	}
}

// GetAdminGeneralFeedbackHandler gets all feedback (admin only)
func GetAdminGeneralFeedbackHandler(db *sql.DB) http.HandlerFunc {
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
			SELECT id, email, name, message, rating, created_at
			FROM general_feedback
			ORDER BY created_at DESC
		`)

		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch feedback")
			return
		}
		defer rows.Close()

		var feedbacks []map[string]interface{}
		for rows.Next() {
			var feedback GeneralFeedback
			if err := rows.Scan(&feedback.ID, &feedback.Email, &feedback.Name, &feedback.Message, &feedback.Rating, &feedback.CreatedAt); err != nil {
				continue
			}
			feedbacks = append(feedbacks, map[string]interface{}{
				"id":         feedback.ID,
				"name":       feedback.Name,
				"email":      feedback.Email,
				"rating":     feedback.Rating,
				"message":    feedback.Message,
				"created_at": feedback.CreatedAt,
			})
		}

		if feedbacks == nil {
			feedbacks = []map[string]interface{}{}
		}

		RespondWithJSON(w, http.StatusOK, feedbacks)
	}
}

// DeleteGeneralFeedbackHandler deletes general feedback (user can delete own, admin can delete any)
func DeleteGeneralFeedbackHandler(db *sql.DB) http.HandlerFunc {
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
		idStr := strings.TrimPrefix(r.URL.Path, "/api/general-feedback/")
		feedbackID, err := strconv.Atoi(idStr)
		if err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid feedback ID")
			return
		}

		// Get feedback owner and check permissions
		var feedbackUserID *int
		err = db.QueryRow("SELECT user_id FROM general_feedback WHERE id = $1", feedbackID).Scan(&feedbackUserID)
		if err != nil {
			RespondWithError(w, http.StatusNotFound, "Feedback not found")
			return
		}

		// Check if user is the owner or admin
		var isAdmin bool
		db.QueryRow("SELECT is_admin FROM users WHERE id = $1", userID).Scan(&isAdmin)

		// If feedback has no user_id (anonymous), only admin can delete
		if feedbackUserID == nil && !isAdmin {
			RespondWithError(w, http.StatusForbidden, "Cannot delete this feedback")
			return
		}

		// If feedback has user_id, check ownership or admin
		if feedbackUserID != nil && *feedbackUserID != userID && !isAdmin {
			RespondWithError(w, http.StatusForbidden, "You can only delete your own feedback")
			return
		}

		// Delete the feedback
		_, err = db.Exec("DELETE FROM general_feedback WHERE id = $1", feedbackID)
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to delete feedback")
			return
		}

		RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Feedback deleted successfully"})
	}
}
