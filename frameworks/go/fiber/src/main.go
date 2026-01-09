package main

import (
	"github.com/gofiber/fiber/v2"
)

func main() {
	app := fiber.New(fiber.Config{
		DisableStartupMessage: true,
	})

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendStatus(200)
	})

	app.Get("/plaintext", func(c *fiber.Ctx) error {
		c.Set("Content-Type", "text/plain; charset=utf-8")
		return c.SendString("OK")
	})

	app.Get("/json", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "OK"})
	})

	app.Listen(":8080")
}
