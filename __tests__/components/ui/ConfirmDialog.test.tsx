import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const defaultProps = {
  isOpen: true,
  title: "Google Maps で開きますか？",
  message: "このルートを Google Maps アプリで開きます。",
  confirmLabel: "開く",
  cancelLabel: "キャンセル",
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ConfirmDialog", () => {
  describe("isOpen = false のとき", () => {
    it("何もレンダリングしない（null を返す）", () => {
      // Given: ダイアログが閉じている
      const { container } = render(
        <ConfirmDialog {...defaultProps} isOpen={false} />
      );
      // Then: DOM に何も描画されない
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("isOpen = true のとき", () => {
    it("ダイアログがレンダリングされる", () => {
      // Given
      // When
      render(<ConfirmDialog {...defaultProps} />);
      // Then: role="dialog" が存在する
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("aria-modal='true' が設定されている", () => {
      // Given
      // When
      render(<ConfirmDialog {...defaultProps} />);
      // Then: アクセシビリティ属性
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("title が表示される", () => {
      // Given
      // When
      render(<ConfirmDialog {...defaultProps} />);
      // Then
      expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    });

    it("message が表示される", () => {
      // Given
      // When
      render(<ConfirmDialog {...defaultProps} />);
      // Then
      expect(screen.getByText(defaultProps.message)).toBeInTheDocument();
    });

    it("confirmLabel のボタンが表示される", () => {
      // Given
      // When
      render(<ConfirmDialog {...defaultProps} />);
      // Then
      expect(screen.getByRole("button", { name: defaultProps.confirmLabel })).toBeInTheDocument();
    });

    it("cancelLabel のボタンが表示される", () => {
      // Given
      // When
      render(<ConfirmDialog {...defaultProps} />);
      // Then
      expect(screen.getByRole("button", { name: defaultProps.cancelLabel })).toBeInTheDocument();
    });
  });

  describe("ユーザー操作", () => {
    it("確認ボタンをクリックすると onConfirm が呼ばれる", async () => {
      // Given
      const user = userEvent.setup();
      render(<ConfirmDialog {...defaultProps} />);
      // When
      await user.click(screen.getByRole("button", { name: defaultProps.confirmLabel }));
      // Then
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
      expect(defaultProps.onCancel).not.toHaveBeenCalled();
    });

    it("キャンセルボタンをクリックすると onCancel が呼ばれる", async () => {
      // Given
      const user = userEvent.setup();
      render(<ConfirmDialog {...defaultProps} />);
      // When
      await user.click(screen.getByRole("button", { name: defaultProps.cancelLabel }));
      // Then
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });
  });

  describe("props の組み合わせ", () => {
    it("任意の title・message・ラベルを表示できる", () => {
      // Given: 別のコンテンツ
      const customProps = {
        ...defaultProps,
        title: "別のタイトル",
        message: "別のメッセージ",
        confirmLabel: "はい",
        cancelLabel: "いいえ",
      };
      // When
      render(<ConfirmDialog {...customProps} />);
      // Then
      expect(screen.getByText("別のタイトル")).toBeInTheDocument();
      expect(screen.getByText("別のメッセージ")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "はい" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "いいえ" })).toBeInTheDocument();
    });
  });
});
