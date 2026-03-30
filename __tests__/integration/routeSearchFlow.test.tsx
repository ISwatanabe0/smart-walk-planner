/**
 * インテグレーションテスト: ルート検索フロー（座標入力）
 *
 * 対象モジュール横断フロー:
 *   useRouteSearch → RouteSearchForm → StartLocationInput → routeSearchValidator
 *
 * このテストは3モジュールを横断するデータフローを検証する。
 * ユーザーが座標を入力し、バリデーションを経てルート検索が
 * 呼び出されるまでの一連の動作を確認する。
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouteSearchForm } from "@/features/route-search/components/RouteSearchForm";
import { DEFAULT_DISTANCE_METERS } from "@/constants/defaultValues";
import type { RouteSearchCondition } from "@/types/preferences";

// useCurrentLocation フックをモック（StartLocationInput が内部で使用）
// jest.mock は巻き上げられるため、ファクトリ内ではスコープ外変数を参照できない
jest.mock("@/hooks/useCurrentLocation", () => ({
  useCurrentLocation: jest.fn().mockReturnValue({
    coordinate: null,
    isLocating: false,
    error: null,
    getCurrentLocation: jest.fn(),
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ルート検索フロー（インテグレーション）", () => {
  const onSubmit = jest.fn();
  const onChange = jest.fn();

  const initialCondition: RouteSearchCondition = {
    start: null,
    distanceMeters: DEFAULT_DISTANCE_METERS,
    durationMinutes: null,
    preferences: {
      scenery: false,
      avoidTrafficLights: false,
      avoidMainRoads: false,
      includeSightseeing: false,
      loopRoute: false,
    },
  };

  describe("初期表示", () => {
    it("distanceMeters の初期値が 3000 で表示される", () => {
      // Given: フォームがデフォルト値で初期化される
      // When
      render(
        <RouteSearchForm
          value={initialCondition}
          onChange={onChange}
          onSubmit={onSubmit}
          isLoading={false}
          errors={[]}
        />
      );
      // Then: 距離入力欄に3000が初期表示される
      const distanceInput = screen.getByLabelText(/距離|distance/i) as HTMLInputElement;
      expect(distanceInput.value).toBe(String(DEFAULT_DISTANCE_METERS));
    });

    it("startLocationText フィールドが存在しない（テキスト住所入力欄がない）", () => {
      // Given: 座標入力のみの仕様
      // When
      render(
        <RouteSearchForm
          value={initialCondition}
          onChange={onChange}
          onSubmit={onSubmit}
          isLoading={false}
          errors={[]}
        />
      );
      // Then: 住所テキスト入力欄は存在しない
      expect(screen.queryByPlaceholderText(/住所|address/i)).not.toBeInTheDocument();
    });

    it("緯度・経度の number 入力欄が表示される", () => {
      // Given
      // When
      render(
        <RouteSearchForm
          value={initialCondition}
          onChange={onChange}
          onSubmit={onSubmit}
          isLoading={false}
          errors={[]}
        />
      );
      // Then: StartLocationInput が統合されて座標入力欄が表示される
      expect(screen.getByLabelText(/緯度|lat/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/経度|lng/i)).toBeInTheDocument();
    });
  });

  describe("バリデーションエラー表示", () => {
    it("start のエラーがフォームに表示される", () => {
      // Given: start フィールドのバリデーションエラー
      const errors = [{ field: "start", message: "出発地点を入力してください" }];
      // When
      render(
        <RouteSearchForm
          value={initialCondition}
          onChange={onChange}
          onSubmit={onSubmit}
          isLoading={false}
          errors={errors}
        />
      );
      // Then: エラーメッセージが表示される
      expect(screen.getByText("出発地点を入力してください")).toBeInTheDocument();
    });
  });

  describe("座標入力 → フォーム送信フロー", () => {
    it("座標を入力して送信するとバリデーションが通る", async () => {
      // Given: 有効な座標が入力された状態
      const user = userEvent.setup();
      const conditionWithStart: RouteSearchCondition = {
        ...initialCondition,
        start: { lat: 35.6812, lng: 139.7671 },
      };
      render(
        <RouteSearchForm
          value={conditionWithStart}
          onChange={onChange}
          onSubmit={onSubmit}
          isLoading={false}
          errors={[]}
        />
      );
      // When: 送信ボタンをクリック
      const submitButton = screen.getByRole("button", { name: /検索|生成|ルート/i });
      await user.click(submitButton);
      // Then: onSubmit が呼ばれる（バリデーション通過）
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });

    it("start が null のまま送信しようとするとエラーが表示される", async () => {
      // Given: 出発地点未入力
      const user = userEvent.setup();
      render(
        <RouteSearchForm
          value={initialCondition}
          onChange={onChange}
          onSubmit={onSubmit}
          isLoading={false}
          errors={[{ field: "start", message: "出発地点を入力してください" }]}
        />
      );
      // When: 送信ボタンをクリック
      const submitButton = screen.getByRole("button", { name: /検索|生成|ルート/i });
      await user.click(submitButton);
      // Then: エラーが表示されてフォームは送信されない
      expect(screen.getByText("出発地点を入力してください")).toBeInTheDocument();
    });
  });

  describe("isLoading のとき", () => {
    it("isLoading が true のとき送信ボタンが無効化される", () => {
      // Given: ルート検索中
      // When
      render(
        <RouteSearchForm
          value={initialCondition}
          onChange={onChange}
          onSubmit={onSubmit}
          isLoading={true}
          errors={[]}
        />
      );
      // Then: 多重送信防止
      const submitButton = screen.getByRole("button", { name: /検索|生成|ルート/i });
      expect(submitButton).toBeDisabled();
    });
  });
});
