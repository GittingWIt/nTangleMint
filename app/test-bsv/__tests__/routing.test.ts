import { isPublicRoute, findRoute, matchRoute, canAccessRoute, getDefaultRoute, getBasePath } from "../lib/routes"
import { MERCHANT_PATHS, PUBLIC_PATHS } from "../lib/constants"
import { describe, test, expect } from "@jest/globals"

describe("Routing Functions", () => {
  describe("isPublicRoute", () => {
    test("should return true for public routes", () => {
      PUBLIC_PATHS.forEach((path) => {
        expect(isPublicRoute(path)).toBe(true)
      })
    })

    test("should return false for non-public routes", () => {
      expect(isPublicRoute("/merchant/dashboard")).toBe(false)
      expect(isPublicRoute("/user/profile")).toBe(false)
    })
  })

  describe("findRoute", () => {
    test("should find existing routes", () => {
      expect(findRoute("/")).toBeDefined()
      expect(findRoute("/merchant/dashboard")).toBeDefined()
    })

    test("should return undefined for non-existent routes", () => {
      expect(findRoute("/non-existent")).toBeUndefined()
    })
  })

  describe("matchRoute", () => {
    test("should match exact routes", () => {
      expect(matchRoute("/merchant", "/merchant")).toBe(true)
    })

    test("should match routes with parameters", () => {
      expect(matchRoute("/merchant/:id", "/merchant/123")).toBe(true)
    })

    test("should not match different routes", () => {
      expect(matchRoute("/merchant", "/user")).toBe(false)
    })
  })

  describe("canAccessRoute", () => {
    const merchantWallet = { type: "merchant", publicAddress: "123" }
    const userWallet = { type: "user", publicAddress: "456" }

    test("should allow access to public routes", () => {
      expect(canAccessRoute("/", null)).toBe(true)
    })

    test("should allow merchant access to merchant routes", () => {
      MERCHANT_PATHS.forEach((path) => {
        expect(canAccessRoute(path, merchantWallet)).toBe(true)
      })
    })

    test("should deny user access to merchant routes", () => {
      MERCHANT_PATHS.forEach((path) => {
        expect(canAccessRoute(path, userWallet)).toBe(false)
      })
    })

    test("should deny access to authenticated routes when not logged in", () => {
      expect(canAccessRoute("/merchant/dashboard", null)).toBe(false)
    })
  })

  describe("getDefaultRoute", () => {
    test("should return wallet generation for no wallet", () => {
      expect(getDefaultRoute(null)).toBe("/wallet-generation")
    })

    test("should return merchant dashboard for merchant wallet", () => {
      expect(getDefaultRoute({ type: "merchant", publicAddress: "123" })).toBe("/merchant/dashboard")
    })

    test("should return user dashboard for user wallet", () => {
      expect(getDefaultRoute({ type: "user", publicAddress: "456" })).toBe("/user/dashboard")
    })
  })

  describe("getBasePath", () => {
    test("should return the base path", () => {
      expect(getBasePath("/merchant/dashboard")).toBe("/merchant")
      expect(getBasePath("/user/profile")).toBe("/user")
    })
  })
})