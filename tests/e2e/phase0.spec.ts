import { test, expect } from "@playwright/test";

test.describe("Phase 0 — Scaffolding", () => {
  test("home page renders KubeForge heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /KubeForge/i })).toBeVisible();
  });

  test("EKS toggle flips state from Vanilla K8s to EKS Mode", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByTestId("eks-toggle");

    await expect(toggle).toHaveText(/Vanilla K8s/i);
    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    await toggle.click();

    await expect(toggle).toHaveText(/EKS Mode/i);
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  test("sidebar navigation links are present", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Curriculum/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Progress/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Settings/i })).toBeVisible();
  });

  test("curriculum page renders phase list", async ({ page }) => {
    await page.goto("/curriculum");
    await expect(page.getByRole("heading", { name: /Curriculum/i })).toBeVisible();
    await expect(page.getByText(/Phase A/i)).toBeVisible();
    await expect(page.getByText(/Phase D/i)).toBeVisible();
  });
});
