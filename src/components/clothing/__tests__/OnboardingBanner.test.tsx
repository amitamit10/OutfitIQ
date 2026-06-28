import { render, screen } from "@testing-library/react";
import { OnboardingBanner } from "@/components/clothing/OnboardingBanner";

describe("OnboardingBanner", () => {
  it("renders completion message when item count is at threshold", () => {
    render(<OnboardingBanner itemCount={5} />);
    expect(screen.getByText(/Great start!/i)).toBeInTheDocument();
  });

  it("renders remaining item message when item count is below threshold", () => {
    render(<OnboardingBanner itemCount={2} />);
    expect(screen.getByText(/Add 3 more items/i)).toBeInTheDocument();
  });

  it("renders first item message when item count is zero", () => {
    render(<OnboardingBanner itemCount={0} />);
    expect(screen.getByText(/Add your first clothing item/i)).toBeInTheDocument();
  });
});
