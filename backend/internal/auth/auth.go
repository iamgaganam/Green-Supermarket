package auth

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func jwtSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "your-secret-key-change-in-production"
	}

	return []byte(secret)
}

// GenerateToken generates a JWT token
func GenerateToken(userID int) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(),
	})

	return token.SignedString(jwtSecret())
}

// ValidateToken validates a JWT token and returns user ID
func ValidateToken(tokenString string) (int, error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwt.MapClaims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret(), nil
	})

	if err != nil {
		return 0, err
	}

	claims, ok := token.Claims.(*jwt.MapClaims)
	if !ok || !token.Valid {
		return 0, jwt.ErrSignatureInvalid
	}

	userID := int((*claims)["user_id"].(float64))
	return userID, nil
}

// HashPassword hashes a password
func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hash), err
}

// VerifyPassword verifies a password against a hash
func VerifyPassword(hash, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

// GetUserIDFromRequest extracts user ID from request
func GetUserIDFromRequest(r *http.Request) int {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return 0
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 {
		return 0
	}

	userID, err := ValidateToken(parts[1])
	if err != nil {
		return 0
	}

	return userID
}
