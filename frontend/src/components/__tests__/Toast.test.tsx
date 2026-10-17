// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import Toast, { ToastItem } from "../Toast";
import {
	useToastStore,
	type Toast as ToastItemType,
	MAX_VISIBLE_TOASTS,
} from "../../store/toastStore";


const TYPE_STYLES: Record<string, string> = {
	error: "bg-(--error)",
	success: "bg-(--success)",
	loading: "bg-(--warning)",
	info: "bg-(--info)",
	invitation: "bg-gradient-to-r from-purple-600 to-blue-600 border border-purple-400/30",
};

const PROGRESS_COLORS: Record<string, string> = {
	error: "bg-red-300",
	success: "bg-emerald-300",
	info: "bg-blue-300",
	invitation: "bg-purple-300",
	loading: "bg-amber-300",
};


describe("Toast Component 5D Matrix Exhaustive Test Suite", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		useToastStore.getState().clearToasts();
	});

	afterEach(() => {
		act(() => {
			vi.clearAllTimers();
		});
		vi.useRealTimers();
	});

	// ── Dimension 1: Full Range Boundaries & Clamping ─────────────
	describe("Dimension 1: Full Range Boundaries & Clamping", () => {
		describe("Duration boundaries", () => {
			it("handles boundary duration of 0ms by dismissing immediately", () => {
				const onDismiss = vi.fn();
				const toast: ToastItemType = {
					id: 1,
					message: "Instant",
					type: "info",
					duration: 0,
				};
				render(<ToastItem toast={toast} onDismiss={onDismiss} />);
				expect(onDismiss).toHaveBeenCalledWith(1);
			});

			it("handles short boundary duration of 50ms (single tick)", () => {
				const onDismiss = vi.fn();
				const toast: ToastItemType = {
					id: 2,
					message: "Short",
					type: "success",
					duration: 50,
				};
				render(<ToastItem toast={toast} onDismiss={onDismiss} />);
				expect(onDismiss).not.toHaveBeenCalled();

				act(() => {
					vi.advanceTimersByTime(50);
				});
				expect(onDismiss).toHaveBeenCalledWith(2);
			});

			it("handles default duration of 3000ms exactly", () => {
				const onDismiss = vi.fn();
				const toast: ToastItemType = {
					id: 3,
					message: "Default duration",
					type: "error",
				};
				render(<ToastItem toast={toast} onDismiss={onDismiss} />);
				expect(onDismiss).not.toHaveBeenCalled();

				act(() => {
					vi.advanceTimersByTime(2950);
				});
				expect(onDismiss).not.toHaveBeenCalled();

				act(() => {
					vi.advanceTimersByTime(50);
				});
				expect(onDismiss).toHaveBeenCalledWith(3);
			});

			it("handles long boundary duration of 10000ms", () => {
				const onDismiss = vi.fn();
				const toast: ToastItemType = {
					id: 4,
					message: "Long duration",
					type: "info",
					duration: 10000,
				};
				render(<ToastItem toast={toast} onDismiss={onDismiss} />);

				act(() => {
					vi.advanceTimersByTime(9950);
				});
				expect(onDismiss).not.toHaveBeenCalled();

				act(() => {
					vi.advanceTimersByTime(50);
				});
				expect(onDismiss).toHaveBeenCalledWith(4);
			});
		});

		describe("Progress bar clamping (0% to 100%)", () => {
			it("renders progress bar at 100% initially", () => {
				const onDismiss = vi.fn();
				const toast: ToastItemType = {
					id: 10,
					message: "Progress 100%",
					type: "info",
					duration: 1000,
				};
				render(<ToastItem toast={toast} onDismiss={onDismiss} />);
				const bar = screen.getByTestId("toast-progress-bar-10");
				expect(bar.style.width).toBe("100%");
			});

			it("renders progress bar at approximately 50% halfway through duration", () => {
				const onDismiss = vi.fn();
				const toast: ToastItemType = {
					id: 11,
					message: "Progress 50%",
					type: "info",
					duration: 1000,
				};
				render(<ToastItem toast={toast} onDismiss={onDismiss} />);

				act(() => {
					vi.advanceTimersByTime(500);
				});
				const bar = screen.getByTestId("toast-progress-bar-11");
				expect(bar.style.width).toBe("50%");
			});

			it("renders progress bar at approximately 25% at 750ms of 1000ms", () => {
				const onDismiss = vi.fn();
				const toast: ToastItemType = {
					id: 12,
					message: "Progress 25%",
					type: "info",
					duration: 1000,
				};
				render(<ToastItem toast={toast} onDismiss={onDismiss} />);

				act(() => {
					vi.advanceTimersByTime(750);
				});
				const bar = screen.getByTestId("toast-progress-bar-12");
				expect(bar.style.width).toBe("25%");
			});

			it("does not clamp progress to negative values", () => {
				const onDismiss = vi.fn();
				const toast: ToastItemType = {
					id: 13,
					message: "Progress 0%",
					type: "info",
					duration: 100,
				};
				render(<ToastItem toast={toast} onDismiss={onDismiss} />);

				act(() => {
					vi.advanceTimersByTime(200);
				});
				// Component dismisses at 0%, onDismiss called
				expect(onDismiss).toHaveBeenCalledWith(13);
			});
		});

		describe("Queue capacity and capping at 4 max visible", () => {
			it("renders empty region when toast list is empty (0 items)", () => {
				render(<Toast />);
				const region = screen.getByRole("region", { name: "Notifications" });
				expect(region.children.length).toBe(0);
			});

			it("renders exactly 1 toast when 1 is added", () => {
				act(() => {
					useToastStore.getState().addToast("First toast", "info");
				});
				render(<Toast />);
				expect(screen.getByText("First toast")).toBeInTheDocument();
				const region = screen.getByRole("region", { name: "Notifications" });
				expect(region.children.length).toBe(1);
			});

			it("renders exactly 2 toasts when 2 are added", () => {
				act(() => {
					useToastStore.getState().addToast("Toast 1", "info");
					useToastStore.getState().addToast("Toast 2", "info");
				});
				render(<Toast />);
				const region = screen.getByRole("region", { name: "Notifications" });
				expect(region.children.length).toBe(2);
			});

			it("renders exactly 3 toasts when 3 are added", () => {
				act(() => {
					useToastStore.getState().addToast("Toast 1", "info");
					useToastStore.getState().addToast("Toast 2", "info");
					useToastStore.getState().addToast("Toast 3", "info");
				});
				render(<Toast />);
				const region = screen.getByRole("region", { name: "Notifications" });
				expect(region.children.length).toBe(3);
			});

			it("renders exactly boundary maximum 4 toasts when 4 are added", () => {
				act(() => {
					useToastStore.getState().addToast("Toast 1", "info");
					useToastStore.getState().addToast("Toast 2", "info");
					useToastStore.getState().addToast("Toast 3", "info");
					useToastStore.getState().addToast("Toast 4", "info");
				});
				render(<Toast />);
				const region = screen.getByRole("region", { name: "Notifications" });
				expect(region.children.length).toBe(4);
			});

			it("caps visible toasts at 4 when 5 are added, queueing the 5th", () => {
				act(() => {
					useToastStore.getState().addToast("Toast 1", "info");
					useToastStore.getState().addToast("Toast 2", "info");
					useToastStore.getState().addToast("Toast 3", "info");
					useToastStore.getState().addToast("Toast 4", "info");
					useToastStore.getState().addToast("Toast 5 (Queued)", "info");
				});
				render(<Toast />);
				const region = screen.getByRole("region", { name: "Notifications" });
				expect(region.children.length).toBe(4);
				expect(screen.queryByText("Toast 5 (Queued)")).not.toBeInTheDocument();
			});

			it("caps visible toasts at 4 when 10 are added, queueing 6", () => {
				act(() => {
					for (let i = 1; i <= 10; i++) {
						useToastStore.getState().addToast(`Toast ${i}`, "info");
					}
				});
				render(<Toast />);
				const region = screen.getByRole("region", { name: "Notifications" });
				expect(region.children.length).toBe(4);
				expect(screen.getByText("Toast 1")).toBeInTheDocument();
				expect(screen.getByText("Toast 4")).toBeInTheDocument();
				expect(screen.queryByText("Toast 5")).not.toBeInTheDocument();
			});

			it("automatically pulls 5th toast into visible stack when 1st toast is dismissed", () => {
				act(() => {
					useToastStore.getState().addToast("Toast 1", "info");
					useToastStore.getState().addToast("Toast 2", "info");
					useToastStore.getState().addToast("Toast 3", "info");
					useToastStore.getState().addToast("Toast 4", "info");
					useToastStore.getState().addToast("Toast 5", "info");
				});
				render(<Toast />);
				expect(screen.queryByText("Toast 5")).not.toBeInTheDocument();

				// Dismiss Toast 1 via close button
				const dismissBtn = screen.getAllByLabelText("Dismiss")[0];
				act(() => {
					fireEvent.click(dismissBtn);
				});

				// Now Toast 5 enters the visible stack
				expect(screen.queryByText("Toast 1")).not.toBeInTheDocument();
				expect(screen.getByText("Toast 5")).toBeInTheDocument();
				const region = screen.getByRole("region", { name: "Notifications" });
				expect(region.children.length).toBe(4);
			});
		});
	});

	// ── Dimension 2: Combinatorics across Toast Types & Modifiers ──
	describe("Dimension 2: Combinatorics across Toast Types & Modifiers", () => {
		describe("Toast type variants", () => {
			it("renders error toast with error style and red progress bar", () => {
				const toast: ToastItemType = {
					id: 101,
					message: "Network error",
					type: "error",
				};
				render(<ToastItem toast={toast} onDismiss={vi.fn()} />);
				const item = screen.getByTestId("toast-item-101");
				expect(item.className).toContain(TYPE_STYLES.error);
				const bar = screen.getByTestId("toast-progress-bar-101");
				expect(bar.className).toContain(PROGRESS_COLORS.error);
			});

			it("renders success toast with success style and emerald progress bar", () => {
				const toast: ToastItemType = {
					id: 102,
					message: "Game saved",
					type: "success",
				};
				render(<ToastItem toast={toast} onDismiss={vi.fn()} />);
				const item = screen.getByTestId("toast-item-102");
				expect(item.className).toContain(TYPE_STYLES.success);
				const bar = screen.getByTestId("toast-progress-bar-102");
				expect(bar.className).toContain(PROGRESS_COLORS.success);
			});

			it("renders info toast with info style and blue progress bar", () => {
				const toast: ToastItemType = {
					id: 103,
					message: "Your turn",
					type: "info",
				};
				render(<ToastItem toast={toast} onDismiss={vi.fn()} />);
				const item = screen.getByTestId("toast-item-103");
				expect(item.className).toContain(TYPE_STYLES.info);
				const bar = screen.getByTestId("toast-progress-bar-103");
				expect(bar.className).toContain(PROGRESS_COLORS.info);
			});

			it("renders loading toast with spinner and NO progress bar", () => {
				const onDismiss = vi.fn();
				const toast: ToastItemType = {
					id: 104,
					message: "Submitting transaction...",
					type: "loading",
				};
				render(<ToastItem toast={toast} onDismiss={onDismiss} />);
				expect(screen.getByTestId("toast-spinner")).toBeInTheDocument();
				expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

				// Does not auto dismiss
				act(() => {
					vi.advanceTimersByTime(10000);
				});
				expect(onDismiss).not.toHaveBeenCalled();
			});

			it("renders loading toast with cursor-default and without close button", () => {
				const toast: ToastItemType = {
					id: 105,
					message: "Loading data...",
					type: "loading",
				};
				render(<ToastItem toast={toast} onDismiss={vi.fn()} />);
				const item = screen.getByTestId("toast-item-105");
				expect(item.className).toContain("cursor-default");
				expect(screen.queryByLabelText("Dismiss")).not.toBeInTheDocument();
			});

			it("renders invitation toast with gamepad icon and NO progress bar", () => {
				const onDismiss = vi.fn();
				const toast: ToastItemType = {
					id: 106,
					message: "Player invited you to a match",
					type: "invitation",
				};
				render(<ToastItem toast={toast} onDismiss={onDismiss} />);
				expect(screen.getByTestId("toast-gamepad")).toBeInTheDocument();
				expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

				// Does not auto dismiss
				act(() => {
					vi.advanceTimersByTime(10000);
				});
				expect(onDismiss).not.toHaveBeenCalled();
			});

			it("renders invitation toast with action button when action is provided", () => {
				const onActionClick = vi.fn();
				const onDismiss = vi.fn();
				const toast: ToastItemType = {
					id: 107,
					message: "Match challenge",
					type: "invitation",
					action: { label: "Accept Match", onClick: onActionClick },
				};
				render(<ToastItem toast={toast} onDismiss={onDismiss} />);
				const actionBtn = screen.getByTestId("toast-action-btn-107");
				expect(actionBtn).toHaveTextContent("Accept Match");

				act(() => {
					fireEvent.click(actionBtn);
				});
				expect(onActionClick).toHaveBeenCalledTimes(1);
				expect(onDismiss).toHaveBeenCalledWith(107);
			});

			it("does not render action button on invitation toast when action is undefined", () => {
				const toast: ToastItemType = {
					id: 108,
					message: "Simple invite without action",
					type: "invitation",
				};
				render(<ToastItem toast={toast} onDismiss={vi.fn()} />);
				expect(screen.queryByTestId("toast-action-btn-108")).not.toBeInTheDocument();
			});
		});

		describe("Dismissal interaction combinations", () => {
			it("dismisses auto-dismiss toast when clicking anywhere on the item body", () => {
				const onDismiss = vi.fn();
				const toast: ToastItemType = {
					id: 109,
					message: "Click to dismiss",
					type: "info",
				};
				render(<ToastItem toast={toast} onDismiss={onDismiss} />);
				const item = screen.getByTestId("toast-item-109");

				act(() => {
					fireEvent.click(item);
				});
				expect(onDismiss).toHaveBeenCalledWith(109);
			});

			it("dismisses toast when explicitly clicking the X dismiss button", () => {
				const onDismiss = vi.fn();
				const toast: ToastItemType = {
					id: 110,
					message: "Click X",
					type: "success",
				};
				render(<ToastItem toast={toast} onDismiss={onDismiss} />);
				const dismissBtn = screen.getByTestId("toast-dismiss-btn-110");

				act(() => {
					fireEvent.click(dismissBtn);
				});
				expect(onDismiss).toHaveBeenCalledWith(110);
			});

			it("stops event propagation when clicking X button so only single dismissal occurs", () => {
				const onDismiss = vi.fn();
				const toast: ToastItemType = {
					id: 111,
					message: "Click X stopPropagation",
					type: "error",
				};
				render(<ToastItem toast={toast} onDismiss={onDismiss} />);
				const dismissBtn = screen.getByTestId("toast-dismiss-btn-111");

				act(() => {
					fireEvent.click(dismissBtn);
				});
				expect(onDismiss).toHaveBeenCalledTimes(1);
			});

			it("does not dismiss loading toast when clicking its container", () => {
				const onDismiss = vi.fn();
				const toast: ToastItemType = {
					id: 112,
					message: "Loading untouchable",
					type: "loading",
				};
				render(<ToastItem toast={toast} onDismiss={onDismiss} />);
				const item = screen.getByTestId("toast-item-112");

				act(() => {
					fireEvent.click(item);
				});
				expect(onDismiss).not.toHaveBeenCalled();
			});

			it("does not dismiss invitation toast when clicking its container (only action button)", () => {
				const onDismiss = vi.fn();
				const toast: ToastItemType = {
					id: 113,
					message: "Invitation untouchable container",
					type: "invitation",
				};
				render(<ToastItem toast={toast} onDismiss={onDismiss} />);
				const item = screen.getByTestId("toast-item-113");

				act(() => {
					fireEvent.click(item);
				});
				expect(onDismiss).not.toHaveBeenCalled();
			});
		});
	});

	// ── Dimension 3: Host Variations & Interactions ───────────────
	describe("Dimension 3: Host Variations & Interactions", () => {
		describe("Hover pause and resume behavior", () => {
			it("pauses progress countdown and timer when cursor enters (onMouseEnter)", () => {
				const onDismiss = vi.fn();
				const toast: ToastItemType = {
					id: 201,
					message: "Hover me",
					type: "info",
					duration: 1000,
				};
				render(<ToastItem toast={toast} onDismiss={onDismiss} />);
				const item = screen.getByTestId("toast-item-201");

				// Advance 200ms
				act(() => {
					vi.advanceTimersByTime(200);
				});
				const bar = screen.getByTestId("toast-progress-bar-201");
				expect(bar.style.width).toBe("80%");

				// Hover
				act(() => {
					fireEvent.mouseEnter(item);
				});
				expect(item.getAttribute("data-is-paused")).toBe("true");

				// Advance 1000ms while paused
				act(() => {
					vi.advanceTimersByTime(1000);
				});
				// Progress must remain frozen at 80%
				expect(bar.style.width).toBe("80%");
				expect(onDismiss).not.toHaveBeenCalled();
			});

			it("resumes progress countdown when cursor leaves (onMouseLeave)", () => {
				const onDismiss = vi.fn();
				const toast: ToastItemType = {
					id: 202,
					message: "Hover and leave",
					type: "info",
					duration: 1000,
				};
				render(<ToastItem toast={toast} onDismiss={onDismiss} />);
				const item = screen.getByTestId("toast-item-202");

				// Hover immediately
				act(() => {
					fireEvent.mouseEnter(item);
				});
				expect(item.getAttribute("data-is-paused")).toBe("true");

				// 2000ms while paused
				act(() => {
					vi.advanceTimersByTime(2000);
				});
				expect(onDismiss).not.toHaveBeenCalled();

				// Mouse leave
				act(() => {
					fireEvent.mouseLeave(item);
				});
				expect(item.getAttribute("data-is-paused")).toBe("false");

				// Advance remaining 1000ms
				act(() => {
					vi.advanceTimersByTime(1000);
				});
				expect(onDismiss).toHaveBeenCalledWith(202);
			});

			it("handles multiple rapid hover toggle cycles correctly", () => {
				const onDismiss = vi.fn();
				const toast: ToastItemType = {
					id: 203,
					message: "Rapid hover",
					type: "info",
					duration: 1000,
				};
				render(<ToastItem toast={toast} onDismiss={onDismiss} />);
				const item = screen.getByTestId("toast-item-203");

				// Cycle 1: Enter -> Leave
				act(() => {
					fireEvent.mouseEnter(item);
					fireEvent.mouseLeave(item);
				});
				expect(item.getAttribute("data-is-paused")).toBe("false");

				// Cycle 2: Enter -> Leave
				act(() => {
					fireEvent.mouseEnter(item);
					fireEvent.mouseLeave(item);
				});
				expect(item.getAttribute("data-is-paused")).toBe("false");

				// Cycle 3: Enter
				act(() => {
					fireEvent.mouseEnter(item);
				});
				expect(item.getAttribute("data-is-paused")).toBe("true");

				// Cycle 4: Leave
				act(() => {
					fireEvent.mouseLeave(item);
				});
				expect(item.getAttribute("data-is-paused")).toBe("false");

				act(() => {
					vi.advanceTimersByTime(1000);
				});
				expect(onDismiss).toHaveBeenCalledWith(203);
			});
		});

		describe("Message text variations", () => {
			it("renders standard ASCII message", () => {
				const toast: ToastItemType = {
					id: 204,
					message: "Wallet connected successfully",
					type: "success",
				};
				render(<ToastItem toast={toast} onDismiss={vi.fn()} />);
				expect(screen.getByText("Wallet connected successfully")).toBeInTheDocument();
			});

			it("renders message with HTML special characters safely", () => {
				const toast: ToastItemType = {
					id: 205,
					message: "<script>alert('xss')</script> & \" '",
					type: "error",
				};
				render(<ToastItem toast={toast} onDismiss={vi.fn()} />);
				expect(
					screen.getByText("<script>alert('xss')</script> & \" '")
				).toBeInTheDocument();
			});

			it("renders multilingual Unicode message", () => {
				const toast: ToastItemType = {
					id: 206,
					message: "Мат поставлен! Победа 🎉",
					type: "success",
				};
				render(<ToastItem toast={toast} onDismiss={vi.fn()} />);
				expect(screen.getByText("Мат поставлен! Победа 🎉")).toBeInTheDocument();
			});

			it("renders very long text message with word wrap", () => {
				const longMsg = "A".repeat(150);
				const toast: ToastItemType = {
					id: 207,
					message: longMsg,
					type: "info",
				};
				render(<ToastItem toast={toast} onDismiss={vi.fn()} />);
				expect(screen.getByText(longMsg)).toBeInTheDocument();
			});

			it("renders numeric and symbol message", () => {
				const toast: ToastItemType = {
					id: 208,
					message: "Wager: +0.005423 XLM (TX: 0x9a8f)",
					type: "info",
				};
				render(<ToastItem toast={toast} onDismiss={vi.fn()} />);
				expect(screen.getByText("Wager: +0.005423 XLM (TX: 0x9a8f)")).toBeInTheDocument();
			});
		});

		describe("Accessibility and ARIA attributes", () => {
			it("includes aria-label on notification container", () => {
				render(<Toast />);
				expect(screen.getByRole("region", { name: "Notifications" })).toBeInTheDocument();
			});

			it("includes role='progressbar' with aria values on progress bar", () => {
				const toast: ToastItemType = {
					id: 209,
					message: "A11y check",
					type: "info",
					duration: 1000,
				};
				render(<ToastItem toast={toast} onDismiss={vi.fn()} />);
				const progressbar = screen.getByRole("progressbar");
				expect(progressbar).toHaveAttribute("aria-valuemin", "0");
				expect(progressbar).toHaveAttribute("aria-valuemax", "100");
				expect(progressbar).toHaveAttribute("aria-valuenow", "100");
			});

			it("updates aria-valuenow as progress ticks down", () => {
				const toast: ToastItemType = {
					id: 210,
					message: "A11y updating",
					type: "info",
					duration: 1000,
				};
				render(<ToastItem toast={toast} onDismiss={vi.fn()} />);
				const progressbar = screen.getByRole("progressbar");

				act(() => {
					vi.advanceTimersByTime(500);
				});
				expect(progressbar).toHaveAttribute("aria-valuenow", "50");
			});

			it("includes accessible aria-label on dismiss button", () => {
				const toast: ToastItemType = {
					id: 211,
					message: "Dismiss btn a11y",
					type: "info",
				};
				render(<ToastItem toast={toast} onDismiss={vi.fn()} />);
				expect(screen.getByLabelText("Dismiss")).toBeInTheDocument();
			});
		});
	});

	// ── Dimension 4: Negative Controls & State Isolation ─────────
	describe("Dimension 4: Negative Controls & State Isolation", () => {
		it("does not trigger dismiss when paused for arbitrarily long duration", () => {
			const onDismiss = vi.fn();
			const toast: ToastItemType = {
				id: 301,
				message: "Paused infinite check",
				type: "error",
				duration: 1000,
			};
			render(<ToastItem toast={toast} onDismiss={onDismiss} />);
			const item = screen.getByTestId("toast-item-301");

			act(() => {
				fireEvent.mouseEnter(item);
			});

			act(() => {
				vi.advanceTimersByTime(100000);
			});
			expect(onDismiss).not.toHaveBeenCalled();
		});

		it("clears interval on unmount without throwing or triggering onDismiss", () => {
			const onDismiss = vi.fn();
			const toast: ToastItemType = {
				id: 302,
				message: "Unmount cleanup",
				type: "info",
				duration: 3000,
			};
			const { unmount } = render(<ToastItem toast={toast} onDismiss={onDismiss} />);

			act(() => {
				vi.advanceTimersByTime(1000);
			});
			expect(onDismiss).not.toHaveBeenCalled();

			unmount();

			act(() => {
				vi.advanceTimersByTime(5000);
			});
			expect(onDismiss).not.toHaveBeenCalled();
		});

		it("isolates multiple active toast timers from each other", () => {
			act(() => {
				useToastStore.getState().addToast("Fast toast", "info", undefined, 1000);
				useToastStore.getState().addToast("Slow toast", "info", undefined, 3000);
			});
			render(<Toast />);

			expect(screen.getByText("Fast toast")).toBeInTheDocument();
			expect(screen.getByText("Slow toast")).toBeInTheDocument();

			act(() => {
				vi.advanceTimersByTime(1000);
			});
			// Fast toast should be dismissed, slow toast remains
			expect(screen.queryByText("Fast toast")).not.toBeInTheDocument();
			expect(screen.getByText("Slow toast")).toBeInTheDocument();

			act(() => {
				vi.advanceTimersByTime(2000);
			});
			// Slow toast dismisses at 3000ms
			expect(screen.queryByText("Slow toast")).not.toBeInTheDocument();
		});

		it("pausing one toast does not pause sibling toast", () => {
			act(() => {
				useToastStore.getState().addToast("Toast A", "info", undefined, 1000);
				useToastStore.getState().addToast("Toast B", "info", undefined, 1000);
			});
			render(<Toast />);

			const toastA = screen.getByText("Toast A").closest("[data-testid^='toast-item-']")!;

			// Hover only Toast A
			act(() => {
				fireEvent.mouseEnter(toastA);
			});

			act(() => {
				vi.advanceTimersByTime(1000);
			});

			// Toast B must dismiss, Toast A must remain paused!
			expect(screen.queryByText("Toast B")).not.toBeInTheDocument();
			expect(screen.getByText("Toast A")).toBeInTheDocument();

			// Unpause Toast A
			act(() => {
				fireEvent.mouseLeave(toastA);
			});
			act(() => {
				vi.advanceTimersByTime(1000);
			});
			expect(screen.queryByText("Toast A")).not.toBeInTheDocument();
		});

		it("removing a toast does not affect order of remaining queued toasts", () => {
			act(() => {
				useToastStore.getState().addToast("Item 1", "info");
				useToastStore.getState().addToast("Item 2", "info");
				useToastStore.getState().addToast("Item 3", "info");
				useToastStore.getState().addToast("Item 4", "info");
				useToastStore.getState().addToast("Item 5", "info");
			});
			render(<Toast />);

			// Dismiss item 2 explicitly
			const item2 = screen.getByText("Item 2");
			act(() => {
				fireEvent.click(item2);
			});

			// Remaining visible should be 1, 3, 4, 5
			expect(screen.getByText("Item 1")).toBeInTheDocument();
			expect(screen.queryByText("Item 2")).not.toBeInTheDocument();
			expect(screen.getByText("Item 3")).toBeInTheDocument();
			expect(screen.getByText("Item 4")).toBeInTheDocument();
			expect(screen.getByText("Item 5")).toBeInTheDocument();
		});
	});

	// ── Dimension 5: Lifecycle, High-Throughput & Stress ──────────
	describe("Dimension 5: Lifecycle, High-Throughput & Stress", () => {
		it("handles high-throughput burst of 20 toasts sequentially draining the queue", () => {
			act(() => {
				for (let i = 1; i <= 20; i++) {
					useToastStore.getState().addToast(`Burst ${i}`, "info", undefined, 500);
				}
			});
			render(<Toast />);

			// Initially only 1 to 4 visible
			for (let i = 1; i <= 4; i++) {
				expect(screen.getByText(`Burst ${i}`)).toBeInTheDocument();
			}
			expect(screen.queryByText("Burst 5")).not.toBeInTheDocument();

			// Advance in chunks of 500ms; every chunk dismisses 4 and reveals the next 4
			act(() => {
				vi.advanceTimersByTime(500);
			});
			expect(screen.queryByText("Burst 1")).not.toBeInTheDocument();
			expect(screen.getByText("Burst 5")).toBeInTheDocument();

			act(() => {
				vi.advanceTimersByTime(500);
			});
			expect(screen.getByText("Burst 9")).toBeInTheDocument();

			act(() => {
				vi.advanceTimersByTime(500);
			});
			expect(screen.getByText("Burst 13")).toBeInTheDocument();

			act(() => {
				vi.advanceTimersByTime(500);
			});
			expect(screen.getByText("Burst 17")).toBeInTheDocument();

			act(() => {
				vi.advanceTimersByTime(500);
			});
			// All 20 should now be cleared
			const region = screen.getByRole("region", { name: "Notifications" });
			expect(region.children.length).toBe(0);
		});

		it("stress test: 50 rapid sequential clicks on dismiss buttons", () => {
			act(() => {
				for (let i = 1; i <= 50; i++) {
					useToastStore.getState().addToast(`Stress ${i}`, "error");
				}
			});
			render(<Toast />);

			for (let step = 0; step < 50; step++) {
				const buttons = screen.queryAllByLabelText("Dismiss");
				if (buttons.length === 0) break;
				act(() => {
					fireEvent.click(buttons[0]);
				});
			}

			const region = screen.getByRole("region", { name: "Notifications" });
			expect(region.children.length).toBe(0);
		});

		it("ticks smoothly across 50ms intervals verifying fine-grained timer accuracy", () => {
			const onDismiss = vi.fn();
			const toast: ToastItemType = {
				id: 401,
				message: "Fine-grained tick test",
				type: "info",
				duration: 300,
			};
			render(<ToastItem toast={toast} onDismiss={onDismiss} />);
			const bar = screen.getByTestId("toast-progress-bar-401");

			// 0ms -> 100%
			expect(bar.style.width).toBe("100%");

			// 50ms -> 250/300 = 83.333%
			act(() => {
				vi.advanceTimersByTime(50);
			});
			expect(parseFloat(bar.style.width)).toBeCloseTo(83.33, 1);

			// 100ms -> 200/300 = 66.666%
			act(() => {
				vi.advanceTimersByTime(50);
			});
			expect(parseFloat(bar.style.width)).toBeCloseTo(66.66, 1);

			// 150ms -> 150/300 = 50%
			act(() => {
				vi.advanceTimersByTime(50);
			});
			expect(parseFloat(bar.style.width)).toBeCloseTo(50.0, 1);

			// 200ms -> 100/300 = 33.33%
			act(() => {
				vi.advanceTimersByTime(50);
			});
			expect(parseFloat(bar.style.width)).toBeCloseTo(33.33, 1);

			// 250ms -> 50/300 = 16.66%
			act(() => {
				vi.advanceTimersByTime(50);
			});
			expect(parseFloat(bar.style.width)).toBeCloseTo(16.66, 1);

			// 300ms -> 0% & dismiss
			act(() => {
				vi.advanceTimersByTime(50);
			});
			expect(onDismiss).toHaveBeenCalledWith(401);
		});
	});

	// ── Parameterized Invariant Tests across Matrix Dimensions ─────
	describe("Parameterized Invariant Tests across 5D Matrix", () => {
		const types: Array<ToastItemType["type"]> = ["error", "success", "info"];

		describe.each(types)("Invariant validation for auto-dismiss type '%s'", (type) => {
			it(`renders progress bar for type ${type}`, () => {
				const toast: ToastItemType = {
					id: 500,
					message: `Type ${type}`,
					type,
				};
				render(<ToastItem toast={toast} onDismiss={vi.fn()} />);
				expect(screen.getByTestId("toast-progress-bar-500")).toBeInTheDocument();
			});

			it(`applies proper progress bar color for type ${type}`, () => {
				const toast: ToastItemType = {
					id: 501,
					message: `Color ${type}`,
					type,
				};
				render(<ToastItem toast={toast} onDismiss={vi.fn()} />);
				const bar = screen.getByTestId("toast-progress-bar-501");
				expect(bar.className).toContain(PROGRESS_COLORS[type]);
			});

			it(`auto-dismisses type ${type} after 3000ms`, () => {
				const onDismiss = vi.fn();
				const toast: ToastItemType = {
					id: 502,
					message: `Timer ${type}`,
					type,
				};
				render(<ToastItem toast={toast} onDismiss={onDismiss} />);
				act(() => {
					vi.advanceTimersByTime(3000);
				});
				expect(onDismiss).toHaveBeenCalledWith(502);
			});

			it(`pauses type ${type} on mouseEnter`, () => {
				const onDismiss = vi.fn();
				const toast: ToastItemType = {
					id: 503,
					message: `Pause ${type}`,
					type,
				};
				render(<ToastItem toast={toast} onDismiss={onDismiss} />);
				const item = screen.getByTestId("toast-item-503");
				act(() => {
					fireEvent.mouseEnter(item);
				});
				act(() => {
					vi.advanceTimersByTime(5000);
				});
				expect(onDismiss).not.toHaveBeenCalled();
			});
		});

		const durations = [100, 250, 500, 1000, 1500, 2000, 3000, 4000, 5000];
		it.each(durations)("correctly respects custom duration of %d ms", (duration) => {
			const onDismiss = vi.fn();
			const toast: ToastItemType = {
				id: 600 + duration,
				message: `Duration ${duration}`,
				type: "info",
				duration,
			};
			render(<ToastItem toast={toast} onDismiss={onDismiss} />);

			act(() => {
				vi.advanceTimersByTime(duration - 50);
			});
			expect(onDismiss).not.toHaveBeenCalled();

			act(() => {
				vi.advanceTimersByTime(50);
			});
			expect(onDismiss).toHaveBeenCalledWith(600 + duration);
		});

		const counts = Array.from({ length: 20 }, (_, i) => i + 1);
		it.each(counts)(
			"correctly enforces MAX_VISIBLE_TOASTS=4 for %d total queued toasts",
			(total) => {
				act(() => {
					for (let i = 1; i <= total; i++) {
						useToastStore.getState().addToast(`Toast #${i}`, "info");
					}
				});
				render(<Toast />);
				const region = screen.getByRole("region", { name: "Notifications" });
				const expectedVisible = Math.min(total, MAX_VISIBLE_TOASTS);
				expect(region.children.length).toBe(expectedVisible);
			}
		);

		const percentageCheckpoints = [
			{ elapsed: 0, expectedPct: 100 },
			{ elapsed: 100, expectedPct: 90 },
			{ elapsed: 200, expectedPct: 80 },
			{ elapsed: 300, expectedPct: 70 },
			{ elapsed: 400, expectedPct: 60 },
			{ elapsed: 500, expectedPct: 50 },
			{ elapsed: 600, expectedPct: 40 },
			{ elapsed: 700, expectedPct: 30 },
			{ elapsed: 800, expectedPct: 20 },
			{ elapsed: 900, expectedPct: 10 },
		];
		it.each(percentageCheckpoints)(
			"matches expected progress width $expectedPct% after $elapsed ms",
			({ elapsed, expectedPct }) => {
				const toast: ToastItemType = {
					id: 700 + elapsed,
					message: `Pct check ${elapsed}`,
					type: "info",
					duration: 1000,
				};
				render(<ToastItem toast={toast} onDismiss={vi.fn()} />);

				if (elapsed > 0) {
					act(() => {
						vi.advanceTimersByTime(elapsed);
					});
				}
				const bar = screen.getByTestId(`toast-progress-bar-${700 + elapsed}`);
				expect(bar.style.width).toBe(`${expectedPct}%`);
			}
		);

		describe("Queue management and store clearing edge cases", () => {
			it("calling clearToasts() flushes both visible and pending queued toasts", () => {
				act(() => {
					for (let i = 1; i <= 8; i++) {
						useToastStore.getState().addToast(`Toast ${i}`, "info");
					}
				});
				render(<Toast />);
				const region = screen.getByRole("region", { name: "Notifications" });
				expect(region.children.length).toBe(4);

				act(() => {
					useToastStore.getState().clearToasts();
				});
				expect(region.children.length).toBe(0);
			});

			it("renders appropriate type styles for unknown or unmapped fallback type", () => {
				const toast: ToastItemType = {
					id: 801,
					message: "Fallback type",
					type: "custom" as unknown as ToastItemType["type"],
				};
				render(<ToastItem toast={toast} onDismiss={vi.fn()} />);
				const item = screen.getByTestId("toast-item-801");
				expect(item.className).toContain(TYPE_STYLES.info);
			});

			it("preserves action button styling and text on invitation toast", () => {
				const toast: ToastItemType = {
					id: 802,
					message: "Tournament Invite",
					type: "invitation",
					action: { label: "Join Bracket", onClick: vi.fn() },
				};
				render(<ToastItem toast={toast} onDismiss={vi.fn()} />);
				const btn = screen.getByTestId("toast-action-btn-802");
				expect(btn).toHaveTextContent("Join Bracket");
				expect(btn.className).toContain("rounded-lg");
				expect(btn.className).toContain("text-xs");
			});

			it("properly renders progress bar track with bottom positioning and overflow-hidden", () => {
				const toast: ToastItemType = {
					id: 803,
					message: "Track layout",
					type: "success",
				};
				render(<ToastItem toast={toast} onDismiss={vi.fn()} />);
				const track = screen.getByTestId("toast-progress-track-803");
				expect(track.className).toContain("absolute");
				expect(track.className).toContain("bottom-0");
				expect(track.className).toContain("h-1");
				expect(track.className).toContain("overflow-hidden");
			});

			it("verifies linear progress transition styling", () => {
				const toast: ToastItemType = {
					id: 804,
					message: "Linear transition",
					type: "error",
				};
				render(<ToastItem toast={toast} onDismiss={vi.fn()} />);
				const bar = screen.getByTestId("toast-progress-bar-804");
				expect(bar.className).toContain("transition-all");
				expect(bar.className).toContain("linear");
			});

			it("clicking X dismiss button does not trigger action callback on invitation", () => {
				const onAction = vi.fn();
				const onDismiss = vi.fn();
				const toast: ToastItemType = {
					id: 805,
					message: "Invite check",
					type: "invitation",
					action: { label: "Accept", onClick: onAction },
				};
				render(<ToastItem toast={toast} onDismiss={onDismiss} />);
				// Invitation toasts do not have dismiss X button, only action button
				expect(screen.queryByLabelText("Dismiss")).not.toBeInTheDocument();
				expect(onAction).not.toHaveBeenCalled();
			});

			it("calling removeToast with non-existent ID does not affect existing toasts", () => {
				act(() => {
					useToastStore.getState().addToast("Valid Toast", "info");
				});
				render(<Toast />);
				expect(screen.getByText("Valid Toast")).toBeInTheDocument();

				act(() => {
					useToastStore.getState().removeToast(999999);
				});
				expect(screen.getByText("Valid Toast")).toBeInTheDocument();
			});

			it("handles zero-width characters in message gracefully", () => {
				const toast: ToastItemType = {
					id: 806,
					message: "Hidden\u200BZeroWidth",
					type: "info",
				};
				render(<ToastItem toast={toast} onDismiss={vi.fn()} />);
				expect(screen.getByText("Hidden\u200BZeroWidth")).toBeInTheDocument();
			});

			it("maintains max 4 toasts across rapid asynchronous dequeue operations", () => {
				act(() => {
					for (let i = 1; i <= 6; i++) {
						useToastStore.getState().addToast(`Async ${i}`, "info", undefined, 200);
					}
				});
				render(<Toast />);
				const region = screen.getByRole("region", { name: "Notifications" });
				expect(region.children.length).toBe(4);

				// Step 1: 200ms -> first 4 dismiss, 5 and 6 appear (length = 2)
				act(() => {
					vi.advanceTimersByTime(200);
				});
				expect(region.children.length).toBe(2);
				expect(screen.getByText("Async 5")).toBeInTheDocument();
				expect(screen.getByText("Async 6")).toBeInTheDocument();

				// Step 2: 200ms -> remaining 2 dismiss
				act(() => {
					vi.advanceTimersByTime(200);
				});
				expect(region.children.length).toBe(0);
			});
		});
	});
});

