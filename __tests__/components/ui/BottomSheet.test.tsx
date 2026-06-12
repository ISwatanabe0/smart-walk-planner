import { render, screen, fireEvent } from "@testing-library/react";
import { BottomSheet } from "@/components/ui/BottomSheet";

// jsdom には PointerEvent が無く fireEvent.pointerXxx だと clientY が欠落するため、
// clientY を保持できる MouseEvent でポインターイベントを発火する
function firePointer(
  element: Element,
  type: "pointerdown" | "pointermove" | "pointerup",
  clientY: number
) {
  fireEvent(element, new MouseEvent(type, { bubbles: true, clientY }));
}

describe("BottomSheet", () => {
  it("子要素を表示する", () => {
    render(
      <BottomSheet>
        <p>パネルの中身</p>
      </BottomSheet>
    );
    expect(screen.getByText("パネルの中身")).toBeInTheDocument();
  });

  it("初期状態は折りたたみ（aria-expanded=false）", () => {
    render(
      <BottomSheet>
        <p>content</p>
      </BottomSheet>
    );
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("つまみをタップすると展開される", () => {
    render(
      <BottomSheet>
        <p>content</p>
      </BottomSheet>
    );
    const handle = screen.getByRole("button");
    // ほぼ動かないポインター操作＝タップ
    firePointer(handle, "pointerdown", 300);
    firePointer(handle, "pointerup", 300);
    expect(handle).toHaveAttribute("aria-expanded", "true");
  });

  it("展開中につまみをタップすると折りたたまれる", () => {
    render(
      <BottomSheet>
        <p>content</p>
      </BottomSheet>
    );
    const handle = screen.getByRole("button");
    firePointer(handle, "pointerdown", 300);
    firePointer(handle, "pointerup", 300);
    firePointer(handle, "pointerdown", 300);
    firePointer(handle, "pointerup", 300);
    expect(handle).toHaveAttribute("aria-expanded", "false");
  });

  it("上に大きくスワイプすると展開される", () => {
    render(
      <BottomSheet>
        <p>content</p>
      </BottomSheet>
    );
    const handle = screen.getByRole("button");
    firePointer(handle, "pointerdown", 500);
    firePointer(handle, "pointermove", 380);
    firePointer(handle, "pointerup", 380);
    expect(handle).toHaveAttribute("aria-expanded", "true");
  });

  it("展開中に下へ大きくスワイプすると折りたたまれる", () => {
    render(
      <BottomSheet>
        <p>content</p>
      </BottomSheet>
    );
    const handle = screen.getByRole("button");
    // まず展開
    firePointer(handle, "pointerdown", 300);
    firePointer(handle, "pointerup", 300);
    // 下へスワイプ
    firePointer(handle, "pointerdown", 200);
    firePointer(handle, "pointermove", 340);
    firePointer(handle, "pointerup", 340);
    expect(handle).toHaveAttribute("aria-expanded", "false");
  });

  it("小さな上スワイプ（しきい値未満）では展開されない", () => {
    render(
      <BottomSheet>
        <p>content</p>
      </BottomSheet>
    );
    const handle = screen.getByRole("button");
    firePointer(handle, "pointerdown", 500);
    firePointer(handle, "pointermove", 470);
    firePointer(handle, "pointerup", 470);
    expect(handle).toHaveAttribute("aria-expanded", "false");
  });
});
