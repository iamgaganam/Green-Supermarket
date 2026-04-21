package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
)

// CreateSubscriberHandler creates a new email subscriber
func CreateSubscriberHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}

		var req struct {
			Email string `json:"email"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		// Validate email
		if req.Email == "" || !strings.Contains(req.Email, "@") {
			RespondWithError(w, http.StatusBadRequest, "Invalid email address")
			return
		}

		// Check if already subscribed
		var existingID int
		err := db.QueryRow("SELECT id FROM subscribers WHERE LOWER(email) = LOWER($1)", req.Email).Scan(&existingID)
		if err == nil {
			RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Already subscribed"})
			return
		}

		// Create subscriber
		var subscriberID int
		err = db.QueryRow(
			"INSERT INTO subscribers (email, created_at) VALUES ($1, NOW()) RETURNING id",
			req.Email,
		).Scan(&subscriberID)

		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to create subscription")
			return
		}

		RespondWithJSON(w, http.StatusCreated, map[string]interface{}{
			"id":      subscriberID,
			"message": "Successfully subscribed to our newsletter",
			"email":   req.Email,
		})
	}
}

// GetSubscribersHandler gets all subscribers (admin only)
func GetSubscribersHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := GetUserIDFromRequest(r)
		if userID == 0 {
			RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		// Check if admin
		var isAdmin bool
		err := db.QueryRow("SELECT is_admin FROM users WHERE id = $1", userID).Scan(&isAdmin)
		if err != nil || !isAdmin {
			RespondWithError(w, http.StatusForbidden, "Admin access required")
			return
		}

		rows, err := db.Query(`
			SELECT id, email, created_at
			FROM subscribers
			ORDER BY created_at DESC
		`)

		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch subscribers")
			return
		}
		defer rows.Close()

		var subscribers []Subscriber
		for rows.Next() {
			var subscriber Subscriber
			if err := rows.Scan(&subscriber.ID, &subscriber.Email, &subscriber.CreatedAt); err != nil {
				continue
			}
			subscribers = append(subscribers, subscriber)
		}

		if subscribers == nil {
			subscribers = []Subscriber{}
		}

		RespondWithJSON(w, http.StatusOK, subscribers)
	}
}

// DeleteSubscriberHandler deletes a subscriber (admin only)
func DeleteSubscriberHandler(db *sql.DB) http.HandlerFunc {
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

		// Check if admin
		var isAdmin bool
		err := db.QueryRow("SELECT is_admin FROM users WHERE id = $1", userID).Scan(&isAdmin)
		if err != nil || !isAdmin {
			RespondWithError(w, http.StatusForbidden, "Admin access required")
			return
		}

		// Extract subscriber email from body or URL
		var req struct {
			Email string `json:"email"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		// Delete subscriber
		result, err := db.Exec("DELETE FROM subscribers WHERE LOWER(email) = LOWER($1)", req.Email)
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to delete subscriber")
			return
		}

		rowsAffected, err := result.RowsAffected()
		if rowsAffected == 0 {
			RespondWithError(w, http.StatusNotFound, "Subscriber not found")
			return
		}

		RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Subscriber deleted successfully"})
	}
}
