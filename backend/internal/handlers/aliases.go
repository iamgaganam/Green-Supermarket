package handlers

import (
	"greensupermarket/backend/internal/models"
	"greensupermarket/backend/internal/services"
)

type User = models.User
type Product = models.Product
type ShoppingCart = models.ShoppingCart
type CartItem = models.CartItem
type Order = models.Order
type OrderItem = models.OrderItem
type Feedback = models.Feedback
type Subscriber = models.Subscriber
type GeneralFeedback = models.GeneralFeedback

type RegisterRequest = models.RegisterRequest
type LoginRequest = models.LoginRequest
type AuthResponse = models.AuthResponse
type CartItemRequest = models.CartItemRequest
type CreateOrderRequest = models.CreateOrderRequest
type FeedbackRequest = models.FeedbackRequest
type PaymentRequest = models.PaymentRequest
type PaymentResponse = models.PaymentResponse
type GeneralFeedbackRequest = models.GeneralFeedbackRequest
type DiscountCodeRequest = models.DiscountCodeRequest
type ValidateDiscountRequest = models.ValidateDiscountRequest

type EmailService = services.EmailService
type PaymentService = services.PaymentService
