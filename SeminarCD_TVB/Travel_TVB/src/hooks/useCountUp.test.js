import { renderHook, act } from '@testing-library/react';
import useCountUp from './useCountUp';

describe('useCountUp', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start at 0', () => {
    const { result } = renderHook(() => useCountUp(100, 1000));
    // Initially 0 before any animation frame fires
    expect(result.current).toBe(0);
  });

  it('should eventually reach the endValue', async () => {
    vi.useRealTimers(); // need real timers for RAF

    const { result } = renderHook(() => useCountUp(100, 50));

    // Wait for animation to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    expect(result.current).toBe(100);
  });

  it('should handle endValue of 0', async () => {
    vi.useRealTimers();

    const { result } = renderHook(() => useCountUp(0, 100));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    expect(result.current).toBe(0);
  });

  it('should handle a large endValue', async () => {
    vi.useRealTimers();

    const { result } = renderHook(() => useCountUp(15000, 50));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    expect(result.current).toBe(15000);
  });

  it('should clean up animation frame on unmount', () => {
    vi.useRealTimers();
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

    const { unmount } = renderHook(() => useCountUp(100, 5000));
    unmount();

    expect(cancelSpy).toHaveBeenCalled();
    cancelSpy.mockRestore();
  });
});
