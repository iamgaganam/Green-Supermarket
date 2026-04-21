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

type productUpdate struct {
	id          int
	name        string
	description string
	price       float64
	quantity    int
	category    string
	sku         string
}

func main() {
	godotenv.Load()

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = fallbackDSN
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	updates := []productUpdate{
		{
			id:          2,
			name:        "Organic Broccoli",
			description: "Fresh organic broccoli heads, locally grown",
			price:       4.5,
			quantity:    65,
			category:    "Vegetables",
			sku:         "SKU-002",
		},
		{
			id:          3,
			name:        "Red Apples",
			description: "Crisp red apples with natural sweetness",
			price:       5.99,
			quantity:    117,
			category:    "Fruits",
			sku:         "SKU-003",
		},
	}

	for _, update := range updates {
		_, err := db.Exec(
			"UPDATE products SET name = $1, description = $2, price = $3, quantity_in_stock = $4, category = $5, sku = $6, is_active = true WHERE id = $7",
			update.name,
			update.description,
			update.price,
			update.quantity,
			update.category,
			update.sku,
			update.id,
		)

		if err != nil {
			log.Printf("Failed to update product %d: %v", update.id, err)
			continue
		}

		fmt.Printf("Restored product: %s (ID: %d)\n", update.name, update.id)
	}

	fmt.Println("Database restore complete")
}