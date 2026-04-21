package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	_ "github.com/lib/pq"
)

// InitDB initializes the database and runs migrations
func InitDB(dsn string) (*sql.DB, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Test the connection
	err = db.Ping()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("✓ Successfully connected to database!")

	// Run migrations
	if err := runMigrations(db); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	return db, nil
}

// runMigrations runs all migration files
func runMigrations(db *sql.DB) error {
	migrationsDir := "migrations"

	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("failed to read migrations directory: %w", err)
	}

	for _, file := range files {
		if filepath.Ext(file.Name()) == ".sql" {
			filePath := filepath.Join(migrationsDir, file.Name())
			log.Printf("Running migration: %s", file.Name())

			content, err := os.ReadFile(filePath)
			if err != nil {
				return fmt.Errorf("failed to read migration file %s: %w", filePath, err)
			}

			_, err = db.Exec(string(content))
			if err != nil {
				return fmt.Errorf("failed to execute migration %s: %w", filePath, err)
			}

			log.Printf("✓ Migration completed: %s", file.Name())
		}
	}

	return nil
}
