package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// CreateDiscountCodeHandler creates a new discount code (admin only)
func CreateDiscountCodeHandler(db *sql.DB) http.HandlerFunc {
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

		// Check if admin
		var isAdmin bool
		err := db.QueryRow("SELECT is_admin FROM users WHERE id = $1", userID).Scan(&isAdmin)
		if err != nil || !isAdmin {
			RespondWithError(w, http.StatusForbidden, "Admin access required")
			return
		}

		var req DiscountCodeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		// Validate discount type
		if req.DiscountType != "percentage" && req.DiscountType != "fixed" {
			RespondWithError(w, http.StatusBadRequest, "Invalid discount_type")
			return
		}

		var codeID int
		err = db.QueryRow(`
			INSERT INTO discount_codes (code, description, discount_type, discount_value, max_uses, min_order_value, expires_at, is_active, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, NOW(), NOW())
			RETURNING id
		`, strings.ToUpper(req.Code), req.Description, req.DiscountType, req.DiscountValue, req.MaxUses, req.MinOrderValue, req.ExpiresAt).Scan(&codeID)

		if err != nil {
			if strings.Contains(err.Error(), "duplicate") {
				RespondWithError(w, http.StatusConflict, "Discount code already exists")
				return
			}
			log.Printf("Error creating discount code: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to create discount code")
			return
		}

		RespondWithJSON(w, http.StatusCreated, map[string]interface{}{
			"id":      codeID,
			"message": "Discount code created successfully",
		})
	}
}

// ValidateDiscountCodeHandler validates a discount code
func ValidateDiscountCodeHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}

		var req ValidateDiscountRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		var code, discountType string
		var discountValue float64
		var maxUses, usedCount *int
		var minOrderValue *float64
		var expiresAt *time.Time
		var isActive bool

		err := db.QueryRow(`
			SELECT code, discount_type, discount_value, max_uses, used_count, min_order_value, expires_at, is_active
			FROM discount_codes
			WHERE UPPER(code) = UPPER($1)
		`, req.Code).Scan(&code, &discountType, &discountValue, &maxUses, &usedCount, &minOrderValue, &expiresAt, &isActive)

		if err == sql.ErrNoRows {
			RespondWithError(w, http.StatusNotFound, "Invalid discount code")
			return
		}

		if err != nil {
			log.Printf("Error validating discount code: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to validate discount code")
			return
		}

		// Check if code is active
		if !isActive {
			RespondWithError(w, http.StatusBadRequest, "Discount code is no longer active")
			return
		}

		// Check expiration
		if expiresAt != nil && expiresAt.Before(time.Now()) {
			RespondWithError(w, http.StatusBadRequest, "Discount code has expired")
			return
		}

		// Check max uses
		if maxUses != nil && usedCount != nil && *usedCount >= *maxUses {
			RespondWithError(w, http.StatusBadRequest, "Discount code has reached maximum uses")
			return
		}

		// Check minimum order value
		if minOrderValue != nil && req.Amount < *minOrderValue {
			RespondWithError(w, http.StatusBadRequest, fmt.Sprintf("Minimum order value of %.2f required", *minOrderValue))
			return
		}

		// Calculate discount
		var discountAmount float64
		if discountType == "percentage" {
			discountAmount = req.Amount * (discountValue / 100)
		} else {
			discountAmount = discountValue
			if discountAmount > req.Amount {
				discountAmount = req.Amount
			}
		}

		finalAmount := req.Amount - discountAmount

		RespondWithJSON(w, http.StatusOK, map[string]interface{}{
			"valid":           true,
			"code":            code,
			"discount_type":   discountType,
			"discount_value":  discountValue,
			"discount_amount": discountAmount,
			"final_amount":    finalAmount,
		})
	}
}

// GetDiscountCodesHandler gets all active discount codes (admin)
func GetDiscountCodesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
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

		showInactive := r.URL.Query().Get("include_inactive") == "true"

		query := "SELECT id, code, description, discount_type, discount_value, max_uses, used_count, min_order_value, expires_at, is_active, created_at, updated_at FROM discount_codes"
		if !showInactive {
			query += " WHERE is_active = TRUE"
		}
		query += " ORDER BY created_at DESC"

		rows, err := db.Query(query)
		if err != nil {
			log.Printf("Error fetching discount codes: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch discount codes")
			return
		}
		defer rows.Close()

		var codes []map[string]interface{}
		for rows.Next() {
			var id int
			var code, discountType string
			var description, descriptionPtr *string
			var discountValue float64
			var maxUses, usedCount *int
			var minOrderValue *float64
			var expiresAt *time.Time
			var isActive bool
			var createdAt, updatedAt time.Time

			if err := rows.Scan(&id, &code, &description, &discountType, &discountValue, &maxUses, &usedCount, &minOrderValue, &expiresAt, &isActive, &createdAt, &updatedAt); err != nil {
				continue
			}

			if description != nil {
				descriptionPtr = description
			}

			codes = append(codes, map[string]interface{}{
				"id":              id,
				"code":            code,
				"description":     descriptionPtr,
				"discount_type":   discountType,
				"discount_value":  discountValue,
				"max_uses":        maxUses,
				"used_count":      usedCount,
				"min_order_value": minOrderValue,
				"expires_at":      expiresAt,
				"is_active":       isActive,
				"created_at":      createdAt,
				"updated_at":      updatedAt,
			})
		}

		if codes == nil {
			codes = []map[string]interface{}{}
		}

		RespondWithJSON(w, http.StatusOK, codes)
	}
}

// UpdateDiscountCodeHandler updates a discount code (admin only)
func UpdateDiscountCodeHandler(db *sql.DB) http.HandlerFunc {
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

		// Check if admin
		var isAdmin bool
		err := db.QueryRow("SELECT is_admin FROM users WHERE id = $1", userID).Scan(&isAdmin)
		if err != nil || !isAdmin {
			RespondWithError(w, http.StatusForbidden, "Admin access required")
			return
		}

		// Extract code ID from URL
		codeID, err := strconv.Atoi(strings.TrimPrefix(r.URL.Path, "/api/admin/discount-codes/"))
		if err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid code ID")
			return
		}

		var req DiscountCodeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		_, err = db.Exec(`
			UPDATE discount_codes
			SET description = $1, discount_type = $2, discount_value = $3, max_uses = $4, 
				min_order_value = $5, expires_at = $6, updated_at = NOW()
			WHERE id = $7
		`, req.Description, req.DiscountType, req.DiscountValue, req.MaxUses, req.MinOrderValue, req.ExpiresAt, codeID)

		if err != nil {
			log.Printf("Error updating discount code: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to update discount code")
			return
		}

		RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Discount code updated successfully"})
	}
}

// DeleteDiscountCodeHandler deletes a discount code (admin only)
func DeleteDiscountCodeHandler(db *sql.DB) http.HandlerFunc {
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

		// Extract code ID from URL
		codeID, err := strconv.Atoi(strings.TrimPrefix(r.URL.Path, "/api/admin/discount-codes/"))
		if err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid code ID")
			return
		}

		_, err = db.Exec("DELETE FROM discount_codes WHERE id = $1", codeID)
		if err != nil {
			log.Printf("Error deleting discount code: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to delete discount code")
			return
		}

		RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Discount code deleted successfully"})
	}
}
