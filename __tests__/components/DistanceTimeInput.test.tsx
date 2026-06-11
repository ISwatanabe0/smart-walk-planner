import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DistanceTimeInput } from "@/features/route-search/components/DistanceTimeInput";

function setup(distanceMeters = 3000, durationMinutes: number | null = null) {
  const onDistanceChange = jest.fn();
  const onDurationChange = jest.fn();
  render(
    <DistanceTimeInput
      distanceMeters={distanceMeters}
      durationMinutes={durationMinutes}
      onDistanceChange={onDistanceChange}
      onDurationChange={onDurationChange}
      errors={[]}
    />
  );
  return { onDistanceChange, onDurationChange };
}

describe("DistanceTimeInput", () => {
  it("距離は km 単位で表示される（3000m → 3）", () => {
    setup(3000);
    const distance = screen.getByLabelText(/距離/) as HTMLInputElement;
    expect(distance.value).toBe("3");
  });

  it("距離を空にできる（0が残らない）", async () => {
    // 「0が消えない」問題の回帰防止: clear して空文字にできること
    const user = userEvent.setup();
    const { onDistanceChange } = setup(3000);
    const distance = screen.getByLabelText(/距離/) as HTMLInputElement;
    await user.clear(distance);
    expect(distance.value).toBe("");
    // 空にしたら距離0として通知される
    expect(onDistanceChange).toHaveBeenLastCalledWith(0);
  });

  it("距離(km)を入力すると時間が自動計算される（3km→約38分）", async () => {
    const user = userEvent.setup();
    const { onDistanceChange, onDurationChange } = setup(0);
    const distance = screen.getByLabelText(/距離/) as HTMLInputElement;
    await user.type(distance, "3");
    // 3km = 3000m
    expect(onDistanceChange).toHaveBeenLastCalledWith(3000);
    // 3000 / 80 = 37.5 → 38分
    expect(onDurationChange).toHaveBeenLastCalledWith(38);
    const duration = screen.getByLabelText(/時間/) as HTMLInputElement;
    expect(duration.value).toBe("38");
  });

  it("時間だけ入力しても距離が自動計算されてルート作成できる（40分→3.2km）", async () => {
    const user = userEvent.setup();
    const { onDistanceChange, onDurationChange } = setup(0);
    const duration = screen.getByLabelText(/時間/) as HTMLInputElement;
    await user.type(duration, "40");
    // 40分 × 80m/分 = 3200m
    expect(onDistanceChange).toHaveBeenLastCalledWith(3200);
    expect(onDurationChange).toHaveBeenLastCalledWith(40);
    // 距離欄にも km 表記が反映される
    const distance = screen.getByLabelText(/距離/) as HTMLInputElement;
    expect(distance.value).toBe("3.2");
  });
});
