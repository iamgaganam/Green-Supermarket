package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
)

// CreatePaymentIntentHandler creates a Stripe payment intent
func CreatePaymentIntentHandler(db *sql.DB, paymentService *PaymentService, emailService *EmailService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}

		var req PaymentRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		// Get order details
		var orderNumber string
		var userEmail string
		var firstName string
		err := db.QueryRow(`
			SELECT o.order_number, u.email, u.first_name
			FROM orders o
			JOIN users u ON o.user_id = u.id
			WHERE o.id = $1
		`, req.OrderID).Scan(&orderNumber, &userEmail, &firstName)

		if err != nil {
			RespondWithError(w, http.StatusNotFound, "Order not found")
			return
		}

		// Create payment intent
		pi, err := paymentService.CreatePaymentIntent(int64(req.Amount*100), req.Currency, orderNumber, userEmail)
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to create payment intent")
			return
		}

		// Store payment ID in order
		_, err = db.Exec(
			"UPDATE orders SET stripe_payment_id = $1, payment_status = 'pending' WHERE id = $2",
			pi.ID, req.OrderID,
		)

		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to update order")
			return
		}

		RespondWithJSON(w, http.StatusOK, PaymentResponse{
			ClientSecret: pi.ClientSecret,
			PaymentID:    pi.ID,
		})
	}
}

// ConfirmPaymentHandler confirms a payment
func ConfirmPaymentHandler(db *sql.DB, paymentService *PaymentService, emailService *EmailService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}

		var req struct {
			PaymentIntentID string `json:"payment_intent_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		// Retrieve payment status from Stripe
		pi, err := paymentService.RetrievePaymentIntent(req.PaymentIntentID)
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve payment")
			return
		}

		// Get order by payment intent ID
		var orderID int
		var orderNumber string
		var userEmail string
		var amount float64
		err = db.QueryRow(`
			SELECT id, order_number, (SELECT email FROM users WHERE id = orders.user_id), total_amount
			FROM orders
			WHERE stripe_payment_id = $1
		`, req.PaymentIntentID).Scan(&orderID, &orderNumber, &userEmail, &amount)

		if err != nil {
			RespondWithError(w, http.StatusNotFound, "Order not found")
			return
		}

		paymentStatus := GetPaymentStatus(pi)
		if paymentStatus == "completed" {
			// Update order
			_, err = db.Exec(
				"UPDATE orders SET status = 'confirmed', payment_status = 'completed', updated_at = NOW() WHERE id = $1",
				orderID,
			)

			if err != nil {
				RespondWithError(w, http.StatusInternalServerError, "Failed to update order")
				return
			}

			// Send payment confirmation email
			if emailService != nil {
				emailService.SendEmailAsync(userEmail, fmt.Sprintf("Payment Confirmed - %s", orderNumber),
					fmt.Sprintf(`<h2>Payment Confirmation</h2><p>We have received your payment of <strong>$%.2f</strong> for order <strong>%s</strong>.</p><p>Your order is being processed and will be shipped soon.</p>`, amount, orderNumber))
			}
		}

		RespondWithJSON(w, http.StatusOK, map[string]interface{}{
			"status":     paymentStatus,
			"payment_id": req.PaymentIntentID,
			"order_id":   orderID,
		})
	}
}

// GetPaymentStatusHandler gets payment status
func GetPaymentStatusHandler(db *sql.DB, paymentService *PaymentService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := strings.TrimPrefix(r.URL.Path, "/api/payments/")
		idStr = strings.Split(idStr, "/")[0]

		pi, err := paymentService.RetrievePaymentIntent(idStr)
		if err != nil {
			RespondWithError(w, http.StatusNotFound, "Payment intent not found")
			return
		}

		RespondWithJSON(w, http.StatusOK, map[string]interface{}{
			"payment_id": pi.ID,
			"status":     GetPaymentStatus(pi),
			"amount":     float64(pi.Amount) / 100,
		})
	}
}

// GetPaymentPublicKeyHandler returns Stripe public key
func GetPaymentPublicKeyHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		publicKey := os.Getenv("STRIPE_PUBLIC_KEY")
		if publicKey == "" {
			publicKey = "pk_test_your_stripe_public_key" // Fallback
		}
		RespondWithJSON(w, http.StatusOK, map[string]string{
			"public_key": publicKey,
		})
	}
}
