package services

import (
	"fmt"
	"log"
	"os"

	"github.com/stripe/stripe-go/v75"
	"github.com/stripe/stripe-go/v75/paymentintent"
)

// PaymentService handles Stripe payment operations
type PaymentService struct {
	apiKey string
}

// NewPaymentService creates a new payment service
func NewPaymentService() *PaymentService {
	apiKey := os.Getenv("STRIPE_SECRET_KEY")
	if apiKey == "" {
		log.Fatal("STRIPE_SECRET_KEY environment variable not set")
	}

	stripe.Key = apiKey
	return &PaymentService{
		apiKey: apiKey,
	}
}

// CreatePaymentIntent creates a Stripe payment intent
func (ps *PaymentService) CreatePaymentIntent(amount int64, currency, orderID string, email string) (*stripe.PaymentIntent, error) {
	params := &stripe.PaymentIntentParams{
		Amount:       stripe.Int64(amount),
		Currency:     stripe.String(currency),
		Description:  stripe.String(fmt.Sprintf("Order %s", orderID)),
		ReceiptEmail: stripe.String(email),
		Metadata: map[string]string{
			"order_id": orderID,
		},
	}

	pi, err := paymentintent.New(params)
	if err != nil {
		log.Printf("Failed to create payment intent: %v", err)
		return nil, err
	}

	log.Printf("Payment intent created: %s", pi.ID)
	return pi, nil
}

// ConfirmPaymentIntent confirms a payment intent
func (ps *PaymentService) ConfirmPaymentIntent(paymentIntentID, paymentMethodID string) (*stripe.PaymentIntent, error) {
	params := &stripe.PaymentIntentConfirmParams{
		PaymentMethod: stripe.String(paymentMethodID),
	}

	pi, err := paymentintent.Confirm(paymentIntentID, params)
	if err != nil {
		log.Printf("Failed to confirm payment intent: %v", err)
		return nil, err
	}

	log.Printf("Payment intent confirmed: %s", pi.ID)
	return pi, nil
}

// RetrievePaymentIntent retrieves payment intent details
func (ps *PaymentService) RetrievePaymentIntent(paymentIntentID string) (*stripe.PaymentIntent, error) {
	pi, err := paymentintent.Get(paymentIntentID, nil)
	if err != nil {
		log.Printf("Failed to retrieve payment intent: %v", err)
		return nil, err
	}

	return pi, nil
}

// CancelPaymentIntent cancels a payment intent
func (ps *PaymentService) CancelPaymentIntent(paymentIntentID string) (*stripe.PaymentIntent, error) {
	params := &stripe.PaymentIntentCancelParams{}

	pi, err := paymentintent.Cancel(paymentIntentID, params)
	if err != nil {
		log.Printf("Failed to cancel payment intent: %v", err)
		return nil, err
	}

	log.Printf("Payment intent cancelled: %s", pi.ID)
	return pi, nil
}

// GetPaymentStatus returns the payment status
func GetPaymentStatus(pi *stripe.PaymentIntent) string {
	switch pi.Status {
	case stripe.PaymentIntentStatusSucceeded:
		return "completed"
	case stripe.PaymentIntentStatusProcessing:
		return "processing"
	case stripe.PaymentIntentStatusRequiresPaymentMethod:
		return "pending"
	case stripe.PaymentIntentStatusRequiresAction:
		return "action_required"
	case stripe.PaymentIntentStatusCanceled:
		return "cancelled"
	default:
		return "pending"
	}
}
