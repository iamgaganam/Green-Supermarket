package main

import (
	"log"
	"net/http"
	"os"

	"greensupermarket/backend/internal/database"
	"greensupermarket/backend/internal/handlers"
	"greensupermarket/backend/internal/middleware"
	"greensupermarket/backend/internal/response"
	"greensupermarket/backend/internal/services"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"

	_ "github.com/lib/pq"
)

func main() {
	// Load environment variables
	godotenv.Load()

	// Database connection string
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost port=5432 user=postgres password=zaq123 dbname=Supermarket sslmode=disable"
	}

	// Initialize database
	db, err := database.InitDB(dsn)
	if err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}
	defer db.Close()

	// Initialize services
	emailService := services.NewEmailService()
	paymentService := services.NewPaymentService()

	// Create router
	router := chi.NewRouter()

	// CORS middleware
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:3001", "*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		ExposedHeaders:   []string{"Content-Length"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Public routes
	router.Post("/api/auth/register", handlers.RegisterHandler(db, emailService))
	router.Post("/api/auth/login", handlers.LoginHandler(db))
	router.Get("/api/products", handlers.GetProductsHandler(db))
	router.Get("/api/products/{id}", handlers.GetProductHandler(db))
	router.Get("/api/products/{id}/feedback", handlers.GetProductFeedbackHandler(db))
	router.Get("/api/categories", handlers.GetCategoriesHandler(db))
	router.Get("/api/payments/public-key", handlers.GetPaymentPublicKeyHandler())

	// Protected routes - Cart
	router.With(middleware.AuthMiddleware).Get("/api/cart", handlers.GetCartHandler(db))
	router.With(middleware.AuthMiddleware).Post("/api/cart/items", handlers.AddToCartHandler(db))
	router.With(middleware.AuthMiddleware).Put("/api/cart/items/{id}", handlers.UpdateCartItemHandler(db))
	router.With(middleware.AuthMiddleware).Delete("/api/cart/items/{id}", handlers.RemoveCartItemHandler(db))
	router.With(middleware.AuthMiddleware).Delete("/api/cart/clear", handlers.ClearCartHandler(db))

	// Protected routes - Orders
	router.With(middleware.AuthMiddleware).Post("/api/orders", handlers.CreateOrderHandler(db, emailService, paymentService))
	router.With(middleware.AuthMiddleware).Get("/api/orders", handlers.GetOrdersHandler(db))
	router.With(middleware.AuthMiddleware).Get("/api/orders/{id}", handlers.GetOrderHandler(db))
	router.With(middleware.AuthMiddleware).Post("/api/orders/{id}/cancel", handlers.CancelOrderHandler(db, emailService))

	// Protected routes - Payment
	router.With(middleware.AuthMiddleware).Post("/api/payments", handlers.CreatePaymentIntentHandler(db, paymentService, emailService))
	router.With(middleware.AuthMiddleware).Post("/api/payments/confirm", handlers.ConfirmPaymentHandler(db, paymentService, emailService))
	router.With(middleware.AuthMiddleware).Get("/api/payments/{id}", handlers.GetPaymentStatusHandler(db, paymentService))

	// Protected routes - User
	router.With(middleware.AuthMiddleware).Get("/api/users/profile", handlers.GetUserHandler(db))
	router.With(middleware.AuthMiddleware).Put("/api/users/profile", handlers.UpdateUserHandler(db))
	router.With(middleware.AuthMiddleware).Delete("/api/users/profile", handlers.DeleteUserHandler(db, emailService))

	// Protected routes - Feedback
	router.With(middleware.AuthMiddleware).Post("/api/feedback", handlers.CreateFeedbackHandler(db))
	router.With(middleware.AuthMiddleware).Get("/api/feedback", handlers.GetFeedbackHandler(db))
	router.With(middleware.AuthMiddleware).Delete("/api/feedback/{id}", handlers.DeleteFeedbackHandler(db))
	router.With(middleware.AuthMiddleware).Get("/api/admin/feedback", handlers.GetAllFeedbackHandler(db))
	router.With(middleware.AuthMiddleware).Get("/api/admin/feedback/stats", handlers.GetFeedbackStatisticsHandler(db))

	// Public routes - Subscribers
	router.Post("/api/subscribers", handlers.CreateSubscriberHandler(db))

	// Protected routes - Subscribers (admin only)
	router.With(middleware.AuthMiddleware).Get("/api/admin/subscribers", handlers.GetSubscribersHandler(db))
	router.With(middleware.AuthMiddleware).Delete("/api/admin/subscribers", handlers.DeleteSubscriberHandler(db))

	// Public routes - General Feedback
	router.Post("/api/general-feedback", handlers.CreateGeneralFeedbackHandler(db))
	router.Get("/api/general-feedback", handlers.GetGeneralFeedbackHandler(db))

	// Protected routes - General Feedback
	router.With(middleware.AuthMiddleware).Get("/api/user/general-feedback", handlers.GetUserGeneralFeedbackHandler(db))
	router.With(middleware.AuthMiddleware).Get("/api/admin/general-feedback", handlers.GetAdminGeneralFeedbackHandler(db))
	router.With(middleware.AuthMiddleware).Delete("/api/general-feedback/{id}", handlers.DeleteGeneralFeedbackHandler(db))

	// Protected routes - Wishlist
	router.With(middleware.AuthMiddleware).Post("/api/wishlist", handlers.AddToWishlistHandler(db))
	router.With(middleware.AuthMiddleware).Get("/api/wishlist", handlers.GetWishlistHandler(db))
	router.With(middleware.AuthMiddleware).Delete("/api/wishlist/{id}", handlers.RemoveFromWishlistHandler(db))
	router.With(middleware.AuthMiddleware).Get("/api/wishlist/check", handlers.CheckWishlistHandler(db))
	router.With(middleware.AuthMiddleware).Delete("/api/wishlist/clear", handlers.ClearWishlistHandler(db))

	// Public routes - Deals
	router.Get("/api/deals/today", handlers.GetDealsOfDayHandler(db))
	router.Get("/api/deals/upcoming", handlers.GetUpcomingDealsHandler(db))

	// Public routes - Discount Codes
	router.Post("/api/discount/validate", handlers.ValidateDiscountCodeHandler(db))

	// Public routes - Recommendations
	router.With(middleware.AuthMiddleware).Get("/api/recommendations", handlers.GetRecommendationsHandler(db))
	router.Get("/api/products/trending", handlers.GetTrendingProductsHandler(db))
	router.Get("/api/products/similar", handlers.GetSimilarProductsHandler(db))
	router.With(middleware.AuthMiddleware).Post("/api/products/view", handlers.AddViewHandler(db))

	// Admin routes - Products
	router.With(middleware.AuthMiddleware).Post("/api/products", handlers.CreateProductHandler(db))
	router.With(middleware.AuthMiddleware).Put("/api/products/{id}", handlers.UpdateProductHandler(db))

	// Admin routes - Deals
	router.With(middleware.AuthMiddleware).Post("/api/admin/deals", handlers.CreateDealOfDayHandler(db))
	router.With(middleware.AuthMiddleware).Put("/api/admin/deals/{id}", handlers.UpdateDealOfDayHandler(db))
	router.With(middleware.AuthMiddleware).Delete("/api/admin/deals/{id}", handlers.DeleteDealOfDayHandler(db))

	// Admin routes - Discount Codes
	router.With(middleware.AuthMiddleware).Post("/api/admin/discount-codes", handlers.CreateDiscountCodeHandler(db))
	router.With(middleware.AuthMiddleware).Get("/api/admin/discount-codes", handlers.GetDiscountCodesHandler(db))
	router.With(middleware.AuthMiddleware).Put("/api/admin/discount-codes/{id}", handlers.UpdateDiscountCodeHandler(db))
	router.With(middleware.AuthMiddleware).Delete("/api/admin/discount-codes/{id}", handlers.DeleteDiscountCodeHandler(db))

	// Admin routes - Analytics
	router.With(middleware.AuthMiddleware).Get("/api/admin/analytics", handlers.GetAnalyticsHandler(db))
	router.With(middleware.AuthMiddleware).Get("/api/admin/analytics/summary", handlers.GetAnalyticsSummaryHandler(db))
	router.With(middleware.AuthMiddleware).Post("/api/admin/analytics/snapshot", handlers.CreateAnalyticsSnapshotHandler(db))

	// Admin routes - Inventory
	router.With(middleware.AuthMiddleware).Put("/api/admin/inventory/{id}", handlers.UpdateInventoryHandler(db))
	router.With(middleware.AuthMiddleware).Get("/api/admin/inventory-log", handlers.GetInventoryLogHandler(db))
	router.With(middleware.AuthMiddleware).Get("/api/admin/inventory/low-stock", handlers.GetLowStockProductsHandler(db))
	router.With(middleware.AuthMiddleware).Get("/api/admin/inventory/summary", handlers.GetInventorySummaryHandler(db))

	// Health check
	router.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		response.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("✓ Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, router); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
