package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
)

// AddToWishlistHandler adds a product to user's wishlist
func AddToWishlistHandler(db *sql.DB) http.HandlerFunc {
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

		var req struct {
			ProductID int `json:"product_id" binding:"required"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		// Check if product exists
		var productExists bool
		err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM products WHERE id = $1)", req.ProductID).Scan(&productExists)
		if err != nil || !productExists {
			RespondWithError(w, http.StatusNotFound, "Product not found")
			return
		}

		// Check if already in wishlist
		var alreadyExists bool
		err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM wishlist WHERE user_id = $1 AND product_id = $2)", userID, req.ProductID).Scan(&alreadyExists)
		if err == nil && alreadyExists {
			RespondWithError(w, http.StatusConflict, "Product already in wishlist")
			return
		}

		// Add to wishlist
		var wishlistID int
		err = db.QueryRow(
			"INSERT INTO wishlist (user_id, product_id, created_at) VALUES ($1, $2, NOW()) RETURNING id",
			userID, req.ProductID,
		).Scan(&wishlistID)

		if err != nil {
			log.Printf("Error adding to wishlist: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to add to wishlist")
			return
		}

		RespondWithJSON(w, http.StatusCreated, map[string]interface{}{
			"id":         wishlistID,
			"message":    "Added to wishlist",
			"product_id": req.ProductID,
		})
	}
}

// GetWishlistHandler retrieves user's wishlist
func GetWishlistHandler(db *sql.DB) http.HandlerFunc {
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

		rows, err := db.Query(`
			SELECT w.id, w.user_id, w.product_id, p.id, p.name, p.description, p.price, 
				   p.quantity_in_stock, p.category, p.image_url, p.sku, p.is_active, 
				   p.created_at, p.updated_at, w.created_at
			FROM wishlist w
			INNER JOIN products p ON w.product_id = p.id
			WHERE w.user_id = $1
			ORDER BY w.created_at DESC
		`, userID)

		if err != nil {
			log.Printf("Error fetching wishlist: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch wishlist")
			return
		}
		defer rows.Close()

		var wishlistItems []map[string]interface{}
		for rows.Next() {
			var wishlistID, productID, quantityInStock int
			var userIDVal int
			var name, category, imageURL, sku string
			var description string
			var descriptionPtr *string
			var price float64
			var isActive bool
			var createdAt, updatedAt, addedAt string

			if err := rows.Scan(&wishlistID, &userIDVal, &productID, &productID, &name, &descriptionPtr, &price,
				&quantityInStock, &category, &imageURL, &sku, &isActive, &createdAt, &updatedAt, &addedAt); err != nil {
				log.Printf("Error scanning wishlist item: %v", err)
				continue
			}

			if descriptionPtr != nil {
				description = *descriptionPtr
			}

			wishlistItems = append(wishlistItems, map[string]interface{}{
				"id":         wishlistID,
				"product_id": productID,
				"added_at":   addedAt,
				"product": map[string]interface{}{
					"id":                productID,
					"name":              name,
					"description":       description,
					"price":             price,
					"quantity_in_stock": quantityInStock,
					"category":          category,
					"image_url":         imageURL,
					"sku":               sku,
					"is_active":         isActive,
				},
			})
		}

		if wishlistItems == nil {
			wishlistItems = []map[string]interface{}{}
		}

		RespondWithJSON(w, http.StatusOK, wishlistItems)
	}
}

// RemoveFromWishlistHandler removes a product from wishlist
func RemoveFromWishlistHandler(db *sql.DB) http.HandlerFunc {
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

		// Extract product ID from URL
		pathParts := strings.Split(r.URL.Path, "/")
		if len(pathParts) < 4 {
			RespondWithError(w, http.StatusBadRequest, "Invalid request")
			return
		}

		productID, err := strconv.Atoi(pathParts[len(pathParts)-1])
		if err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid product ID")
			return
		}

		// Delete from wishlist
		result, err := db.Exec(
			"DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2",
			userID, productID,
		)

		if err != nil {
			log.Printf("Error removing from wishlist: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to remove from wishlist")
			return
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil || rowsAffected == 0 {
			RespondWithError(w, http.StatusNotFound, "Item not found in wishlist")
			return
		}

		RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Removed from wishlist"})
	}
}

// CheckWishlistHandler checks if a product is in wishlist
func CheckWishlistHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}

		userID := GetUserIDFromRequest(r)
		if userID == 0 {
			// Return false for anonymous users
			RespondWithJSON(w, http.StatusOK, map[string]bool{"in_wishlist": false})
			return
		}

		productID := r.URL.Query().Get("product_id")
		if productID == "" {
			RespondWithError(w, http.StatusBadRequest, "Missing product_id parameter")
			return
		}

		var exists bool
		err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM wishlist WHERE user_id = $1 AND product_id = $2)", userID, productID).Scan(&exists)
		if err != nil {
			log.Printf("Error checking wishlist: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to check wishlist")
			return
		}

		RespondWithJSON(w, http.StatusOK, map[string]bool{"in_wishlist": exists})
	}
}

// ClearWishlistHandler clears entire wishlist
func ClearWishlistHandler(db *sql.DB) http.HandlerFunc {
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

		_, err := db.Exec("DELETE FROM wishlist WHERE user_id = $1", userID)
		if err != nil {
			log.Printf("Error clearing wishlist: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to clear wishlist")
			return
		}

		RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Wishlist cleared"})
	}
}
