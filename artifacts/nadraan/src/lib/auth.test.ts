import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getToken, getUser, saveAuth, clearAuth, isAuthenticated, AuthUser } from "./auth";

describe("auth localStorage wrappers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("getToken", () => {
    it("should return null if token is not set", () => {
      expect(getToken()).toBeNull();
    });

    it("should return the token if it is set", () => {
      localStorage.setItem("nadraan_token", "test-token");
      expect(getToken()).toBe("test-token");
    });
  });

  describe("getUser", () => {
    it("should return null if user is not set", () => {
      expect(getUser()).toBeNull();
    });

    it("should return null if user is invalid JSON", () => {
      localStorage.setItem("nadraan_user", "{invalid-json");
      expect(getUser()).toBeNull();
    });

    it("should return the parsed user object if set", () => {
      const user: AuthUser = { id: 1, username: "testuser", name: "Test User", role: "admin" };
      localStorage.setItem("nadraan_user", JSON.stringify(user));
      expect(getUser()).toEqual(user);
    });
  });

  describe("saveAuth", () => {
    it("should save the token and user to localStorage", () => {
      const user: AuthUser = { id: 1, username: "testuser", name: "Test User", role: "admin" };
      saveAuth("test-token", user);

      expect(localStorage.getItem("nadraan_token")).toBe("test-token");
      expect(localStorage.getItem("nadraan_user")).toBe(JSON.stringify(user));
    });
  });

  describe("clearAuth", () => {
    it("should remove the token and user from localStorage", () => {
      localStorage.setItem("nadraan_token", "test-token");
      localStorage.setItem("nadraan_user", "{}");

      clearAuth();

      expect(localStorage.getItem("nadraan_token")).toBeNull();
      expect(localStorage.getItem("nadraan_user")).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    it("should return false if token is not set", () => {
      expect(isAuthenticated()).toBe(false);
    });

    it("should return true if token is set", () => {
      localStorage.setItem("nadraan_token", "test-token");
      expect(isAuthenticated()).toBe(true);
    });
  });
});
