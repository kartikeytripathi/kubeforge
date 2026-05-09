import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "@/lib/store";

describe("useAppStore", () => {
  beforeEach(() => {
    useAppStore.setState({ eksMode: false });
  });

  it("starts with EKS mode off", () => {
    expect(useAppStore.getState().eksMode).toBe(false);
  });

  it("toggles EKS mode on", () => {
    useAppStore.getState().toggleEksMode();
    expect(useAppStore.getState().eksMode).toBe(true);
  });

  it("toggles EKS mode back off", () => {
    useAppStore.getState().toggleEksMode();
    useAppStore.getState().toggleEksMode();
    expect(useAppStore.getState().eksMode).toBe(false);
  });

  it("sets EKS mode directly", () => {
    useAppStore.getState().setEksMode(true);
    expect(useAppStore.getState().eksMode).toBe(true);
    useAppStore.getState().setEksMode(false);
    expect(useAppStore.getState().eksMode).toBe(false);
  });
});
