package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
)

// GetCartHandler gets user's shopping cart
func GetCartHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := GetUserIDFromRequest(r)
		if userID == 0 {
			RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		// Get or create cart
		var cartID int
		err := db.QueryRow("SELECT id FROM shopping_carts WHERE user_id = $1 AND is_active = TRUE", userID).Scan(&cartID)

		if err == sql.ErrNoRows {
			// Create new cart
			err := db.QueryRow("INSERT INTO shopping_carts (user_id) VALUES ($1) RETURNING id", userID).Scan(&cartID)
			if err != nil {
				RespondWithError(w, http.StatusInternalServerError, "Failed to create cart")
				return
			}
		} else if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Database error")
			return
		}

		// Get cart items
		rows, err := db.Query(`
			SELECT ci.id, ci.cart_id, ci.product_id, ci.quantity, ci.price_at_addition,
				   p.name, p.description, p.price, p.quantity_in_stock, p.category, p.image_url
			FROM cart_items ci
			JOIN products p ON ci.product_id = p.id
			WHERE ci.cart_id = $1
		`, cartID)

		if err != nil {
			log.Printf("ERROR: Failed to fetch cart items for cart_id=%d: %v", cartID, err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch cart items")
			return
		}
		defer rows.Close()

		var items []CartItem
		itemCount := 0
		for rows.Next() {
			itemCount++
			var item CartItem
			var product Product
			if err := rows.Scan(&item.ID, &item.CartID, &item.ProductID, &item.Quantity, &item.PriceAtAddition,
				&product.Name, &product.Description, &product.Price, &product.QuantityInStock, &product.Category, &product.ImageURL); err != nil {
				log.Printf("ERROR: Failed to scan cart item row: %v", err)
				continue
			}
			item.Product = &product
			items = append(items, item)
		}

		log.Printf("DEBUG: GetCart - user_id=%d, cart_id=%d, itemCount=%d", userID, cartID, itemCount)

		if items == nil {
			items = []CartItem{}
		}

		cart := ShoppingCart{
			ID:       cartID,
			UserID:   userID,
			IsActive: true,
			Items:    items,
		}

		RespondWithJSON(w, http.StatusOK, cart)
	}
}

// AddToCartHandler adds an item to the cart
func AddToCartHandler(db *sql.DB) http.HandlerFunc {
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

		var req CartItemRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		// Get or create cart
		var cartID int
		err := db.QueryRow("SELECT id FROM shopping_carts WHERE user_id = $1 AND is_active = TRUE", userID).Scan(&cartID)

		if err == sql.ErrNoRows {
			err := db.QueryRow("INSERT INTO shopping_carts (user_id) VALUES ($1) RETURNING id", userID).Scan(&cartID)
			if err != nil {
				RespondWithError(w, http.StatusInternalServerError, "Failed to create cart")
				return
			}
		} else if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Database error")
			return
		}

		// Get product price
		var productPrice float64
		err = db.QueryRow("SELECT price FROM products WHERE id = $1", req.ProductID).Scan(&productPrice)
		if err != nil {
			RespondWithError(w, http.StatusNotFound, "Product not found")
			return
		}

		// Check if item already in cart
		var existingID int
		err = db.QueryRow("SELECT id FROM cart_items WHERE cart_id = $1 AND product_id = $2", cartID, req.ProductID).Scan(&existingID)

		if err == sql.ErrNoRows {
			// Add new item
			result, err := db.Exec(
				"INSERT INTO cart_items (cart_id, product_id, quantity, price_at_addition) VALUES ($1, $2, $3, $4)",
				cartID, req.ProductID, req.Quantity, productPrice,
			)
			if err != nil {
				log.Printf("ERROR: Insert cart_items failed: cart_id=%d, product_id=%d, quantity=%d, error=%v", cartID, req.ProductID, req.Quantity, err)
				RespondWithError(w, http.StatusInternalServerError, "Failed to add item to cart")
				return
			}
			rowsAffected, _ := result.RowsAffected()
			log.Printf("DEBUG: Inserted new cart item - cart_id=%d, product_id=%d, quantity=%d, rows_affected=%d", cartID, req.ProductID, req.Quantity, rowsAffected)
		} else {
			// Update quantity
			result, err := db.Exec(
				"UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2",
				req.Quantity, existingID,
			)
			if err != nil {
				log.Printf("ERROR: Update cart_items failed: cart_item_id=%d, error=%v", existingID, err)
				RespondWithError(w, http.StatusInternalServerError, "Failed to add item to cart")
				return
			}
			rowsAffected, _ := result.RowsAffected()
			log.Printf("DEBUG: Updated cart item - cart_item_id=%d, quantity_added=%d, rows_affected=%d", existingID, req.Quantity, rowsAffected)
		}

		RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Item added to cart"})
	}
}

// UpdateCartItemHandler updates quantity of an item
func UpdateCartItemHandler(db *sql.DB) http.HandlerFunc {
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

		idStr := strings.TrimPrefix(r.URL.Path, "/api/cart/items/")
		idStr = strings.Split(idStr, "/")[0]
		itemID, _ := strconv.Atoi(idStr)

		var req struct {
			Quantity int `json:"quantity"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		if req.Quantity <= 0 {
			_, err := db.Exec("DELETE FROM cart_items WHERE id = $1", itemID)
			if err != nil {
				RespondWithError(w, http.StatusInternalServerError, "Failed to remove item")
				return
			}
			RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Item removed from cart"})
			return
		}

		_, err := db.Exec(
			"UPDATE cart_items SET quantity = $1 WHERE id = $2",
			req.Quantity, itemID,
		)

		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to update cart item")
			return
		}

		RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Cart item updated"})
	}
}

// RemoveCartItemHandler removes an item from cart
func RemoveCartItemHandler(db *sql.DB) http.HandlerFunc {
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

		idStr := strings.TrimPrefix(r.URL.Path, "/api/cart/items/")
		idStr = strings.Split(idStr, "/")[0]
		itemID, _ := strconv.Atoi(idStr)

		_, err := db.Exec("DELETE FROM cart_items WHERE id = $1", itemID)
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to remove item")
			return
		}

		RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Item removed from cart"})
	}
}

// ClearCartHandler clears the shopping cart
func ClearCartHandler(db *sql.DB) http.HandlerFunc {
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

		var cartID int
		err := db.QueryRow("SELECT id FROM shopping_carts WHERE user_id = $1 AND is_active = TRUE", userID).Scan(&cartID)
		if err != nil {
			RespondWithError(w, http.StatusNotFound, "Cart not found")
			return
		}

		_, err = db.Exec("DELETE FROM cart_items WHERE cart_id = $1", cartID)
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to clear cart")
			return
		}

		RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Cart cleared"})
	}
}
