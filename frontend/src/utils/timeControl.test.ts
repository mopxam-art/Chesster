import { describe, expect, it } from "vitest";
import { getTimeCategory, isValidTimeControl, formatTime } from "./timeControl";

describe("time controls", () => {
  it("classifies custom controls using the FIDE formula", () => {
    expect(getTimeCategory(2, 0)).toBe("Bullet");
    expect(getTimeCategory(3, 0)).toBe("Blitz");
    expect(getTimeCategory(10, 0)).toBe("Rapid");
    expect(getTimeCategory(60, 0)).toBe("Classical");
  });

  it("validates the supported slider ranges", () => {
    expect(isValidTimeControl(1, 0)).toBe(true);
    expect(isValidTimeControl(60, 30)).toBe(true);
    expect(isValidTimeControl(0, 0)).toBe(false);
    expect(isValidTimeControl(10, 31)).toBe(false);
  });

  describe("formatTime helper", () => {
    it("formats tenths of a second when ms < 10000", () => {
      expect(formatTime(8400)).toBe("0:08.4");
      expect(formatTime(9900)).toBe("0:09.9");
      expect(formatTime(1500)).toBe("0:01.5");
      expect(formatTime(200)).toBe("0:00.2");
      expect(formatTime(0)).toBe("0:00.0");
    });

    it("formats standard MM:SS when ms >= 10000", () => {
      expect(formatTime(10000)).toBe("0:10");
      expect(formatTime(15000)).toBe("0:15");
      expect(formatTime(65000)).toBe("1:05");
      expect(formatTime(300000)).toBe("5:00");
    });

    it("clamps negative values to 0:00.0", () => {
      expect(formatTime(-500)).toBe("0:00.0");
      expect(formatTime(-10000)).toBe("0:00.0");
    });

    it("safely handles non-finite inputs", () => {
      expect(formatTime(NaN)).toBe("0:00.0");
      expect(formatTime(Infinity)).toBe("0:00.0");
    });
  });
});

