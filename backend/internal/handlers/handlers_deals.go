package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// GetDealsOfDayHandler retrieves today's deals
func GetDealsOfDayHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}

		today := time.Now().Format("2006-01-02")

		rows, err := db.Query(`
			SELECT d.id, d.product_id, d.original_price, d.deal_price, d.discount, 
				   p.id, p.name, p.description, p.price, p.quantity_in_stock, 
				   p.category, p.image_url, p.sku, p.is_active, p.created_at, p.updated_at
			FROM deals_of_day d
			INNER JOIN products p ON d.product_id = p.id
			WHERE d.deal_date = $1 AND d.is_active = TRUE
			ORDER BY d.discount DESC
		`, today)

		if err != nil {
			log.Printf("Error fetching deals: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch deals")
			return
		}
		defer rows.Close()

		var deals []map[string]interface{}
		for rows.Next() {
			var dealID, productID, quantityInStock int
			var originalPrice, dealPrice, discount float64
			var name, category, imageURL, sku string
			var description string
			var descriptionPtr *string
			var isActive bool
			var createdAt, updatedAt string

			if err := rows.Scan(&dealID, &productID, &originalPrice, &dealPrice, &discount,
				&productID, &name, &descriptionPtr, nil, &quantityInStock,
				&category, &imageURL, &sku, &isActive, &createdAt, &updatedAt); err != nil {
				log.Printf("Error scanning deal: %v", err)
				continue
			}

			if descriptionPtr != nil {
				description = *descriptionPtr
			}

			deals = append(deals, map[string]interface{}{
				"id":             dealID,
				"product_id":     productID,
				"original_price": originalPrice,
				"deal_price":     dealPrice,
				"discount":       discount,
				"product": map[string]interface{}{
					"id":                productID,
					"name":              name,
					"description":       description,
					"price":             dealPrice,
					"quantity_in_stock": quantityInStock,
					"category":          category,
					"image_url":         imageURL,
					"sku":               sku,
					"is_active":         isActive,
				},
			})
		}

		if deals == nil {
			deals = []map[string]interface{}{}
		}

		RespondWithJSON(w, http.StatusOK, deals)
	}
}

// GetUpcomingDealsHandler retrieves upcoming deals
func GetUpcomingDealsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}

		rows, err := db.Query(`
			SELECT d.id, d.product_id, d.original_price, d.deal_price, d.discount, d.deal_date,
				   p.id, p.name, p.description, p.price, p.quantity_in_stock, 
				   p.category, p.image_url, p.sku, p.is_active, p.created_at, p.updated_at
			FROM deals_of_day d
			INNER JOIN products p ON d.product_id = p.id
			WHERE d.deal_date >= CURRENT_DATE AND d.is_active = TRUE
			ORDER BY d.deal_date ASC, d.discount DESC
			LIMIT 20
		`)

		if err != nil {
			log.Printf("Error fetching upcoming deals: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch upcoming deals")
			return
		}
		defer rows.Close()

		var deals []map[string]interface{}
		for rows.Next() {
			var dealID, productID, quantityInStock int
			var originalPrice, dealPrice, discount float64
			var dealDate, name, category, imageURL, sku string
			var description string
			var descriptionPtr *string
			var isActive bool
			var createdAt, updatedAt string

			if err := rows.Scan(&dealID, &productID, &originalPrice, &dealPrice, &discount, &dealDate,
				&productID, &name, &descriptionPtr, nil, &quantityInStock,
				&category, &imageURL, &sku, &isActive, &createdAt, &updatedAt); err != nil {
				continue
			}

			if descriptionPtr != nil {
				description = *descriptionPtr
			}

			deals = append(deals, map[string]interface{}{
				"id":             dealID,
				"product_id":     productID,
				"original_price": originalPrice,
				"deal_price":     dealPrice,
				"discount":       discount,
				"deal_date":      dealDate,
				"product": map[string]interface{}{
					"id":                productID,
					"name":              name,
					"description":       description,
					"price":             dealPrice,
					"quantity_in_stock": quantityInStock,
					"category":          category,
					"image_url":         imageURL,
					"sku":               sku,
					"is_active":         isActive,
				},
			})
		}

		if deals == nil {
			deals = []map[string]interface{}{}
		}

		RespondWithJSON(w, http.StatusOK, deals)
	}
}

// CreateDealOfDayHandler creates a new deal (admin only)
func CreateDealOfDayHandler(db *sql.DB) http.HandlerFunc {
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

		var req struct {
			ProductID     int     `json:"product_id" binding:"required"`
			OriginalPrice float64 `json:"original_price" binding:"required"`
			DealPrice     float64 `json:"deal_price" binding:"required"`
			DealDate      string  `json:"deal_date" binding:"required"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		// Validate product exists
		var productExists bool
		err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM products WHERE id = $1)", req.ProductID).Scan(&productExists)
		if err != nil || !productExists {
			RespondWithError(w, http.StatusNotFound, "Product not found")
			return
		}

		// Calculate discount percentage
		discount := ((req.OriginalPrice - req.DealPrice) / req.OriginalPrice) * 100

		var dealID int
		err = db.QueryRow(`
			INSERT INTO deals_of_day (product_id, original_price, deal_price, discount, deal_date, is_active, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, TRUE, NOW(), NOW())
			RETURNING id
		`, req.ProductID, req.OriginalPrice, req.DealPrice, discount, req.DealDate).Scan(&dealID)

		if err != nil {
			log.Printf("Error creating deal: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to create deal")
			return
		}

		RespondWithJSON(w, http.StatusCreated, map[string]interface{}{
			"id":       dealID,
			"message":  "Deal created successfully",
			"discount": discount,
		})
	}
}

// UpdateDealOfDayHandler updates a deal (admin only)
func UpdateDealOfDayHandler(db *sql.DB) http.HandlerFunc {
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

		dealID, err := strconv.Atoi(strings.TrimPrefix(r.URL.Path, "/api/admin/deals/"))
		if err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid deal ID")
			return
		}

		var req struct {
			OriginalPrice float64 `json:"original_price"`
			DealPrice     float64 `json:"deal_price"`
			IsActive      *bool   `json:"is_active"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		discount := 0.0
		if req.OriginalPrice > 0 && req.DealPrice > 0 {
			discount = ((req.OriginalPrice - req.DealPrice) / req.OriginalPrice) * 100
		}

		_, err = db.Exec(`
			UPDATE deals_of_day
			SET original_price = $1, deal_price = $2, discount = $3, is_active = COALESCE($4, is_active), updated_at = NOW()
			WHERE id = $5
		`, req.OriginalPrice, req.DealPrice, discount, req.IsActive, dealID)

		if err != nil {
			log.Printf("Error updating deal: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to update deal")
			return
		}

		RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Deal updated successfully"})
	}
}

// DeleteDealOfDayHandler deletes a deal (admin only)
func DeleteDealOfDayHandler(db *sql.DB) http.HandlerFunc {
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

		dealID, err := strconv.Atoi(strings.TrimPrefix(r.URL.Path, "/api/admin/deals/"))
		if err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid deal ID")
			return
		}

		_, err = db.Exec("DELETE FROM deals_of_day WHERE id = $1", dealID)
		if err != nil {
			log.Printf("Error deleting deal: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to delete deal")
			return
		}

		RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Deal deleted successfully"})
	}
}
