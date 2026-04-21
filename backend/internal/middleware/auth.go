package middleware

import (
	"net/http"
	"strings"

	"greensupermarket/backend/internal/auth"
	"greensupermarket/backend/internal/response"
)

// AuthMiddleware validates JWT bearer tokens on protected routes.
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			response.Error(w, http.StatusUnauthorized, "Missing authorization header")
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			response.Error(w, http.StatusUnauthorized, "Invalid authorization header format")
			return
		}

		if _, err := auth.ValidateToken(parts[1]); err != nil {
			response.Error(w, http.StatusUnauthorized, "Invalid token")
			return
		}

		next.ServeHTTP(w, r)
	})
}
