package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// CreateOrderHandler creates a new order from cart
func CreateOrderHandler(db *sql.DB, emailService *EmailService, paymentService *PaymentService) http.HandlerFunc {
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

		var req CreateOrderRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		// Get user email
		var userEmail string
		var firstName string
		db.QueryRow("SELECT email, first_name FROM users WHERE id = $1", userID).Scan(&userEmail, &firstName)

		// Get cart
		var cartID int
		err := db.QueryRow("SELECT id FROM shopping_carts WHERE user_id = $1 AND is_active = TRUE", userID).Scan(&cartID)
		if err != nil {
			RespondWithError(w, http.StatusNotFound, "Cart not found")
			return
		}

		// Get cart items
		rows, err := db.Query(`
			SELECT ci.product_id, ci.quantity, ci.price_at_addition
			FROM cart_items ci
			WHERE ci.cart_id = $1
		`, cartID)
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch cart items")
			return
		}
		defer rows.Close()

		var totalAmount float64 = 0
		var orderItems []struct {
			ProductID int
			Quantity  int
			Price     float64
		}

		for rows.Next() {
			var item struct {
				ProductID int
				Quantity  int
				Price     float64
			}
			if err := rows.Scan(&item.ProductID, &item.Quantity, &item.Price); err != nil {
				continue
			}
			orderItems = append(orderItems, item)
			totalAmount += item.Price * float64(item.Quantity)
		}

		if len(orderItems) == 0 {
			RespondWithError(w, http.StatusBadRequest, "Cart is empty")
			return
		}

		// Create order number
		orderNumber := fmt.Sprintf("ORD-%d-%d", userID, time.Now().Unix())

		// Start transaction
		tx, err := db.Begin()
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to start transaction")
			return
		}

		// Create order
		var orderID int
		err = tx.QueryRow(
			"INSERT INTO orders (order_number, user_id, total_amount, shipping_address, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id",
			orderNumber, userID, totalAmount, req.ShippingAddress, req.Notes,
		).Scan(&orderID)

		if err != nil {
			tx.Rollback()
			RespondWithError(w, http.StatusInternalServerError, "Failed to create order")
			return
		}

		// Add order items
		for _, item := range orderItems {
			_, err = tx.Exec(
				"INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
				orderID, item.ProductID, item.Quantity, item.Price,
			)
			if err != nil {
				tx.Rollback()
				RespondWithError(w, http.StatusInternalServerError, "Failed to create order items")
				return
			}

			// Update product quantity
			_, err = tx.Exec(
				"UPDATE products SET quantity_in_stock = quantity_in_stock - $1 WHERE id = $2",
				item.Quantity, item.ProductID,
			)
			if err != nil {
				tx.Rollback()
				RespondWithError(w, http.StatusInternalServerError, "Failed to update product quantity")
				return
			}
		}

		// Clear cart
		_, err = tx.Exec("DELETE FROM cart_items WHERE cart_id = $1", cartID)
		if err != nil {
			tx.Rollback()
			RespondWithError(w, http.StatusInternalServerError, "Failed to clear cart")
			return
		}

		tx.Commit()

		// Send order confirmation email
		if emailService != nil {
			emailService.SendEmailAsync(userEmail, fmt.Sprintf("Order Confirmation - %s", orderNumber),
				fmt.Sprintf(`<h2>Order Confirmation</h2><p>Hi %s,</p><p>Your order <strong>%s</strong> has been created.</p><p>Total Amount: <strong>$%.2f</strong></p><p>Please proceed to payment.</p>`, firstName, orderNumber, totalAmount))
		}

		RespondWithJSON(w, http.StatusCreated, map[string]interface{}{
			"order_id":     orderID,
			"order_number": orderNumber,
			"total_amount": totalAmount,
		})
	}
}

// GetOrdersHandler gets user's orders
func GetOrdersHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := GetUserIDFromRequest(r)
		if userID == 0 {
			RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		rows, err := db.Query(`
			SELECT id, order_number, total_amount, status, payment_status, created_at, updated_at
			FROM orders
			WHERE user_id = $1
			ORDER BY created_at DESC
		`, userID)

		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to fetch orders")
			return
		}
		defer rows.Close()

		var orders []Order
		for rows.Next() {
			var order Order
			if err := rows.Scan(&order.ID, &order.OrderNumber, &order.TotalAmount, &order.Status, &order.PaymentStatus, &order.CreatedAt, &order.UpdatedAt); err != nil {
				continue
			}
			orders = append(orders, order)
		}

		if orders == nil {
			orders = []Order{}
		}

		RespondWithJSON(w, http.StatusOK, orders)
	}
}

// GetOrderHandler gets a specific order
func GetOrderHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := GetUserIDFromRequest(r)
		if userID == 0 {
			RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		idStr := strings.TrimPrefix(r.URL.Path, "/api/orders/")
		idStr = strings.Split(idStr, "/")[0]
		id, _ := strconv.Atoi(idStr)

		var order Order
		err := db.QueryRow(`
			SELECT id, order_number, user_id, total_amount, status, payment_status, shipping_address, notes, created_at, updated_at
			FROM orders
			WHERE id = $1 AND user_id = $2
		`, id, userID).Scan(&order.ID, &order.OrderNumber, &order.UserID, &order.TotalAmount, &order.Status, &order.PaymentStatus, &order.ShippingAddress, &order.Notes, &order.CreatedAt, &order.UpdatedAt)

		if err == sql.ErrNoRows {
			RespondWithError(w, http.StatusNotFound, "Order not found")
			return
		}
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Database error")
			return
		}

		// Get order items
		itemRows, err := db.Query(`
			SELECT oi.id, oi.product_id, oi.quantity, oi.price, p.name, p.price, p.image_url
			FROM order_items oi
			JOIN products p ON oi.product_id = p.id
			WHERE oi.order_id = $1
		`, id)

		if err == nil {
			defer itemRows.Close()
			for itemRows.Next() {
				var item OrderItem
				var product Product
				if err := itemRows.Scan(&item.ID, &item.ProductID, &item.Quantity, &item.Price, &product.Name, &product.Price, &product.ImageURL); err != nil {
					continue
				}
				item.Product = &product
				order.Items = append(order.Items, item)
			}
		}

		RespondWithJSON(w, http.StatusOK, order)
	}
}

// CancelOrderHandler cancels an order
func CancelOrderHandler(db *sql.DB, emailService *EmailService) http.HandlerFunc {
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

		idStr := strings.TrimPrefix(r.URL.Path, "/api/orders/")
		idStr = strings.Split(idStr, "/")[0]
		idStr = strings.TrimSuffix(idStr, "/cancel")
		id, _ := strconv.Atoi(idStr)

		var order Order
		var userEmail string
		err := db.QueryRow(`
			SELECT o.id, o.user_id, o.order_number, u.email
			FROM orders o
			JOIN users u ON o.user_id = u.id
			WHERE o.id = $1
		`, id).Scan(&order.ID, &order.UserID, &order.OrderNumber, &userEmail)

		if err == sql.ErrNoRows || order.UserID != userID {
			RespondWithError(w, http.StatusNotFound, "Order not found")
			return
		}

		// Update order status
		_, err = db.Exec("UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1", id)
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to cancel order")
			return
		}

		// Send cancellation email
		if emailService != nil {
			emailService.SendEmailAsync(userEmail, fmt.Sprintf("Order Cancelled - %s", order.OrderNumber),
				fmt.Sprintf(`<h2>Order Cancellation</h2><p>Your order <strong>%s</strong> has been cancelled.</p><p>If you have any questions, please contact our support team.</p>`, order.OrderNumber))
		}

		RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Order cancelled successfully"})
	}
}
