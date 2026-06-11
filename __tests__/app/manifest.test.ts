import manifest from "@/app/manifest";

describe("PWA manifest", () => {
  const result = manifest();

  it("standalone 表示で start_url がルートに設定される", () => {
    expect(result.display).toBe("standalone");
    expect(result.start_url).toBe("/");
  });

  it("short_name と theme_color が設定される", () => {
    expect(result.short_name).toBe("SmartWalk");
    expect(result.theme_color).toBe("#1a7f5a");
  });

  it("192/512 のアイコンと maskable アイコンを含む", () => {
    const icons = result.icons ?? [];
    const sizes = icons.map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    expect(icons.some((i) => i.purpose === "maskable")).toBe(true);
  });

  it("すべてのアイコンが PNG で public 配下を指す", () => {
    const icons = result.icons ?? [];
    expect(icons.length).toBeGreaterThan(0);
    icons.forEach((icon) => {
      expect(icon.type).toBe("image/png");
      expect(icon.src.startsWith("/icons/")).toBe(true);
    });
  });
});
