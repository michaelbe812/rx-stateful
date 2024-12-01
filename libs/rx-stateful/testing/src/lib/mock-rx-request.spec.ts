import { mockRxRequest } from "./mock-rx-request";
import { subscribeSpyTo } from "@hirez_io/observer-spy";

describe('mockRxRequest', () => {
  it('should create mock with all properties defined', () => {
    const mock = mockRxRequest();

    expect(mock.instance).toBeTruthy();
    expect(mock.instance.value$).toBeTruthy();
    expect(mock.instance.refresh).toBeTruthy();
    expect(mock.state$Trigger).toBeTruthy();
    expect(mock.refreshTrigger).toBeTruthy();
  });

  describe('state$Trigger', () => {
    it('should emit when trigger emits', () => {
      const mock = mockRxRequest<string>();

      const result = subscribeSpyTo(mock.instance.value$());
      mock.state$Trigger.next({ isSuspense: true });
      mock.state$Trigger.next({ value: 'test', isSuspense: false });

      expect(result.getValues()).toEqual([
        { isSuspense: true },
        { value: 'test', isSuspense: false }
      ]);
    });
  });

  describe('refresh', () => {
    it('should emit when refresh is called', () => {
      const mock = mockRxRequest<string>();
      const refreshSpy = jest.fn();

      mock.refreshTrigger.subscribe(refreshSpy);
      mock.instance.refresh();

      expect(refreshSpy).toHaveBeenCalled();
    });
  });
});
