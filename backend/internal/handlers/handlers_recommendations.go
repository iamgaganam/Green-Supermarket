package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"
)

// GetRecommendationsHandler retrieves product recommendations for a user
func GetRecommendationsHandler(db *sql.DB) http.HandlerFunc {
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

		limit := 10
		if l := r.URL.Query().Get("limit"); l != "" {
			if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 50 {
				limit = parsed
			}
		}

		// Get recommendations based on user's viewing history and similar categories
		rows, err := db.Query(`
			SELECT DISTINCT p.id, p.name, p.description, p.price, p.quantity_in_stock,
				   p.category, p.image_url, p.sku, p.is_active, p.created_at, p.updated_at
			FROM product_recommendations pr
			INNER JOIN products p ON pr.product_id = p.id
			WHERE pr.user_id = $1
			ORDER BY pr.score DESC
			LIMIT $2
		`, userID, limit)

		if err != nil {
			log.Printf("Error fetching recommendations: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch recommendations")
			return
		}
		defer rows.Close()

		var recommendations []map[string]interface{}
		for rows.Next() {
			var id int
			var name, category, imageURL, sku string
			var description string
			var descriptionPtr *string
			var price float64
			var quantityInStock int
			var isActive bool
			var createdAt, updatedAt string

			if err := rows.Scan(&id, &name, &descriptionPtr, &price, &quantityInStock,
				&category, &imageURL, &sku, &isActive, &createdAt, &updatedAt); err != nil {
				continue
			}

			if descriptionPtr != nil {
				description = *descriptionPtr
			}

			recommendations = append(recommendations, map[string]interface{}{
				"id":                id,
				"name":              name,
				"description":       description,
				"price":             price,
				"quantity_in_stock": quantityInStock,
				"category":          category,
				"image_url":         imageURL,
				"sku":               sku,
				"is_active":         isActive,
				"created_at":        createdAt,
				"updated_at":        updatedAt,
			})
		}

		if recommendations == nil {
			recommendations = []map[string]interface{}{}
		}

		RespondWithJSON(w, http.StatusOK, recommendations)
	}
}

// AddViewHandler records a product view for recommendations
func AddViewHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}

		userID := GetUserIDFromRequest(r)
		if userID == 0 {
			// Allow anonymous views
			RespondWithJSON(w, http.StatusOK, map[string]string{"message": "View recorded"})
			return
		}

		productID := r.URL.Query().Get("product_id")
		if productID == "" {
			RespondWithError(w, http.StatusBadRequest, "Missing product_id parameter")
			return
		}

		// Check if product already in recommendations
		var exists bool
		err := db.QueryRow(
			"SELECT EXISTS(SELECT 1 FROM product_recommendations WHERE user_id = $1 AND product_id = $2)",
			userID, productID,
		).Scan(&exists)

		if err != nil {
			log.Printf("Error checking recommendation: %v", err)
		}

		if !exists {
			// Add new recommendation with score 1.0
			_, err := db.Exec(`
				INSERT INTO product_recommendations (user_id, product_id, reason_type, score, created_at)
				VALUES ($1, $2, 'viewed', 1.0, NOW())
			`, userID, productID)

			if err != nil {
				log.Printf("Error adding recommendation: %v", err)
			}
		} else {
			// Increase score
			_, err := db.Exec(`
				UPDATE product_recommendations
				SET score = score + 0.5
				WHERE user_id = $1 AND product_id = $2
			`, userID, productID)

			if err != nil {
				log.Printf("Error updating recommendation score: %v", err)
			}
		}

		RespondWithJSON(w, http.StatusOK, map[string]string{"message": "View recorded"})
	}
}

// GetSimilarProductsHandler gets products similar to a given product
func GetSimilarProductsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}

		productID := r.URL.Query().Get("product_id")
		if productID == "" {
			RespondWithError(w, http.StatusBadRequest, "Missing product_id parameter")
			return
		}

		limit := 5
		if l := r.URL.Query().Get("limit"); l != "" {
			if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 20 {
				limit = parsed
			}
		}

		// Get the category of the product
		var category string
		err := db.QueryRow("SELECT category FROM products WHERE id = $1", productID).Scan(&category)
		if err != nil {
			RespondWithError(w, http.StatusNotFound, "Product not found")
			return
		}

		// Get similar products
		rows, err := db.Query(`
			SELECT id, name, description, price, quantity_in_stock,
				   category, image_url, sku, is_active, created_at, updated_at
			FROM products
			WHERE category = $1 AND id != $2 AND is_active = TRUE
			ORDER BY RANDOM()
			LIMIT $3
		`, category, productID, limit)

		if err != nil {
			log.Printf("Error fetching similar products: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch similar products")
			return
		}
		defer rows.Close()

		var products []map[string]interface{}
		for rows.Next() {
			var id int
			var name, category, imageURL, sku string
			var description string
			var descriptionPtr *string
			var price float64
			var quantityInStock int
			var isActive bool
			var createdAt, updatedAt string

			if err := rows.Scan(&id, &name, &descriptionPtr, &price, &quantityInStock,
				&category, &imageURL, &sku, &isActive, &createdAt, &updatedAt); err != nil {
				continue
			}

			if descriptionPtr != nil {
				description = *descriptionPtr
			}

			products = append(products, map[string]interface{}{
				"id":                id,
				"name":              name,
				"description":       description,
				"price":             price,
				"quantity_in_stock": quantityInStock,
				"category":          category,
				"image_url":         imageURL,
				"sku":               sku,
				"is_active":         isActive,
			})
		}

		if products == nil {
			products = []map[string]interface{}{}
		}

		RespondWithJSON(w, http.StatusOK, products)
	}
}

// GetTrendingProductsHandler gets trending products
func GetTrendingProductsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}

		limit := 10
		if l := r.URL.Query().Get("limit"); l != "" {
			if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 50 {
				limit = parsed
			}
		}

		// Get trending products based on orders
		rows, err := db.Query(`
			SELECT p.id, p.name, p.description, p.price, p.quantity_in_stock,
				   p.category, p.image_url, p.sku, p.is_active, p.created_at, p.updated_at,
				   COUNT(oi.id) as order_count
			FROM products p
			LEFT JOIN order_items oi ON p.id = oi.product_id
			WHERE p.is_active = TRUE
			GROUP BY p.id
			ORDER BY order_count DESC
			LIMIT $1
		`, limit)

		if err != nil {
			log.Printf("Error fetching trending products: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch trending products")
			return
		}
		defer rows.Close()

		var products []map[string]interface{}
		for rows.Next() {
			var id int
			var name, category, imageURL, sku string
			var description string
			var descriptionPtr *string
			var price float64
			var quantityInStock, orderCount int
			var isActive bool
			var createdAt, updatedAt string

			if err := rows.Scan(&id, &name, &descriptionPtr, &price, &quantityInStock,
				&category, &imageURL, &sku, &isActive, &createdAt, &updatedAt, &orderCount); err != nil {
				continue
			}

			if descriptionPtr != nil {
				description = *descriptionPtr
			}

			products = append(products, map[string]interface{}{
				"id":                id,
				"name":              name,
				"description":       description,
				"price":             price,
				"quantity_in_stock": quantityInStock,
				"category":          category,
				"image_url":         imageURL,
				"sku":               sku,
				"is_active":         isActive,
				"popularity_score":  orderCount,
			})
		}

		if products == nil {
			products = []map[string]interface{}{}
		}

		RespondWithJSON(w, http.StatusOK, products)
	}
}
