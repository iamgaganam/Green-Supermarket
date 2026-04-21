package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"time"
)

// GetAnalyticsHandler retrieves analytics data (admin only)
func GetAnalyticsHandler(db *sql.DB) http.HandlerFunc {
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

		// Get analytics for the last 7 days
		rows, err := db.Query(`
			SELECT date, total_orders, total_revenue, total_users, new_users, 
				   average_order_value, cart_abandonment_rate, top_product
			FROM analytics_data
			WHERE date >= CURRENT_DATE - INTERVAL '7 days'
			ORDER BY date DESC
		`)

		if err != nil {
			log.Printf("Error fetching analytics: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch analytics")
			return
		}
		defer rows.Close()

		var analytics []map[string]interface{}
		for rows.Next() {
			var date string
			var totalOrders, totalUsers, newUsers int
			var totalRevenue, avgOrderValue, cartAbandonmentRate float64
			var topProduct *string

			if err := rows.Scan(&date, &totalOrders, &totalRevenue, &totalUsers, &newUsers,
				&avgOrderValue, &cartAbandonmentRate, &topProduct); err != nil {
				continue
			}

			analytics = append(analytics, map[string]interface{}{
				"date":                  date,
				"total_orders":          totalOrders,
				"total_revenue":         totalRevenue,
				"total_users":           totalUsers,
				"new_users":             newUsers,
				"average_order_value":   avgOrderValue,
				"cart_abandonment_rate": cartAbandonmentRate,
				"top_product":           topProduct,
			})
		}

		if analytics == nil {
			analytics = []map[string]interface{}{}
		}

		RespondWithJSON(w, http.StatusOK, analytics)
	}
}

// GetAnalyticsSummaryHandler retrieves analytics summary (admin only)
func GetAnalyticsSummaryHandler(db *sql.DB) http.HandlerFunc {
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

		var totalOrders, totalUsers, newUsersToday int
		var totalRevenue, avgOrderValue float64

		// Get today's stats
		err = db.QueryRow(`
			SELECT COALESCE(SUM(total_amount), 0) as total_revenue,
				   COUNT(DISTINCT user_id) as total_orders
			FROM orders
			WHERE DATE(created_at) = CURRENT_DATE
		`).Scan(&totalRevenue, &totalOrders)

		if err != nil {
			log.Printf("Error fetching order stats: %v", err)
		}

		// Get average order value
		if totalOrders > 0 {
			avgOrderValue = totalRevenue / float64(totalOrders)
		}

		// Get total users
		db.QueryRow("SELECT COUNT(id) FROM users WHERE is_admin = FALSE").Scan(&totalUsers)

		// Get new users today
		db.QueryRow("SELECT COUNT(id) FROM users WHERE DATE(created_at) = CURRENT_DATE AND is_admin = FALSE").Scan(&newUsersToday)

		// Get top product
		var topProduct *string
		db.QueryRow(`
			SELECT p.name
			FROM products p
			INNER JOIN order_items oi ON p.id = oi.product_id
			GROUP BY p.id
			ORDER BY SUM(oi.quantity) DESC
			LIMIT 1
		`).Scan(&topProduct)

		// Get cart abandonment rate
		var totalCarts, abandonedCarts int
		db.QueryRow("SELECT COUNT(id) FROM shopping_cart WHERE is_active = TRUE").Scan(&totalCarts)
		db.QueryRow(`
			SELECT COUNT(sc.id)
			FROM shopping_cart sc
			WHERE sc.is_active = TRUE
			AND NOT EXISTS (
				SELECT 1 FROM orders o WHERE o.user_id = sc.user_id AND DATE(o.created_at) = CURRENT_DATE
			)
		`).Scan(&abandonedCarts)

		cartAbandonmentRate := 0.0
		if totalCarts > 0 {
			cartAbandonmentRate = (float64(abandonedCarts) / float64(totalCarts)) * 100
		}

		summary := map[string]interface{}{
			"total_revenue":         totalRevenue,
			"total_orders":          totalOrders,
			"average_order_value":   avgOrderValue,
			"total_users":           totalUsers,
			"new_users_today":       newUsersToday,
			"top_product":           topProduct,
			"cart_abandonment_rate": cartAbandonmentRate,
		}

		RespondWithJSON(w, http.StatusOK, summary)
	}
}

// CreateAnalyticsSnapshotHandler creates a daily snapshot (should be called by a scheduler)
func CreateAnalyticsSnapshotHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}

		// Verify admin token (optional: could check a secret key instead)
		userID := GetUserIDFromRequest(r)
		if userID != 0 {
			var isAdmin bool
			err := db.QueryRow("SELECT is_admin FROM users WHERE id = $1", userID).Scan(&isAdmin)
			if err != nil || !isAdmin {
				RespondWithError(w, http.StatusForbidden, "Admin access required")
				return
			}
		}

		today := time.Now().Format("2006-01-02")

		var totalOrders, totalUsers, newUsers int
		var totalRevenue, avgOrderValue, cartAbandonmentRate float64
		var topProduct *string

		// Calculate metrics
		db.QueryRow(`
			SELECT COALESCE(COUNT(id), 0), COALESCE(SUM(total_amount), 0)
			FROM orders
			WHERE DATE(created_at) = $1
		`, today).Scan(&totalOrders, &totalRevenue)

		db.QueryRow(`
			SELECT COALESCE(COUNT(id), 0)
			FROM users
			WHERE is_admin = FALSE
		`).Scan(&totalUsers)

		db.QueryRow(`
			SELECT COALESCE(COUNT(id), 0)
			FROM users
			WHERE DATE(created_at) = $1 AND is_admin = FALSE
		`, today).Scan(&newUsers)

		if totalOrders > 0 {
			avgOrderValue = totalRevenue / float64(totalOrders)
		}

		db.QueryRow(`
			SELECT p.name
			FROM products p
			INNER JOIN order_items oi ON p.id = oi.product_id
			WHERE DATE(oi.created_at) = $1
			GROUP BY p.id
			ORDER BY SUM(oi.quantity) DESC
			LIMIT 1
		`, today).Scan(&topProduct)

		// Upsert analytics
		_, err := db.Exec(`
			INSERT INTO analytics_data (date, total_orders, total_revenue, total_users, new_users, average_order_value, cart_abandonment_rate, top_product)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			ON CONFLICT (date) DO UPDATE SET
				total_orders = $2,
				total_revenue = $3,
				total_users = $4,
				new_users = $5,
				average_order_value = $6,
				cart_abandonment_rate = $7,
				top_product = $8
		`, today, totalOrders, totalRevenue, totalUsers, newUsers, avgOrderValue, cartAbandonmentRate, topProduct)

		if err != nil {
			log.Printf("Error creating analytics snapshot: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Failed to create snapshot")
			return
		}

		RespondWithJSON(w, http.StatusCreated, map[string]string{
			"message": "Analytics snapshot created successfully",
			"date":    today,
		})
	}
}
