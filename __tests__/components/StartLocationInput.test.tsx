import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StartLocationInput } from "@/features/route-search/components/StartLocationInput";
import type { Coordinate } from "@/types/map";

// useCurrentLocation フックをモック
const mockGetCurrentLocation = jest.fn();

jest.mock("@/hooks/useCurrentLocation", () => ({
  useCurrentLocation: jest.fn(),
}));

import { useCurrentLocation } from "@/hooks/useCurrentLocation";

const mockUseCurrentLocation = useCurrentLocation as jest.MockedFunction<
  typeof useCurrentLocation
>;

const defaultMockReturn = {
  coordinate: null,
  isLocating: false,
  error: null,
  getCurrentLocation: mockGetCurrentLocation,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseCurrentLocation.mockReturnValue(defaultMockReturn);
});

describe("StartLocationInput", () => {
  const onCoordinateChange = jest.fn();

  const defaultProps = {
    coordinate: null,
    onCoordinateChange,
  };

  describe("レンダリング", () => {
    it("現在地取得ボタンが存在する", () => {
      // Given
      // When
      render(<StartLocationInput {...defaultProps} />);
      // Then
      const gpsButton = screen.getByRole("button", { name: /現在地/i });
      expect(gpsButton).toBeInTheDocument();
    });

    it("緯度・経度の数値入力欄は表示されない", () => {
      // Given: 座標はユーザーに見せない仕様
      // When
      render(<StartLocationInput {...defaultProps} />);
      // Then
      expect(screen.queryByLabelText(/緯度|lat/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/経度|lng/i)).not.toBeInTheDocument();
    });

    it("地図タップで出発地点を選べる案内が表示される", () => {
      // Given
      // When
      render(<StartLocationInput {...defaultProps} />);
      // Then
      expect(screen.getByText(/地図をタップ/)).toBeInTheDocument();
    });

    it("coordinate が null のとき未設定の案内が表示される", () => {
      // Given: 座標未設定
      // When
      render(<StartLocationInput {...defaultProps} coordinate={null} />);
      // Then
      expect(screen.getByText(/まだ設定されていません/)).toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("coordinate が設定されているとき設定済みステータスが表示される", () => {
      // Given: 座標設定済み
      const coordinate: Coordinate = { lat: 35.6812, lng: 139.7671 };
      // When
      render(<StartLocationInput {...defaultProps} coordinate={coordinate} />);
      // Then
      expect(screen.getByRole("status")).toHaveTextContent(/出発地点を設定しました/);
    });

    it("coordinate が設定されていても生の緯度経度の数値は表示されない", () => {
      // Given: 座標設定済み
      const coordinate: Coordinate = { lat: 35.6812, lng: 139.7671 };
      // When
      render(<StartLocationInput {...defaultProps} coordinate={coordinate} />);
      // Then: 座標値そのものは画面に出さない
      expect(screen.queryByText(/35\.6812/)).not.toBeInTheDocument();
      expect(screen.queryByText(/139\.7671/)).not.toBeInTheDocument();
    });
  });

  describe("解除ボタン", () => {
    it("coordinate 設定済みのとき解除ボタンが表示される", () => {
      // Given
      const coordinate: Coordinate = { lat: 35.6812, lng: 139.7671 };
      // When
      render(<StartLocationInput {...defaultProps} coordinate={coordinate} />);
      // Then
      expect(screen.getByRole("button", { name: "解除" })).toBeInTheDocument();
    });

    it("解除ボタンをクリックすると onCoordinateChange(null) が呼ばれる", async () => {
      // Given
      const user = userEvent.setup();
      const coordinate: Coordinate = { lat: 35.6812, lng: 139.7671 };
      render(<StartLocationInput {...defaultProps} coordinate={coordinate} />);
      // When
      await user.click(screen.getByRole("button", { name: "解除" }));
      // Then
      expect(onCoordinateChange).toHaveBeenCalledWith(null);
    });

    it("coordinate が null のとき解除ボタンは表示されない", () => {
      // Given
      // When
      render(<StartLocationInput {...defaultProps} coordinate={null} />);
      // Then
      expect(screen.queryByRole("button", { name: "解除" })).not.toBeInTheDocument();
    });
  });

  describe("エラー表示", () => {
    it("GPS エラーが null のときエラーメッセージは表示されない", () => {
      // Given: フックのエラーが null（デフォルト）
      // When
      render(<StartLocationInput {...defaultProps} />);
      // Then
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("GPS エラーが設定されているときエラーメッセージが表示される", () => {
      // Given: フックが GPS エラーを返す
      const errorMessage = "現在地の取得に失敗しました";
      mockUseCurrentLocation.mockReturnValue({
        ...defaultMockReturn,
        error: errorMessage,
      });
      // When
      render(<StartLocationInput {...defaultProps} />);
      // Then
      expect(screen.getByRole("alert")).toHaveTextContent(errorMessage);
    });
  });

  describe("isLocating フラグ", () => {
    it("isLocating が true のとき GPS ボタンが無効化される", () => {
      // Given: フックが GPS 取得中を返す
      mockUseCurrentLocation.mockReturnValue({
        ...defaultMockReturn,
        isLocating: true,
      });
      // When
      render(<StartLocationInput {...defaultProps} />);
      // Then
      const gpsButton = screen.getByRole("button", { name: /現在地/i });
      expect(gpsButton).toBeDisabled();
    });

    it("isLocating が false のとき GPS ボタンが有効である", () => {
      // Given: フックが GPS 取得中でないを返す（デフォルト）
      // When
      render(<StartLocationInput {...defaultProps} />);
      // Then
      const gpsButton = screen.getByRole("button", { name: /現在地/i });
      expect(gpsButton).not.toBeDisabled();
    });
  });

  describe("GPS ボタン操作", () => {
    it("GPS ボタンをクリックすると getCurrentLocation が呼ばれる", async () => {
      // Given
      const user = userEvent.setup();
      render(<StartLocationInput {...defaultProps} />);
      // When
      await user.click(screen.getByRole("button", { name: /現在地/i }));
      // Then: 内部で useCurrentLocation の getCurrentLocation を呼ぶ
      expect(mockGetCurrentLocation).toHaveBeenCalledTimes(1);
    });

    it("GPS 取得成功時に onCoordinateChange が取得座標で呼ばれる", () => {
      // Given: GPS 取得成功を模擬（coordinate が更新される）
      const newCoordinate: Coordinate = { lat: 43.0618, lng: 141.3545 };
      mockUseCurrentLocation.mockReturnValue({
        ...defaultMockReturn,
        coordinate: newCoordinate,
      });
      // When: GPS座標が取得された状態でレンダリング
      render(<StartLocationInput {...defaultProps} />);
      // Then: 親コンポーネントへ座標が通知される
      expect(onCoordinateChange).toHaveBeenCalledWith(newCoordinate);
    });

    it("同一のGPS座標では再レンダーしても onCoordinateChange は一度しか呼ばれない", () => {
      // Given: GPS 取得成功後、親の再レンダーで onCoordinateChange の識別子が変わる状況
      const newCoordinate: Coordinate = { lat: 43.0618, lng: 141.3545 };
      mockUseCurrentLocation.mockReturnValue({
        ...defaultMockReturn,
        coordinate: newCoordinate,
      });
      const { rerender } = render(<StartLocationInput {...defaultProps} />);
      // When: 新しいコールバック識別子で再レンダー
      const anotherCallback = jest.fn();
      rerender(
        <StartLocationInput
          coordinate={newCoordinate}
          onCoordinateChange={anotherCallback}
        />
      );
      // Then: 無限更新ループを防ぐため再通知されない
      expect(onCoordinateChange).toHaveBeenCalledTimes(1);
      expect(anotherCallback).not.toHaveBeenCalled();
    });
  });
});
