package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

// GetProductsHandler gets all products with filtering
func GetProductsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		category := r.URL.Query().Get("category")
		limit := r.URL.Query().Get("limit")
		offset := r.URL.Query().Get("offset")

		if limit == "" {
			limit = "50"
		}
		if offset == "" {
			offset = "0"
		}

		query := "SELECT id, name, description, price, quantity_in_stock, category, image_url, sku, is_active, created_at, updated_at FROM products WHERE is_active = TRUE"
		args := []interface{}{}

		if category != "" {
			query += " AND category = $1"
			args = append(args, category)
			query += " LIMIT $2 OFFSET $3"
		} else {
			query += " LIMIT $1 OFFSET $2"
		}

		limitInt, _ := strconv.Atoi(limit)
		offsetInt, _ := strconv.Atoi(offset)
		args = append(args, limitInt, offsetInt)

		rows, err := db.Query(query, args...)
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch products")
			return
		}
		defer rows.Close()

		var products []Product
		for rows.Next() {
			var product Product
			var imageURL sql.NullString
			var description sql.NullString

			if err := rows.Scan(&product.ID, &product.Name, &description, &product.Price, &product.QuantityInStock, &product.Category, &imageURL, &product.SKU, &product.IsActive, &product.CreatedAt, &product.UpdatedAt); err != nil {
				continue
			}

			// Handle nullable fields
			if description.Valid {
				product.Description = &description.String
			}
			if imageURL.Valid {
				product.ImageURL = &imageURL.String
			}

			products = append(products, product)
		}

		if products == nil {
			products = []Product{}
		}

		RespondWithJSON(w, http.StatusOK, products)
	}
}

// GetProductHandler gets a specific product
func GetProductHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := strings.TrimPrefix(r.URL.Path, "/api/products/")
		idStr = strings.Split(idStr, "/")[0]
		id, _ := strconv.Atoi(idStr)

		var product Product
		var imageURL sql.NullString
		var description sql.NullString

		err := db.QueryRow(
			"SELECT id, name, description, price, quantity_in_stock, category, image_url, sku, is_active, created_at, updated_at FROM products WHERE id = $1",
			id,
		).Scan(&product.ID, &product.Name, &description, &product.Price, &product.QuantityInStock, &product.Category, &imageURL, &product.SKU, &product.IsActive, &product.CreatedAt, &product.UpdatedAt)

		if err == sql.ErrNoRows {
			RespondWithError(w, http.StatusNotFound, "Product not found")
			return
		}
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Database error")
			return
		}

		// Handle nullable fields
		if description.Valid {
			product.Description = &description.String
		}
		if imageURL.Valid {
			product.ImageURL = &imageURL.String
		}

		RespondWithJSON(w, http.StatusOK, product)
	}
}

// CreateProductHandler creates a new product (admin only)
func CreateProductHandler(db *sql.DB) http.HandlerFunc {
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
		db.QueryRow("SELECT is_admin FROM users WHERE id = $1", userID).Scan(&isAdmin)
		if !isAdmin {
			RespondWithError(w, http.StatusForbidden, "Admin access required")
			return
		}

		var product Product
		if err := json.NewDecoder(r.Body).Decode(&product); err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		var id int
		err := db.QueryRow(
			"INSERT INTO products (name, description, price, quantity_in_stock, category, image_url, sku) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
			product.Name, product.Description, product.Price, product.QuantityInStock, product.Category, product.ImageURL, product.SKU,
		).Scan(&id)

		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to create product")
			return
		}

		product.ID = id
		RespondWithJSON(w, http.StatusCreated, product)
	}
}

// UpdateProductHandler updates a product (admin only)
func UpdateProductHandler(db *sql.DB) http.HandlerFunc {
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
		db.QueryRow("SELECT is_admin FROM users WHERE id = $1", userID).Scan(&isAdmin)
		if !isAdmin {
			RespondWithError(w, http.StatusForbidden, "Admin access required")
			return
		}

		idStr := strings.TrimPrefix(r.URL.Path, "/api/products/")
		idStr = strings.Split(idStr, "/")[0]
		id, _ := strconv.Atoi(idStr)

		var product Product
		if err := json.NewDecoder(r.Body).Decode(&product); err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		_, err := db.Exec(
			"UPDATE products SET name = $1, description = $2, price = $3, quantity_in_stock = $4, category = $5, image_url = $6, is_active = $7, updated_at = NOW() WHERE id = $8",
			product.Name, product.Description, product.Price, product.QuantityInStock, product.Category, product.ImageURL, product.IsActive, id,
		)

		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to update product")
			return
		}

		RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Product updated successfully"})
	}
}

// GetCategoriesHandler gets all categories
func GetCategoriesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := db.Query("SELECT DISTINCT category FROM products WHERE is_active = TRUE ORDER BY category")
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch categories")
			return
		}
		defer rows.Close()

		var categories []string
		for rows.Next() {
			var category string
			if err := rows.Scan(&category); err != nil {
				continue
			}
			categories = append(categories, category)
		}

		if categories == nil {
			categories = []string{}
		}

		RespondWithJSON(w, http.StatusOK, categories)
	}
}
