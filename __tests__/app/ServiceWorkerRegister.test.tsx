import { render } from "@testing-library/react";
import { ServiceWorkerRegister } from "@/app/ServiceWorkerRegister";

const registerMock = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  registerMock.mockClear();
  Object.defineProperty(global.navigator, "serviceWorker", {
    configurable: true,
    value: { register: registerMock },
  });
});

describe("ServiceWorkerRegister", () => {
  it("何もレンダリングしない（null を返す）", () => {
    // Given / When
    const { container } = render(<ServiceWorkerRegister />);
    // Then
    expect(container).toBeEmptyDOMElement();
  });

  it("テスト環境（非production）では Service Worker を登録しない", () => {
    // Given: NODE_ENV は "test"
    // When
    render(<ServiceWorkerRegister />);
    window.dispatchEvent(new Event("load"));
    // Then: 本番以外では登録しない
    expect(registerMock).not.toHaveBeenCalled();
  });
});
