package services

import (
	"fmt"
	"log"
	"os"

	"gopkg.in/mail.v2"
)

// EmailService handles sending emails
type EmailService struct {
	dialer *mail.Dialer
	from   string
}

// NewEmailService creates a new email service
func NewEmailService() *EmailService {
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPassword := os.Getenv("SMTP_PASSWORD")
	fromEmail := os.Getenv("FROM_EMAIL")

	if smtpHost == "" {
		smtpHost = "smtp.gmail.com"
	}
	if smtpPort == "" {
		smtpPort = "587"
	}
	if fromEmail == "" {
		fromEmail = smtpUser
	}

	// Parse port
	port := 587
	if smtpPort == "465" {
		port = 465
	}

	dialer := mail.NewDialer(smtpHost, port, smtpUser, smtpPassword)

	return &EmailService{
		dialer: dialer,
		from:   fromEmail,
	}
}

// SendOrderConfirmation sends order confirmation email
func (es *EmailService) SendOrderConfirmation(to, orderNumber string, amount float64) error {
	subject := fmt.Sprintf("Order Confirmation - %s", orderNumber)
	body := fmt.Sprintf(`
	<h2>Order Confirmation</h2>
	<p>Your order <strong>%s</strong> has been confirmed.</p>
	<p>Total Amount: <strong>$%.2f</strong></p>
	<p>Thank you for shopping with GREEN Supermarket!</p>
	`, orderNumber, amount)

	return es.sendEmail(to, subject, body)
}

// SendOrderCancellation sends order cancellation email
func (es *EmailService) SendOrderCancellation(to, orderNumber string) error {
	subject := fmt.Sprintf("Order Cancelled - %s", orderNumber)
	body := fmt.Sprintf(`
	<h2>Order Cancellation</h2>
	<p>Your order <strong>%s</strong> has been cancelled.</p>
	<p>If you have any questions, please contact our support team.</p>
	`, orderNumber)

	return es.sendEmail(to, subject, body)
}

// SendPaymentConfirmation sends payment confirmation email
func (es *EmailService) SendPaymentConfirmation(to, orderNumber string, amount float64) error {
	subject := fmt.Sprintf("Payment Received - %s", orderNumber)
	body := fmt.Sprintf(`
	<h2>Payment Confirmation</h2>
	<p>We have received your payment of <strong>$%.2f</strong> for order <strong>%s</strong>.</p>
	<p>Your order is being processed and will be shipped soon.</p>
	`, amount, orderNumber)

	return es.sendEmail(to, subject, body)
}

// SendShippingNotification sends shipping notification email
func (es *EmailService) SendShippingNotification(to, orderNumber, trackingNumber string) error {
	subject := fmt.Sprintf("Order Shipped - %s", orderNumber)
	body := fmt.Sprintf(`
	<h2>Order Shipped</h2>
	<p>Your order <strong>%s</strong> has been shipped!</p>
	<p>Tracking Number: <strong>%s</strong></p>
	<p>You can track your package using the tracking number above.</p>
	`, orderNumber, trackingNumber)

	return es.sendEmail(to, subject, body)
}

// SendWelcomeEmail sends welcome email to new user
func (es *EmailService) SendWelcomeEmail(to, firstName string) error {
	subject := "Welcome to GREEN Supermarket!"
	body := fmt.Sprintf(`
	<h2>Welcome, %s!</h2>
	<p>Thank you for creating an account with GREEN Supermarket.</p>
	<p>You can now start shopping and enjoy our wide range of products.</p>
	<p>Happy shopping!</p>
	`, firstName)

	return es.sendEmail(to, subject, body)
}

// sendEmail is the internal method to send emails
func (es *EmailService) sendEmail(to, subject, htmlBody string) error {
	m := mail.NewMessage()
	m.SetHeader("From", es.from)
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", htmlBody)

	if err := es.dialer.DialAndSend(m); err != nil {
		log.Printf("Failed to send email to %s: %v", to, err)
		return err
	}

	log.Printf("Email sent successfully to %s", to)
	return nil
}

// SendEmailAsync sends email asynchronously
func (es *EmailService) SendEmailAsync(to, subject, htmlBody string) {
	go func() {
		if err := es.sendEmail(to, subject, htmlBody); err != nil {
			log.Printf("Error sending email: %v", err)
		}
	}()
}
