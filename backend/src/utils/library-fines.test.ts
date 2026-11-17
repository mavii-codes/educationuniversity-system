import { describe, expect, it } from "vitest";
import {
  calculateOverdueFine,
  dailyFineForBookPrice,
} from "./library-fines";

describe("library overdue fine calculations", () => {
  it("charges one twentieth of the book's price per overdue day", () => {
    expect(dailyFineForBookPrice(500)).toBe(25);
    expect(calculateOverdueFine(500, 3)).toEqual({
      dailyRate: 25,
      total: 75,
    });
  });

  it("rounds the daily rate to cents before multiplying by overdue days", () => {
    expect(calculateOverdueFine(199.99, 2)).toEqual({
      dailyRate: 10,
      total: 20,
    });
  });

  it("preserves the prior daily rate for loans predating price snapshots", () => {
    expect(calculateOverdueFine(null, 2)).toEqual({
      dailyRate: 15,
      total: 30,
    });
  });

  it("does not charge for loans returned on time", () => {
    expect(calculateOverdueFine(500, 0)).toEqual({
      dailyRate: 25,
      total: 0,
    });
  });
});
