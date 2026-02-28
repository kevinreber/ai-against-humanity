import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { randomBytes } from "crypto";
import { encrypt, decrypt } from "./encryption";

// Generate a valid 32-byte hex key for tests
const TEST_KEY = randomBytes(32).toString("hex");

describe("encryption", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = TEST_KEY;
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  // -------------------------------------------------------------------
  // Round-trip: encrypt → decrypt returns original value
  // -------------------------------------------------------------------
  describe("round-trip encrypt/decrypt", () => {
    it("recovers a typical OpenAI API key", () => {
      const apiKey = "sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx";
      expect(decrypt(encrypt(apiKey))).toBe(apiKey);
    });

    it("recovers a typical Anthropic API key", () => {
      const apiKey = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789";
      expect(decrypt(encrypt(apiKey))).toBe(apiKey);
    });

    it("handles an empty string", () => {
      expect(decrypt(encrypt(""))).toBe("");
    });

    it("handles a very long key", () => {
      const longKey = "sk-" + "a".repeat(500);
      expect(decrypt(encrypt(longKey))).toBe(longKey);
    });

    it("handles unicode characters", () => {
      const unicode = "sk-test-🔑-日本語-émojis";
      expect(decrypt(encrypt(unicode))).toBe(unicode);
    });

    it("handles special characters", () => {
      const special = "sk-test+/=&?#@!$%^*(){}[]|\\:;<>,.'\"";
      expect(decrypt(encrypt(special))).toBe(special);
    });
  });

  // -------------------------------------------------------------------
  // Each encryption produces a unique ciphertext (random IV)
  // -------------------------------------------------------------------
  describe("IV randomness", () => {
    it("produces different ciphertexts for the same plaintext", () => {
      const apiKey = "sk-proj-identical-key-value";
      const encrypted1 = encrypt(apiKey);
      const encrypted2 = encrypt(apiKey);

      // Ciphertexts must differ (random IV)
      expect(encrypted1).not.toBe(encrypted2);

      // But both must decrypt to the same value
      expect(decrypt(encrypted1)).toBe(apiKey);
      expect(decrypt(encrypted2)).toBe(apiKey);
    });
  });

  // -------------------------------------------------------------------
  // Output format validation
  // -------------------------------------------------------------------
  describe("output format", () => {
    it("produces valid base64 output", () => {
      const encrypted = encrypt("sk-test-key");
      expect(() => Buffer.from(encrypted, "base64")).not.toThrow();
      // Re-encoding should match (confirms it's clean base64)
      const buf = Buffer.from(encrypted, "base64");
      expect(buf.toString("base64")).toBe(encrypted);
    });

    it("output contains IV (12) + auth tag (16) + ciphertext bytes", () => {
      const plaintext = "sk-test-key";
      const encrypted = encrypt(plaintext);
      const packed = Buffer.from(encrypted, "base64");

      // Minimum size: 12 (IV) + 16 (auth tag) + at least 1 byte of ciphertext
      expect(packed.length).toBeGreaterThanOrEqual(12 + 16 + 1);
    });
  });

  // -------------------------------------------------------------------
  // GCM authentication: tampered data must be rejected
  // -------------------------------------------------------------------
  describe("tamper detection (GCM auth tag)", () => {
    it("rejects ciphertext with a flipped byte", () => {
      const encrypted = encrypt("sk-proj-secret-key-12345");
      const packed = Buffer.from(encrypted, "base64");

      // Flip a byte in the ciphertext region (after IV + auth tag)
      const tampered = Buffer.from(packed);
      const ciphertextOffset = 12 + 16;
      if (tampered.length > ciphertextOffset) {
        tampered[ciphertextOffset] ^= 0xff;
      }

      expect(() => decrypt(tampered.toString("base64"))).toThrow();
    });

    it("rejects a tampered auth tag", () => {
      const encrypted = encrypt("sk-proj-secret-key-12345");
      const packed = Buffer.from(encrypted, "base64");

      // Flip a byte in the auth tag region (bytes 12-27)
      const tampered = Buffer.from(packed);
      tampered[12] ^= 0xff;

      expect(() => decrypt(tampered.toString("base64"))).toThrow();
    });

    it("rejects a tampered IV", () => {
      const encrypted = encrypt("sk-proj-secret-key-12345");
      const packed = Buffer.from(encrypted, "base64");

      // Flip a byte in the IV region (bytes 0-11)
      const tampered = Buffer.from(packed);
      tampered[0] ^= 0xff;

      expect(() => decrypt(tampered.toString("base64"))).toThrow();
    });

    it("rejects truncated ciphertext", () => {
      const encrypted = encrypt("sk-proj-secret-key-12345");
      const packed = Buffer.from(encrypted, "base64");

      // Truncate: only keep IV + auth tag, drop ciphertext
      const truncated = packed.subarray(0, 12 + 16);

      expect(() => decrypt(truncated.toString("base64"))).toThrow();
    });
  });

  // -------------------------------------------------------------------
  // Missing or invalid ENCRYPTION_KEY
  // -------------------------------------------------------------------
  describe("missing ENCRYPTION_KEY", () => {
    it("throws a descriptive error when ENCRYPTION_KEY is not set (encrypt)", () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => encrypt("sk-test")).toThrow("ENCRYPTION_KEY");
    });

    it("throws a descriptive error when ENCRYPTION_KEY is not set (decrypt)", () => {
      // First encrypt with a valid key
      const encrypted = encrypt("sk-test");
      delete process.env.ENCRYPTION_KEY;
      expect(() => decrypt(encrypted)).toThrow("ENCRYPTION_KEY");
    });
  });

  // -------------------------------------------------------------------
  // Cross-key isolation: decrypting with wrong key must fail
  // -------------------------------------------------------------------
  describe("key isolation", () => {
    it("fails to decrypt with a different encryption key", () => {
      const encrypted = encrypt("sk-proj-my-secret-api-key");

      // Switch to a different key
      process.env.ENCRYPTION_KEY = randomBytes(32).toString("hex");

      expect(() => decrypt(encrypted)).toThrow();
    });
  });

  // -------------------------------------------------------------------
  // Encrypted output never contains the plaintext
  // -------------------------------------------------------------------
  describe("plaintext concealment", () => {
    it("encrypted output does not contain the plaintext", () => {
      const apiKey = "sk-proj-abc123def456ghi789";
      const encrypted = encrypt(apiKey);

      // The base64 output should not contain the raw API key
      expect(encrypted).not.toContain(apiKey);

      // Also check the raw bytes don't contain the plaintext
      const packed = Buffer.from(encrypted, "base64");
      expect(packed.toString("utf8")).not.toContain(apiKey);
    });
  });
});
