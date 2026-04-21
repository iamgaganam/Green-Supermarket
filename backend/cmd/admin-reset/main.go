package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

const fallbackDSN = "host=localhost port=5432 user=postgres password=zaq123 dbname=Supermarket sslmode=disable"

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run ./cmd/admin-reset <new_password>")
		fmt.Println("Example: go run ./cmd/admin-reset MyAdminPassword123")
		os.Exit(1)
	}

	godotenv.Load()

	newPassword := os.Args[1]
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Failed to hash password:", err)
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = fallbackDSN
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	email := "admin@supermarket.com"
	result, err := db.Exec(
		"UPDATE users SET password_hash = $1 WHERE email = $2",
		string(hashedPassword), email,
	)
	if err != nil {
		log.Fatal("Failed to update password:", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Fatal("Failed to get rows affected:", err)
	}

	if rowsAffected == 0 {
		fmt.Println("Admin account not found")
		os.Exit(1)
	}

	fmt.Println("Admin password updated successfully!")
	fmt.Println()
	fmt.Println("Login credentials:")
	fmt.Printf("  Email: %s\n", email)
	fmt.Printf("  Password: %s\n", newPassword)
	fmt.Println()
	fmt.Println("You can now login at http://localhost:3000/login")
}
