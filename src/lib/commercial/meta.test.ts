import { describe, expect, it } from "vitest";
import {
  canIssue,
  canMarkResponse,
  canRecordSignedCopy,
  canVoid,
  isEditableStatus,
  isPrimaryCommercialType,
} from "@/lib/commercial/meta";

describe("commercial status gates", () => {
  it("only allows draft edits and issuance", () => {
    expect(isEditableStatus("draft")).toBe(true);
    expect(isEditableStatus("issued")).toBe(false);
    expect(canIssue("draft")).toBe(true);
    expect(canIssue("issued")).toBe(false);
  });

  it("gates void, response, and signed-copy actions", () => {
    expect(canVoid("issued")).toBe(true);
    expect(canVoid("draft")).toBe(false);
    expect(canMarkResponse("issued")).toBe(true);
    expect(canMarkResponse("accepted")).toBe(false);
    expect(canRecordSignedCopy("accepted")).toBe(true);
    expect(canRecordSignedCopy("void")).toBe(false);
  });

  it("detects primary commercial types", () => {
    expect(isPrimaryCommercialType("invoice")).toBe(true);
    expect(isPrimaryCommercialType("receipt")).toBe(false);
  });
});
