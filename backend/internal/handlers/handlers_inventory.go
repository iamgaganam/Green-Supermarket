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

// UpdateInventoryHandler updates product inventory
func UpdateInventoryHandler(db *sql.DB) http.HandlerFunc {
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

		productID, err := strconv.Atoi(strings.TrimPrefix(r.URL.Path, "/api/admin/inventory/"))
		if err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid product ID")
			return
		}

		var req struct {
			Quantity   int    `json:"quantity" binding:"required"`
			ChangeType string `json:"change_type"` // "order", "restock", "adjustment", "damage"
			Reason     string `json:"reason"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		// Get current stock
		var currentStock int
		err = db.QueryRow("SELECT quantity_in_stock FROM products WHERE id = $1", productID).Scan(&currentStock)
		if err != nil {
			RespondWithError(w, http.StatusNotFound, "Product not found")
			return
		}

		newStock := currentStock + req.Quantity
		if newStock < 0 {
			newStock = 0
		}

		// Update inventory
		_, err = db.Exec(
			"UPDATE products SET quantity_in_stock = $1, updated_at = NOW() WHERE id = $2",
			newStock, productID,
		)

		if err != nil {
			log.Printf("Error updating inventory: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to update inventory")
			return
		}

		// Log the change
		changeType := req.ChangeType
		if changeType == "" {
			if req.Quantity > 0 {
				changeType = "restock"
			} else {
				changeType = "adjustment"
			}
		}

		_, err = db.Exec(`
			INSERT INTO inventory_log (product_id, old_stock, new_stock, change_type, reason, changed_by, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, NOW())
		`, productID, currentStock, newStock, changeType, req.Reason, userID)

		if err != nil {
			log.Printf("Error logging inventory change: %v", err)
		}

		RespondWithJSON(w, http.StatusOK, map[string]interface{}{
			"message":     "Inventory updated successfully",
			"product_id":  productID,
			"old_stock":   currentStock,
			"new_stock":   newStock,
			"change_type": changeType,
		})
	}
}

// GetInventoryLogHandler retrieves inventory change log (admin only)
func GetInventoryLogHandler(db *sql.DB) http.HandlerFunc {
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

		// Optional product filter
		productID := r.URL.Query().Get("product_id")
		limit := 100
		if l := r.URL.Query().Get("limit"); l != "" {
			if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 1000 {
				limit = parsed
			}
		}

		query := `
			SELECT il.id, il.product_id, il.old_stock, il.new_stock, il.change_type, il.reason,
				   il.changed_by, il.created_at, p.name, u.first_name, u.last_name
			FROM inventory_log il
			INNER JOIN products p ON il.product_id = p.id
			LEFT JOIN users u ON il.changed_by = u.id
		`

		var args []interface{}
		if productID != "" {
			query += " WHERE il.product_id = $1"
			args = append(args, productID)
		}

		query += " ORDER BY il.created_at DESC LIMIT $" + fmt.Sprintf("%d", len(args)+1)
		args = append(args, limit)

		rows, err := db.Query(query, args...)
		if err != nil {
			log.Printf("Error fetching inventory log: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch inventory log")
			return
		}
		defer rows.Close()

		var logs []map[string]interface{}
		for rows.Next() {
			var logID, productID, oldStock, newStock int
			var changeType, reason string
			var changedBy *int
			var createdAt, productName, firstName, lastName string
			var firstNamePtr, lastNamePtr *string

			if err := rows.Scan(&logID, &productID, &oldStock, &newStock, &changeType, &reason,
				&changedBy, &createdAt, &productName, &firstNamePtr, &lastNamePtr); err != nil {
				continue
			}

			if firstNamePtr != nil {
				firstName = *firstNamePtr
			}
			if lastNamePtr != nil {
				lastName = *lastNamePtr
			}

			logs = append(logs, map[string]interface{}{
				"id":          logID,
				"product_id":  productID,
				"product":     productName,
				"old_stock":   oldStock,
				"new_stock":   newStock,
				"change_type": changeType,
				"reason":      reason,
				"changed_by":  firstName + " " + lastName,
				"created_at":  createdAt,
			})
		}

		if logs == nil {
			logs = []map[string]interface{}{}
		}

		RespondWithJSON(w, http.StatusOK, logs)
	}
}

// GetLowStockProductsHandler retrieves products with low inventory (admin only)
func GetLowStockProductsHandler(db *sql.DB) http.HandlerFunc {
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

		threshold := 10
		if t := r.URL.Query().Get("threshold"); t != "" {
			if parsed, err := strconv.Atoi(t); err == nil && parsed > 0 {
				threshold = parsed
			}
		}

		rows, err := db.Query(`
			SELECT id, name, price, quantity_in_stock, category, image_url
			FROM products
			WHERE quantity_in_stock <= $1 AND is_active = TRUE
			ORDER BY quantity_in_stock ASC
		`, threshold)

		if err != nil {
			log.Printf("Error fetching low stock products: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch low stock products")
			return
		}
		defer rows.Close()

		var products []map[string]interface{}
		for rows.Next() {
			var id, quantity int
			var name, category, imageURL string
			var price float64
			var imageURLPtr *string

			if err := rows.Scan(&id, &name, &price, &quantity, &category, &imageURLPtr); err != nil {
				continue
			}

			if imageURLPtr != nil {
				imageURL = *imageURLPtr
			}

			products = append(products, map[string]interface{}{
				"id":                id,
				"name":              name,
				"price":             price,
				"quantity_in_stock": quantity,
				"category":          category,
				"image_url":         imageURL,
				"status":            "low_stock",
			})
		}

		if products == nil {
			products = []map[string]interface{}{}
		}

		RespondWithJSON(w, http.StatusOK, products)
	}
}

// GetInventorySummaryHandler retrieves inventory summary (admin only)
func GetInventorySummaryHandler(db *sql.DB) http.HandlerFunc {
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

		var totalProducts, totalStock, lowStockCount, outOfStockCount int
		var totalValue float64

		err = db.QueryRow("SELECT COUNT(id) FROM products WHERE is_active = TRUE").Scan(&totalProducts)
		err = db.QueryRow("SELECT COALESCE(SUM(quantity_in_stock), 0) FROM products WHERE is_active = TRUE").Scan(&totalStock)
		err = db.QueryRow("SELECT COALESCE(SUM(quantity_in_stock * price), 0) FROM products WHERE is_active = TRUE").Scan(&totalValue)
		err = db.QueryRow("SELECT COALESCE(COUNT(id), 0) FROM products WHERE quantity_in_stock <= 10 AND is_active = TRUE").Scan(&lowStockCount)
		err = db.QueryRow("SELECT COALESCE(COUNT(id), 0) FROM products WHERE quantity_in_stock = 0 AND is_active = TRUE").Scan(&outOfStockCount)

		summary := map[string]interface{}{
			"total_products":     totalProducts,
			"total_stock":        totalStock,
			"total_value":        totalValue,
			"low_stock_count":    lowStockCount,
			"out_of_stock_count": outOfStockCount,
		}

		RespondWithJSON(w, http.StatusOK, summary)
	}
}
