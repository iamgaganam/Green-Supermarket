package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

// RegisterHandler handles user registration
func RegisterHandler(db *sql.DB, emailService *EmailService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}

		var req RegisterRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		// Hash password
		hashedPassword, err := HashPassword(req.Password)
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to hash password")
			return
		}

		// Insert user
		var userID int
		err = db.QueryRow(
			"INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id",
			req.Email, hashedPassword, req.FirstName, req.LastName,
		).Scan(&userID)

		if err != nil {
			RespondWithError(w, http.StatusBadRequest, "Email already registered")
			return
		}

		// Get the user
		user := &User{ID: userID, Email: req.Email, FirstName: req.FirstName, LastName: req.LastName}

		// Send welcome email
		if emailService != nil {
			emailService.SendEmailAsync(req.Email, "Welcome to GREEN Supermarket!", "Welcome to our store!")
		}

		RespondWithJSON(w, http.StatusCreated, map[string]interface{}{
			"message": "User registered successfully",
			"user":    user,
		})
	}
}

// LoginHandler handles user login
func LoginHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}

		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		// Get user by email
		var user User
		var hashedPassword string
		err := db.QueryRow(
			"SELECT id, email, password_hash, first_name, last_name, is_admin FROM users WHERE email = $1",
			req.Email,
		).Scan(&user.ID, &user.Email, &hashedPassword, &user.FirstName, &user.LastName, &user.IsAdmin)

		if err == sql.ErrNoRows {
			RespondWithError(w, http.StatusUnauthorized, "Invalid email or password")
			return
		}
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Database error")
			return
		}

		// Verify password
		if err := VerifyPassword(hashedPassword, req.Password); err != nil {
			RespondWithError(w, http.StatusUnauthorized, "Invalid email or password")
			return
		}

		// Generate token
		token, err := GenerateToken(user.ID)
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to generate token")
			return
		}

		RespondWithJSON(w, http.StatusOK, AuthResponse{
			Token: token,
			User:  &user,
		})
	}
}

// GetUserHandler gets user profile
func GetUserHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := GetUserIDFromRequest(r)
		if userID == 0 {
			RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		var user User
		err := db.QueryRow(
			"SELECT id, email, first_name, last_name, phone, address, city, state, zip_code, country, is_admin, created_at, updated_at FROM users WHERE id = $1",
			userID,
		).Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Phone, &user.Address, &user.City, &user.State, &user.ZipCode, &user.Country, &user.IsAdmin, &user.CreatedAt, &user.UpdatedAt)

		if err == sql.ErrNoRows {
			RespondWithError(w, http.StatusNotFound, "User not found")
			return
		}
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Database error")
			return
		}

		RespondWithJSON(w, http.StatusOK, user)
	}
}

// UpdateUserHandler updates user profile
func UpdateUserHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}

		userID := GetUserIDFromRequest(r)
		if userID == 0 {
			RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		var user User
		if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		_, err := db.Exec(
			"UPDATE users SET first_name = $1, last_name = $2, phone = $3, address = $4, city = $5, state = $6, zip_code = $7, country = $8, updated_at = NOW() WHERE id = $9",
			user.FirstName, user.LastName, user.Phone, user.Address, user.City, user.State, user.ZipCode, user.Country, userID,
		)

		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to update user")
			return
		}

		RespondWithJSON(w, http.StatusOK, map[string]string{"message": "User updated successfully"})
	}
}

// DeleteUserHandler deletes user account
func DeleteUserHandler(db *sql.DB, emailService *EmailService) http.HandlerFunc {
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

		// Get user email before deletion
		var email string
		err := db.QueryRow("SELECT email FROM users WHERE id = $1", userID).Scan(&email)
		if err == sql.ErrNoRows {
			RespondWithError(w, http.StatusNotFound, "User not found")
			return
		}
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Database error")
			return
		}

		// Delete user's cart items
		_, err = db.Exec("DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM shopping_carts WHERE user_id = $1)", userID)
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to delete cart items")
			return
		}

		// Delete user's shopping carts
		_, err = db.Exec("DELETE FROM shopping_carts WHERE user_id = $1", userID)
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to delete carts")
			return
		}

		// Delete user's feedback
		_, err = db.Exec("DELETE FROM feedback WHERE user_id = $1", userID)
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to delete feedback")
			return
		}

		// Delete user's general feedback
		_, err = db.Exec("DELETE FROM general_feedback WHERE user_id = $1", userID)
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to delete general feedback")
			return
		}

		// Delete user's orders (keep order data for records, just mark as cancelled or soft delete)
		// For now, we'll just delete the user but keep orders for historical purposes
		// If you want to keep orders, comment out the next line
		_, err = db.Exec("DELETE FROM orders WHERE user_id = $1", userID)
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to delete orders")
			return
		}

		// Delete the user
		_, err = db.Exec("DELETE FROM users WHERE id = $1", userID)
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to delete user")
			return
		}

		// Send account deletion confirmation email
		if emailService != nil {
			emailService.SendEmailAsync(email, "Account Deleted", "Your GREEN Supermarket account has been successfully deleted. All your personal data has been removed from our system.")
		}

		RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Account deleted successfully"})
	}
}
