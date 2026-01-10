package main

import (
	"strconv"

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

	app.Post("/echo", func(c *fiber.Ctx) error {
		var body map[string]interface{}
		if err := c.BodyParser(&body); err != nil {
			return c.Status(400).SendString("Invalid JSON")
		}
		return c.JSON(body)
	})

	app.Get("/search", func(c *fiber.Ctx) error {
		q := c.Query("q", "")
		limit, _ := strconv.Atoi(c.Query("limit", "0"))
		return c.JSON(fiber.Map{"query": q, "limit": limit})
	})

	app.Get("/user/:id", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"id": c.Params("id")})
	})

	app.Listen(":8080")
}
