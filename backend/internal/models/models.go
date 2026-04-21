package models

import "time"

// User represents a user in the system
type User struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Phone     string    `json:"phone"`
	Address   string    `json:"address"`
	City      string    `json:"city"`
	State     string    `json:"state"`
	ZipCode   string    `json:"zip_code"`
	Country   string    `json:"country"`
	IsAdmin   bool      `json:"is_admin"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Product represents a product in the catalog
type Product struct {
	ID              int       `json:"id"`
	Name            string    `json:"name"`
	Description     *string   `json:"description"`
	Price           float64   `json:"price"`
	QuantityInStock int       `json:"quantity_in_stock"`
	Category        *string   `json:"category"`
	ImageURL        *string   `json:"image_url"`
	SKU             *string   `json:"sku"`
	IsActive        bool      `json:"is_active"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// ShoppingCart represents a user's shopping cart
type ShoppingCart struct {
	ID        int        `json:"id"`
	UserID    int        `json:"user_id"`
	IsActive  bool       `json:"is_active"`
	Items     []CartItem `json:"items"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

// CartItem represents an item in the shopping cart
type CartItem struct {
	ID              int       `json:"id"`
	CartID          int       `json:"cart_id"`
	ProductID       int       `json:"product_id"`
	Product         *Product  `json:"product,omitempty"`
	Quantity        int       `json:"quantity"`
	PriceAtAddition float64   `json:"price_at_addition"`
	CreatedAt       time.Time `json:"created_at"`
}

// Order represents a customer order
type Order struct {
	ID              int         `json:"id"`
	OrderNumber     string      `json:"order_number"`
	UserID          int         `json:"user_id"`
	TotalAmount     float64     `json:"total_amount"`
	Status          string      `json:"status"`
	PaymentStatus   string      `json:"payment_status"`
	PaymentMethod   string      `json:"payment_method"`
	StripePaymentID string      `json:"stripe_payment_id"`
	ShippingAddress string      `json:"shipping_address"`
	Notes           string      `json:"notes"`
	Items           []OrderItem `json:"items,omitempty"`
	CreatedAt       time.Time   `json:"created_at"`
	UpdatedAt       time.Time   `json:"updated_at"`
}

// OrderItem represents a product in an order
type OrderItem struct {
	ID        int       `json:"id"`
	OrderID   int       `json:"order_id"`
	ProductID int       `json:"product_id"`
	Product   *Product  `json:"product,omitempty"`
	Quantity  int       `json:"quantity"`
	Price     float64   `json:"price"`
	CreatedAt time.Time `json:"created_at"`
}

// Feedback represents customer feedback
type Feedback struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	OrderID   *int      `json:"order_id"`
	ProductID *int      `json:"product_id"`
	Rating    int       `json:"rating"`
	Title     string    `json:"title"`
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// EmailLog represents email communication logs
type EmailLog struct {
	ID           int        `json:"id"`
	UserID       int        `json:"user_id"`
	EmailAddress string     `json:"email_address"`
	Subject      string     `json:"subject"`
	EmailType    string     `json:"email_type"`
	Status       string     `json:"status"`
	SentAt       *time.Time `json:"sent_at"`
	CreatedAt    time.Time  `json:"created_at"`
}

// RegisterRequest represents user registration request
type RegisterRequest struct {
	Email     string `json:"email" binding:"required"`
	Password  string `json:"password" binding:"required"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

// LoginRequest represents user login request
type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse represents authentication response
type AuthResponse struct {
	Token string `json:"token"`
	User  *User  `json:"user"`
}

// CartItemRequest represents adding item to cart
type CartItemRequest struct {
	ProductID int `json:"product_id" binding:"required"`
	Quantity  int `json:"quantity" binding:"required"`
}

// CreateOrderRequest represents creating an order
type CreateOrderRequest struct {
	ShippingAddress string `json:"shipping_address" binding:"required"`
	Notes           string `json:"notes"`
}

// FeedbackRequest represents creating feedback
type FeedbackRequest struct {
	OrderID   *int   `json:"order_id"`
	ProductID *int   `json:"product_id"`
	Rating    int    `json:"rating" binding:"required"`
	Title     string `json:"title" binding:"required"`
	Comment   string `json:"comment"`
}

// PaymentRequest represents payment request
type PaymentRequest struct {
	Amount      float64 `json:"amount" binding:"required"`
	Currency    string  `json:"currency" binding:"required"`
	Description string  `json:"description"`
	OrderID     int     `json:"order_id" binding:"required"`
}

// PaymentResponse represents payment response
type PaymentResponse struct {
	ClientSecret string `json:"client_secret"`
	PaymentID    string `json:"payment_id"`
}

// Subscriber represents email subscriber
type Subscriber struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

// GeneralFeedback represents general website feedback
type GeneralFeedback struct {
	ID        int       `json:"id"`
	UserID    *int      `json:"user_id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	Message   string    `json:"message"`
	Rating    int       `json:"rating"`
	CreatedAt time.Time `json:"created_at"`
}

// GeneralFeedbackRequest represents general feedback request
type GeneralFeedbackRequest struct {
	Email   string `json:"email" binding:"required"`
	Name    string `json:"name" binding:"required"`
	Message string `json:"message" binding:"required"`
	Rating  int    `json:"rating" binding:"required"`
}

// Wishlist represents a user's wishlist
type Wishlist struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	ProductID int       `json:"product_id"`
	Product   *Product  `json:"product,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// DiscountCode represents a discount code
type DiscountCode struct {
	ID            int        `json:"id"`
	Code          string     `json:"code"`
	Description   *string    `json:"description"`
	DiscountType  string     `json:"discount_type"` // "percentage" or "fixed"
	DiscountValue float64    `json:"discount_value"`
	MaxUses       *int       `json:"max_uses"`
	UsedCount     int        `json:"used_count"`
	MinOrderValue *float64   `json:"min_order_value"`
	ExpiresAt     *time.Time `json:"expires_at"`
	IsActive      bool       `json:"is_active"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

// DealOfDay represents today's special deals
type DealOfDay struct {
	ID            int       `json:"id"`
	ProductID     int       `json:"product_id"`
	Product       *Product  `json:"product,omitempty"`
	OriginalPrice float64   `json:"original_price"`
	DealPrice     float64   `json:"deal_price"`
	Discount      float64   `json:"discount"` // percentage
	DealDate      time.Time `json:"deal_date"`
	IsActive      bool      `json:"is_active"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// ProductRecommendation represents a product recommendation for a user
type ProductRecommendation struct {
	ID         int       `json:"id"`
	UserID     int       `json:"user_id"`
	ProductID  int       `json:"product_id"`
	Product    *Product  `json:"product,omitempty"`
	ReasonType string    `json:"reason_type"` // "viewed", "similar", "popular", "trending"
	Score      float64   `json:"score"`
	CreatedAt  time.Time `json:"created_at"`
}

// AnalyticsData represents aggregated analytics
type AnalyticsData struct {
	ID                  int       `json:"id"`
	Date                time.Time `json:"date"`
	TotalOrders         int       `json:"total_orders"`
	TotalRevenue        float64   `json:"total_revenue"`
	TotalUsers          int       `json:"total_users"`
	NewUsers            int       `json:"new_users"`
	AverageOrderValue   float64   `json:"average_order_value"`
	CartAbandonmentRate float64   `json:"cart_abandonment_rate"`
	TopProduct          *string   `json:"top_product"`
	CreatedAt           time.Time `json:"created_at"`
}

// InventoryLog represents inventory changes
type InventoryLog struct {
	ID         int       `json:"id"`
	ProductID  int       `json:"product_id"`
	OldStock   int       `json:"old_stock"`
	NewStock   int       `json:"new_stock"`
	ChangeType string    `json:"change_type"` // "order", "restock", "adjustment", "damage"
	Reason     *string   `json:"reason"`
	ChangedBy  *int      `json:"changed_by"` // user ID
	CreatedAt  time.Time `json:"created_at"`
}

// DiscountCodeRequest represents discount code creation request
type DiscountCodeRequest struct {
	Code          string     `json:"code" binding:"required"`
	Description   *string    `json:"description"`
	DiscountType  string     `json:"discount_type" binding:"required"`
	DiscountValue float64    `json:"discount_value" binding:"required"`
	MaxUses       *int       `json:"max_uses"`
	MinOrderValue *float64   `json:"min_order_value"`
	ExpiresAt     *time.Time `json:"expires_at"`
}

// ValidateDiscountRequest represents discount validation request
type ValidateDiscountRequest struct {
	Code   string  `json:"code" binding:"required"`
	Amount float64 `json:"amount" binding:"required"`
}

// DealResponse represents a deal with discount percentage
type DealResponse struct {
	ID            int      `json:"id"`
	ProductID     int      `json:"product_id"`
	OriginalPrice float64  `json:"original_price"`
	DealPrice     float64  `json:"deal_price"`
	Discount      float64  `json:"discount"`
	Product       *Product `json:"product,omitempty"`
}
