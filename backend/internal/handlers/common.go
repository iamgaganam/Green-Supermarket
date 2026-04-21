package handlers

import (
	"net/http"

	"github.com/stripe/stripe-go/v75"
	"greensupermarket/backend/internal/auth"
	"greensupermarket/backend/internal/response"
	"greensupermarket/backend/internal/services"
)

func RespondWithError(w http.ResponseWriter, code int, message string) {
	response.Error(w, code, message)
}

func RespondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response.JSON(w, code, payload)
}

func GetUserIDFromRequest(r *http.Request) int {
	return auth.GetUserIDFromRequest(r)
}

func GenerateToken(userID int) (string, error) {
	return auth.GenerateToken(userID)
}

func HashPassword(password string) (string, error) {
	return auth.HashPassword(password)
}

func VerifyPassword(hash, password string) error {
	return auth.VerifyPassword(hash, password)
}

func GetPaymentStatus(pi *stripe.PaymentIntent) string {
	return services.GetPaymentStatus(pi)
}
