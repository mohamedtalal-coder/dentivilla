import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildBookingWhatsAppMessage, buildBookingWhatsAppUrl } from "../src/lib/whatsapp";

describe("WhatsApp booking message & URL generation", () => {
  it("creates a complete formatted message with all details", () => {
    const msg = buildBookingWhatsAppMessage({
      reference: "DV-ABC123",
      fullName: "Ahmed Mohamed",
      phone: "01012345678",
      whatsapp: "01098765432",
      treatmentName: "كشف واستشارة شاملة",
      startsAt: "2026-11-25T14:00:00.000Z",
      teeth: ["16", "21"],
      conditions: ["diabetes", "hypertension"],
      notes: "Tooth pain when biting",
    });

    assert.ok(msg.includes("DV-ABC123"), "Should contain reference code");
    assert.ok(msg.includes("Ahmed Mohamed"), "Should contain full name");
    assert.ok(msg.includes("01012345678"), "Should contain mobile number");
    assert.ok(msg.includes("01098765432"), "Should contain WhatsApp number");
    assert.ok(msg.includes("كشف واستشارة شاملة"), "Should contain treatment name");
    assert.ok(msg.includes("16 (Upper Right First Molar)"), "Should contain tooth 16 details");
    assert.ok(msg.includes("21 (Upper Left Central Incisor)"), "Should contain tooth 21 details");
    assert.ok(msg.includes("Diabetes"), "Should contain Diabetes condition");
    assert.ok(msg.includes("High Blood Pressure"), "Should contain Hypertension condition");
    assert.ok(msg.includes("Tooth pain when biting"), "Should contain patient notes");
    assert.ok(msg.includes("Cairo Time"), "Should indicate Cairo Time");
    assert.ok(!/\p{Extended_Pictographic}/u.test(msg), "Message should contain no emojis");
  });

  it("handles empty optional fields cleanly", () => {
    const msg = buildBookingWhatsAppMessage({
      reference: "DV-XYZ999",
      fullName: "Sara Ali",
      phone: "01123456789",
      treatmentName: "حشو تجميلي",
      startsAt: "2026-11-25T14:00:00.000Z",
    });

    assert.ok(msg.includes("DV-XYZ999"));
    assert.ok(msg.includes("Sara Ali"));
    assert.ok(msg.includes("01123456789"));
    assert.ok(!msg.includes("رقم الواتساب"), "Should not show WhatsApp line when not provided");
    assert.ok(!msg.includes("الأسنان المحددة"), "Should not show teeth line when no teeth selected");
    assert.ok(msg.includes("None / لا يوجد"), "Should display None for medical history");
    assert.ok(!msg.includes("ملاحظات"), "Should not show notes line when notes are empty");
  });

  it("builds a valid wa.me URL with encoded message parameter", () => {
    const url = buildBookingWhatsAppUrl("https://wa.me/201132081093", {
      reference: "DV-TEST01",
      fullName: "Test Patient",
      phone: "01000000000",
      treatmentName: "Veneers",
      startsAt: "2026-11-25T10:00:00.000Z",
    });

    assert.ok(url.startsWith("https://wa.me/201132081093?text="));
    const parsed = new URL(url);
    const textParam = parsed.searchParams.get("text");
    assert.ok(textParam?.includes("DV-TEST01"));
    assert.ok(textParam?.includes("Test Patient"));
  });
});
