import {
  formatDistance,
  formatDuration,
  formatPace,
} from "@/lib/format/walk";

describe("formatDistance", () => {
  it("1000m未満はメートル表記（四捨五入）", () => {
    expect(formatDistance(0)).toBe("0m");
    expect(formatDistance(123.4)).toBe("123m");
    expect(formatDistance(999)).toBe("999m");
  });

  it("1000m以上はkm表記（小数2桁）", () => {
    expect(formatDistance(1000)).toBe("1.00km");
    expect(formatDistance(1234)).toBe("1.23km");
    expect(formatDistance(3000)).toBe("3.00km");
  });
});

describe("formatDuration", () => {
  it("1時間未満は mm:ss 形式", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(5)).toBe("00:05");
    expect(formatDuration(65)).toBe("01:05");
    expect(formatDuration(3599)).toBe("59:59");
  });

  it("1時間以上は h:mm:ss 形式", () => {
    expect(formatDuration(3600)).toBe("1:00:00");
    expect(formatDuration(3661)).toBe("1:01:01");
  });

  it("負の値は 00:00 に丸める", () => {
    expect(formatDuration(-10)).toBe("00:00");
  });
});

describe("formatPace", () => {
  it("距離が短すぎる場合は null", () => {
    expect(formatPace(0, 60)).toBeNull();
    expect(formatPace(49, 60)).toBeNull();
  });

  it("経過時間が0以下の場合は null", () => {
    expect(formatPace(1000, 0)).toBeNull();
  });

  it("分/km のペースを整形する", () => {
    // 1000mを10分（600秒） = 10'00"/km
    expect(formatPace(1000, 600)).toBe("10'00\"/km");
    // 1000mを6分30秒（390秒） = 6'30"/km
    expect(formatPace(1000, 390)).toBe("6'30\"/km");
  });
});
