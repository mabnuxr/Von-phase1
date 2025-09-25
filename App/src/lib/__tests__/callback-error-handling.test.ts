import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Callback Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle HTML error responses correctly", async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      statusText: "Bad Request",
      headers: {
        get: vi.fn().mockReturnValue("text/html"),
      },
      text: vi
        .fn()
        .mockResolvedValue(
          "<html><body>Error 400: Invalid client</body></html>",
        ),
      json: vi.fn(),
    };

    const errorHandling = async (res: typeof mockResponse) => {
      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        const errorBody = contentType?.includes("application/json")
          ? await res.json().catch(() => ({ error: "Invalid JSON response" }))
          : { error: await res.text() };

        throw new Error(
          `HTTP ${res.status}: ${res.statusText}. ${JSON.stringify(errorBody)}`,
        );
      }
    };

    await expect(errorHandling(mockResponse)).rejects.toThrow(
      'HTTP 400: Bad Request. {"error":"<html><body>Error 400: Invalid client</body></html>"}',
    );
    expect(mockResponse.headers.get).toHaveBeenCalledWith("content-type");
    expect(mockResponse.text).toHaveBeenCalled();
  });

  it("should handle JSON error responses correctly", async () => {
    const mockResponse = {
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      headers: {
        get: vi.fn().mockReturnValue("application/json"),
      },
      json: vi.fn().mockResolvedValue({
        error: "invalid_grant",
        error_description: "Authorization code expired",
      }),
      text: vi.fn(),
    };

    const errorHandling = async (res: typeof mockResponse) => {
      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        const errorBody = contentType?.includes("application/json")
          ? await res.json().catch(() => ({ error: "Invalid JSON response" }))
          : { error: await res.text() };

        throw new Error(
          `HTTP ${res.status}: ${res.statusText}. ${JSON.stringify(errorBody)}`,
        );
      }
    };

    await expect(errorHandling(mockResponse)).rejects.toThrow(
      'HTTP 401: Unauthorized. {"error":"invalid_grant","error_description":"Authorization code expired"}',
    );
    expect(mockResponse.headers.get).toHaveBeenCalledWith("content-type");
    expect(mockResponse.json).toHaveBeenCalled();
    expect(mockResponse.text).not.toHaveBeenCalled();
  });

  it("should handle malformed JSON responses correctly", async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      headers: {
        get: vi.fn().mockReturnValue("application/json"),
      },
      json: vi.fn().mockRejectedValue(new Error("Unexpected token")),
      text: vi.fn(),
    };

    const errorHandling = async (res: typeof mockResponse) => {
      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        const errorBody = contentType?.includes("application/json")
          ? await res.json().catch(() => ({ error: "Invalid JSON response" }))
          : { error: await res.text() };

        throw new Error(
          `HTTP ${res.status}: ${res.statusText}. ${JSON.stringify(errorBody)}`,
        );
      }
    };

    await expect(errorHandling(mockResponse)).rejects.toThrow(
      'HTTP 500: Internal Server Error. {"error":"Invalid JSON response"}',
    );
    expect(mockResponse.json).toHaveBeenCalled();
  });

  it("should validate successful JSON response content-type", () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: {
        get: vi.fn().mockReturnValue("text/html"),
      },
    };

    const responseValidation = (res: typeof mockResponse) => {
      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error("Expected JSON response but received: " + contentType);
      }
    };

    expect(() => responseValidation(mockResponse)).toThrow(
      "Expected JSON response but received: text/html",
    );
  });

  it("should accept valid JSON response content-type", () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: {
        get: vi.fn().mockReturnValue("application/json; charset=utf-8"),
      },
    };

    const responseValidation = (res: typeof mockResponse) => {
      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error("Expected JSON response but received: " + contentType);
      }
    };

    expect(() => responseValidation(mockResponse)).not.toThrow();
  });

  it("should handle network failures gracefully", () => {
    const networkError = new Error("Failed to fetch");

    const handleNetworkError = (error: unknown) => {
      if (error instanceof Error) {
        console.error("Token exchange failed:", error);
        return error.message;
      }
      return "Unknown error";
    };

    const result = handleNetworkError(networkError);
    expect(result).toBe("Failed to fetch");
  });
});
