import { describeWeatherCode } from "@/lib/weather";

describe("describeWeatherCode", () => {
  it("returns Clear sky for code 0", () => {
    expect(describeWeatherCode(0)).toBe("Clear sky");
  });

  it("returns Thunderstorm for code 95", () => {
    expect(describeWeatherCode(95)).toBe("Thunderstorm");
  });

  it("returns Unknown for unknown code", () => {
    expect(describeWeatherCode(999)).toBe("Unknown");
  });
});
