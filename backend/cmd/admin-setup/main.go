package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

const fallbackDSN = "host=localhost port=5432 user=postgres password=zaq123 dbname=Supermarket sslmode=disable"

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run ./cmd/admin-setup <email>")
		fmt.Println("Example: go run ./cmd/admin-setup user@example.com")
		os.Exit(1)
	}

	godotenv.Load()

	email := os.Args[1]
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = fallbackDSN
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	var userID int
	var currentAdmin bool
	err = db.QueryRow("SELECT id, is_admin FROM users WHERE email = $1", email).Scan(&userID, &currentAdmin)
	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Printf("User with email %q not found\n", email)
			fmt.Println()
			fmt.Println("Existing users:")

			rows, queryErr := db.Query("SELECT id, email, first_name, is_admin FROM users")
			if queryErr != nil {
				log.Fatal("Failed to list users:", queryErr)
			}
			defer rows.Close()

			for rows.Next() {
				var id int
				var userEmail string
				var firstName string
				var isAdmin bool

				if scanErr := rows.Scan(&id, &userEmail, &firstName, &isAdmin); scanErr != nil {
					log.Fatal("Failed to scan user:", scanErr)
				}

				adminSuffix := ""
				if isAdmin {
					adminSuffix = " [ADMIN]"
				}

				fmt.Printf("  - ID: %d | Email: %s | Name: %s%s\n", id, userEmail, firstName, adminSuffix)
			}

			if rowsErr := rows.Err(); rowsErr != nil {
				log.Fatal("Failed while reading users:", rowsErr)
			}
		} else {
			log.Fatal("Database error:", err)
		}

		os.Exit(1)
	}

	_, err = db.Exec("UPDATE users SET is_admin = true WHERE email = $1", email)
	if err != nil {
		log.Fatal("Failed to update user:", err)
	}

	statusMsg := "updated"
	if currentAdmin {
		statusMsg = "already an admin"
	}

	fmt.Printf("User %q is now an admin (ID: %d) - %s\n", email, userID, statusMsg)
}
