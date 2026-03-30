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
    it("緯度 (lat) の number 入力欄が存在する", () => {
      // Given
      // When
      render(<StartLocationInput {...defaultProps} />);
      // Then: 緯度入力フィールド
      const latInput = screen.getByLabelText(/緯度|lat/i);
      expect(latInput).toBeInTheDocument();
      expect(latInput).toHaveAttribute("type", "number");
    });

    it("経度 (lng) の number 入力欄が存在する", () => {
      // Given
      // When
      render(<StartLocationInput {...defaultProps} />);
      // Then: 経度入力フィールド
      const lngInput = screen.getByLabelText(/経度|lng/i);
      expect(lngInput).toBeInTheDocument();
      expect(lngInput).toHaveAttribute("type", "number");
    });

    it("緯度入力欄の step が '0.0001' である", () => {
      // Given
      // When
      render(<StartLocationInput {...defaultProps} />);
      // Then: 細かい座標入力のための step 属性
      const latInput = screen.getByLabelText(/緯度|lat/i);
      expect(latInput).toHaveAttribute("step", "0.0001");
    });

    it("経度入力欄の step が '0.0001' である", () => {
      // Given
      // When
      render(<StartLocationInput {...defaultProps} />);
      // Then
      const lngInput = screen.getByLabelText(/経度|lng/i);
      expect(lngInput).toHaveAttribute("step", "0.0001");
    });

    it("現在地取得ボタンが存在する", () => {
      // Given
      // When
      render(<StartLocationInput {...defaultProps} />);
      // Then: GPS ボタン（CurrentLocationButton が統合済み）
      const gpsButton = screen.getByRole("button", { name: /現在地|GPS|location/i });
      expect(gpsButton).toBeInTheDocument();
    });

    it("coordinate が null のとき入力欄は空である", () => {
      // Given: 座標未設定
      // When
      render(<StartLocationInput {...defaultProps} coordinate={null} />);
      // Then
      const latInput = screen.getByLabelText(/緯度|lat/i) as HTMLInputElement;
      const lngInput = screen.getByLabelText(/経度|lng/i) as HTMLInputElement;
      expect(latInput.value).toBe("");
      expect(lngInput.value).toBe("");
    });

    it("coordinate が設定されているとき入力欄に値が表示される", () => {
      // Given: 座標設定済み
      const coordinate: Coordinate = { lat: 35.6812, lng: 139.7671 };
      // When
      render(<StartLocationInput {...defaultProps} coordinate={coordinate} />);
      // Then
      const latInput = screen.getByLabelText(/緯度|lat/i) as HTMLInputElement;
      const lngInput = screen.getByLabelText(/経度|lng/i) as HTMLInputElement;
      expect(latInput.value).toBe("35.6812");
      expect(lngInput.value).toBe("139.7671");
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
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
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
      const gpsButton = screen.getByRole("button", { name: /現在地|GPS|location/i });
      expect(gpsButton).toBeDisabled();
    });

    it("isLocating が false のとき GPS ボタンが有効である", () => {
      // Given: フックが GPS 取得中でないを返す（デフォルト）
      // When
      render(<StartLocationInput {...defaultProps} />);
      // Then
      const gpsButton = screen.getByRole("button", { name: /現在地|GPS|location/i });
      expect(gpsButton).not.toBeDisabled();
    });
  });

  describe("GPS ボタン操作", () => {
    it("GPS ボタンをクリックすると getCurrentLocation が呼ばれる", async () => {
      // Given
      const user = userEvent.setup();
      render(<StartLocationInput {...defaultProps} />);
      // When
      await user.click(screen.getByRole("button", { name: /現在地|GPS|location/i }));
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
  });

  describe("手動入力", () => {
    it("緯度を手動入力すると onCoordinateChange が呼ばれる", async () => {
      // Given: 初期座標あり（lngが既に設定されているため座標が確定できる）
      const user = userEvent.setup();
      render(<StartLocationInput {...defaultProps} coordinate={{ lat: 0, lng: 0 }} />);
      const latInput = screen.getByLabelText(/緯度|lat/i);
      // When
      await user.clear(latInput);
      await user.type(latInput, "35.6812");
      // Then: 変更が親へ通知される
      expect(onCoordinateChange).toHaveBeenCalled();
    });
  });
});
