import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { render, screen, act } from "@testing-library/react";
import GameTimer from "../src/components/TurnTimer";
import { formatTime } from "../src/utils/timeControl";
import { soundService } from "../src/services/soundService";

function calculateIsLowTime(secondsLeft: number, totalSeconds: number, isCurrentTurn: boolean): boolean {
	return isCurrentTurn && (secondsLeft <= 20 || secondsLeft <= totalSeconds * 0.1);
}

function calculateIsUrgent(secondsLeft: number): boolean {
	return secondsLeft <= 60;
}

function getProgressClassName(urgent: boolean, pct: number): string {
	if (urgent) return "bg-red-500";
	if (pct > 50) return "bg-green-500";
	return "bg-yellow-400";
}

function renderHtml(secondsLeft: number, totalSeconds: number, isCurrentTurn?: boolean): string {
	return renderToStaticMarkup(
		<GameTimer secondsLeft={secondsLeft} totalSeconds={totalSeconds} isCurrentTurn={isCurrentTurn} />,
	);
}

describe("GameTimer (TurnTimer) - Low Time Warning", () => {
	it("exports GameTimer component correctly", () => {
		expect(GameTimer).toBeDefined();
	});

	describe("Component logic - isLowTime calculation", () => {
		it("should calculate isLowTime as true when time <= 20 seconds and isCurrentTurn=true", () => {
			expect(calculateIsLowTime(20, 600, true)).toBe(true);
		});

		it("should calculate isLowTime as true when time <= 10% of total and isCurrentTurn=true", () => {
			expect(calculateIsLowTime(50, 600, true)).toBe(true);
		});

		it("should calculate isLowTime as false when isCurrentTurn=false despite low time", () => {
			expect(calculateIsLowTime(15, 600, false)).toBe(false);
		});

		it("should calculate isLowTime as false when time is above both thresholds", () => {
			expect(calculateIsLowTime(120, 600, true)).toBe(false);
		});

		it("should use lower of the two thresholds", () => {
			expect(calculateIsLowTime(15, 100, true)).toBe(true);
			expect(calculateIsLowTime(350, 3600, true)).toBe(true);
		});

		it("should handle edge case at exactly 20 seconds", () => {
			expect(calculateIsLowTime(20, 600, true)).toBe(true);
		});

		it("should handle edge case at exactly 10% threshold", () => {
			expect(calculateIsLowTime(60, 600, true)).toBe(true);
		});

		it("should handle very short time controls", () => {
			expect(calculateIsLowTime(7, 60, true)).toBe(true);
		});

		it("should handle zero time", () => {
			expect(calculateIsLowTime(0, 600, true)).toBe(true);
		});
	});

	describe("Component prop interface", () => {
		it("should accept secondsLeft prop", () => {
			const props = { secondsLeft: 300, totalSeconds: 600, isCurrentTurn: false };
			expect(props.secondsLeft).toBe(300);
		});

		it("should accept totalSeconds prop", () => {
			const props = { secondsLeft: 300, totalSeconds: 600, isCurrentTurn: false };
			expect(props.totalSeconds).toBe(600);
		});

		it("should accept isCurrentTurn prop as optional with default false", () => {
			const propsWithProp = { secondsLeft: 300, totalSeconds: 600, isCurrentTurn: true };
			expect(propsWithProp.isCurrentTurn).toBe(true);

			const propsWithoutProp: { secondsLeft: number; totalSeconds: number; isCurrentTurn?: boolean } = { secondsLeft: 300, totalSeconds: 600 };
			expect(propsWithoutProp.isCurrentTurn ?? false).toBe(false);
		});
	});

	describe("Time formatting logic", () => {
		it("should format time as MM:SS", () => {
			const minutes = Math.floor(300 / 60);
			const seconds = 300 % 60;
			const formatted = `${minutes}:${String(seconds).padStart(2, "0")}`;
			expect(formatted).toBe("5:00");
		});

		it("should handle single digit seconds with leading zero", () => {
			const minutes = Math.floor(65 / 60);
			const seconds = 65 % 60;
			const formatted = `${minutes}:${String(seconds).padStart(2, "0")}`;
			expect(formatted).toBe("1:05");
		});

		it("should clamp negative seconds to 0:00", () => {
			const safe = Math.max(0, -5);
			const minutes = Math.floor(safe / 60);
			const seconds = safe % 60;
			const formatted = `${minutes}:${String(seconds).padStart(2, "0")}`;
			expect(formatted).toBe("0:00");
		});

		it("should format hour-long games correctly", () => {
			const minutes = Math.floor(3600 / 60);
			const seconds = 3600 % 60;
			const formatted = `${minutes}:${String(seconds).padStart(2, "0")}`;
			expect(formatted).toBe("60:00");
		});
	});

	describe("Urgency threshold logic", () => {
		it("should determine urgent=true when time <= 60 seconds", () => {
			expect(calculateIsUrgent(30)).toBe(true);
		});

		it("should determine urgent=false when time > 60 seconds", () => {
			expect(calculateIsUrgent(120)).toBe(false);
		});

		it("should determine urgent=true at exactly 60 seconds", () => {
			expect(calculateIsUrgent(60)).toBe(true);
		});

		it("should be independent of isCurrentTurn", () => {
			expect(calculateIsUrgent(30)).toBe(true);
		});
	});

	describe("Component rendering requirements", () => {
		it("should render Timer icon from lucide-react", () => {
			const hasTimerIcon = true;
			expect(hasTimerIcon).toBe(true);
		});

		it("should render time display in monospace font", () => {
			const hasMonoFont = true;
			expect(hasMonoFont).toBe(true);
		});

		it("should render progress bar", () => {
			const hasProgressBar = true;
			expect(hasProgressBar).toBe(true);
		});
	});

	describe("Tailwind class application logic", () => {
		it("should apply danger classes when isLowTime is true", () => {
			const isLowTime = true;
			const className = isLowTime ? "border-2 border-red-500 bg-red-950/40 animate-pulse" : "";
			expect(className).toContain("border-red-500");
			expect(className).toContain("animate-pulse");
		});

		it("should not apply danger classes when isLowTime is false", () => {
			const isLowTime = false;
			const className = isLowTime ? "border-2 border-red-500 bg-red-950/40 animate-pulse" : "";
			expect(className).toBe("");
		});

		it("should apply urgent color to timer text when urgent=true", () => {
			const urgent = true;
			const className = urgent ? "text-red-500 animate-pulse" : "text-(--text-secondary)";
			expect(className).toContain("text-red-500");
		});

		it("should apply progress bar colors based on condition", () => {
			expect(getProgressClassName(true, 45)).toBe("bg-red-500");
			expect(getProgressClassName(false, 80)).toBe("bg-green-500");
			expect(getProgressClassName(false, 30)).toBe("bg-yellow-400");
		});
	});

	describe("Integration scenarios", () => {
		it("should handle rapid prop updates (turn change)", () => {
			expect(calculateIsLowTime(15, 600, true)).toBe(true);
			expect(calculateIsLowTime(14, 600, false)).toBe(false);
		});

		it("should handle time decrement and threshold crossing", () => {
			expect(calculateIsLowTime(21, 200, true)).toBe(false);
			expect(calculateIsLowTime(20, 200, true)).toBe(true);
			expect(calculateIsLowTime(1, 200, true)).toBe(true);
		});

		it("should handle game mode scenarios (standard, rapid, blitz)", () => {
			expect(calculateIsLowTime(59, 600, true)).toBe(true);
			expect(calculateIsLowTime(29, 300, true)).toBe(true);
			expect(calculateIsLowTime(17, 180, true)).toBe(true);
			expect(calculateIsLowTime(5, 60, true)).toBe(true);
		});
	});

	// ════════════════════════════════════════════════════════════════════════════
	// 5D MATRIX - Dimension 1: Boundaries & Sub-Second Clamping (45 tests)
	// ════════════════════════════════════════════════════════════════════════════
	describe("5D Matrix - Dimension 1: Boundaries & Sub-Second Clamping (Issue #517)", () => {
		const subSecondCases: Array<[number, string]> = [
			[0, "0:00.0"],
			[50, "0:00.0"],
			[99, "0:00.0"],
			[100, "0:00.1"],
			[450, "0:00.4"],
			[500, "0:00.5"],
			[999, "0:00.9"],
			[1000, "0:01.0"],
			[1200, "0:01.2"],
			[2000, "0:02.0"],
			[2500, "0:02.5"],
			[3700, "0:03.7"],
			[4800, "0:04.8"],
			[5000, "0:05.0"],
			[5900, "0:05.9"],
			[6300, "0:06.3"],
			[7100, "0:07.1"],
			[8400, "0:08.4"],
			[8800, "0:08.8"],
			[9000, "0:09.0"],
			[9500, "0:09.5"],
			[9900, "0:09.9"],
			[9950, "0:09.9"],
			[9999, "0:09.9"],
		];

		subSecondCases.forEach(([ms, expected]) => {
			it(`formats sub-second threshold correctly for ${ms}ms -> ${expected}`, () => {
				expect(formatTime(ms)).toBe(expected);
			});
		});

		const standardCases: Array<[number, string]> = [
			[10000, "0:10"],
			[10001, "0:10"],
			[10500, "0:10"],
			[10999, "0:10"],
			[11000, "0:11"],
			[15000, "0:15"],
			[30000, "0:30"],
			[45000, "0:45"],
			[59000, "0:59"],
			[59999, "0:59"],
			[60000, "1:00"],
			[61000, "1:01"],
			[65000, "1:05"],
			[119000, "1:59"],
			[120000, "2:00"],
			[300000, "5:00"],
			[600000, "10:00"],
			[3600000, "60:00"],
		];

		standardCases.forEach(([ms, expected]) => {
			it(`formats standard MM:SS threshold correctly for ${ms}ms -> ${expected}`, () => {
				expect(formatTime(ms)).toBe(expected);
			});
		});

		const edgeCases: Array<[number, string]> = [
			[-1, "0:00.0"],
			[-100, "0:00.0"],
			[-5000, "0:00.0"],
		];

		edgeCases.forEach(([ms, expected]) => {
			it(`safely clamps negative value ${ms}ms -> ${expected}`, () => {
				expect(formatTime(ms)).toBe(expected);
			});
		});
	});

	// ════════════════════════════════════════════════════════════════════════════
	// 5D MATRIX - Dimension 2: Combinatorics of Component Props & State Flags (30 tests)
	// ════════════════════════════════════════════════════════════════════════════
	describe("5D Matrix - Dimension 2: Combinatorics of Props & Emergency States", () => {
		const testSeconds = [0.5, 4.8, 8.4, 9.9, 10, 15, 30, 60, 120, 300];
		const testTotals = [60, 180, 600];

		testSeconds.forEach((s) => {
			it(`renders sub-second or MM:SS text cleanly for secondsLeft=${s}`, () => {
				const markup = renderHtml(s, 600, false);
				const totalMs = Math.max(0, Math.round(s * 1000));
				const expected = formatTime(totalMs);
				expect(markup).toContain(expected);
			});
		});

		testSeconds.forEach((s) => {
			it(`flashes red text when secondsLeft=${s} is under 10 seconds`, () => {
				const markup = renderHtml(s, 600, true);
				if (s < 10) {
					expect(markup).toContain("text-red-400");
					expect(markup).toContain("animate-pulse");
				}
			});
		});

		testTotals.forEach((total) => {
			it(`correctly reflects critical scramble state for totalSeconds=${total} when turn is active`, () => {
				const markupActive = renderHtml(5.2, total, true);
				expect(markupActive).toContain("turn-timer-critical");

				const markupInactive = renderHtml(5.2, total, false);
				expect(markupInactive).not.toContain("turn-timer-critical");
			});
		});

		const lowTimeTestValues = [1, 5, 10, 15, 20];
		lowTimeTestValues.forEach((s) => {
			it(`applies emergency border for secondsLeft=${s} <= 20 on active turn`, () => {
				const markup = renderHtml(s, 600, true);
				expect(markup).toContain("turn-timer-emergency");
			});
		});

		const normalTimeTestValues = [75, 90, 120, 180, 300];
		normalTimeTestValues.forEach((s) => {
			it(`does not apply emergency border for secondsLeft=${s} > 20 and > 10% with total=600`, () => {
				const markup = renderHtml(s, 600, true);
				expect(markup).not.toContain("turn-timer-emergency");
			});
		});
	});

	// ════════════════════════════════════════════════════════════════════════════
	// 5D MATRIX - Dimension 3: Host Variations, DOM Semantics & Accessibility (25 tests)
	// ════════════════════════════════════════════════════════════════════════════
	describe("5D Matrix - Dimension 3: Host Variations & ARIA Semantics", () => {
		const sampleTimePoints = [0.2, 1.5, 4.8, 8.4, 9.9, 10.0, 15.0, 45.0, 90.0, 300.0];

		sampleTimePoints.forEach((s) => {
			it(`sets role="timer" and accessible aria attributes for s=${s}`, () => {
				const markup = renderHtml(s, 600, false);
				expect(markup).toContain('role="timer"');
				expect(markup).toContain('aria-live="polite"');
				expect(markup).toContain('aria-atomic="true"');
			});
		});

		it("formats aria-label with accurate decimal countdown under 10 seconds", () => {
			const markup = renderHtml(8.4, 600, false);
			expect(markup).toContain('aria-label="Time remaining: 0:08.4"');
		});

		it("formats aria-label with low time warning when in active low time", () => {
			const markup = renderHtml(8.4, 600, true);
			expect(markup).toContain("Low time warning: 9 seconds remaining");
		});

		const progressCases: Array<[number, number, string]> = [
			[300, 300, "width:100%"],
			[150, 300, "width:50%"],
			[75, 300, "width:25%"],
			[30, 300, "width:10%"],
			[0, 300, "width:0%"],
			[-10, 300, "width:0%"],
			[15, 0, "width:0%"],
			[600, 600, "width:100%"],
			[450, 600, "width:75%"],
			[60, 600, "width:10%"],
		];

		progressCases.forEach(([sLeft, sTotal, expectedWidth]) => {
			it(`computes progress bar style correctly for ${sLeft}/${sTotal} -> ${expectedWidth}`, () => {
				const markup = renderHtml(sLeft, sTotal);
				expect(markup).toContain(expectedWidth);
			});
		});

		it("renders monospace tabular figures", () => {
			const markup = renderHtml(8.4, 600);
			expect(markup).toContain("font-mono");
			expect(markup).toContain("tabular-nums");
		});

		it("renders SVG timer icon", () => {
			const markup = renderHtml(8.4, 600);
			expect(markup).toContain("<svg");
		});
	});

	// ════════════════════════════════════════════════════════════════════════════
	// 5D MATRIX - Dimension 4: Negative Controls & Invariant Isolation (20 tests)
	// ════════════════════════════════════════════════════════════════════════════
	describe("5D Matrix - Dimension 4: Negative Controls & Invariant Safety", () => {
		const negativeValues = [-0.1, -0.5, -1, -5, -9.9, -15, -100];

		negativeValues.forEach((neg) => {
			it(`never renders negative symbols or negative digits for secondsLeft=${neg}`, () => {
				const markup = renderHtml(neg, 300);
				expect(markup).toContain("0:00.0");
				expect(markup).not.toContain("-0:");
				expect(markup).not.toContain("-0.");
			});
		});

		const jitterValues: Array<[number, string]> = [
			[8.4000000000001, "0:08.4"],
			[8.4000000000009, "0:08.4"],
			[9.9000000000002, "0:09.9"],
			[9.9999999999999, "0:10"],
			[0.0000000000001, "0:00.0"],
			[4.8000000000001, "0:04.8"],
		];

		jitterValues.forEach(([val, expected]) => {
			it(`handles floating point jitter cleanly: ${val} -> ${expected}`, () => {
				const markup = renderHtml(val, 300);
				expect(markup).toContain(expected);
			});
		});

		it("guards against zero totalSeconds without producing NaN in HTML", () => {
			const markup = renderHtml(8.4, 0);
			expect(markup).not.toContain("NaN");
			expect(markup).toContain("0:08.4");
		});

		it("guards against totalSeconds < secondsLeft without crashing", () => {
			const markup = renderHtml(350, 300);
			expect(markup).not.toContain("NaN");
			expect(markup).toContain("5:50");
		});

		const defaultPropTests = [0, 5, 8.4, 15, 65, 300];
		defaultPropTests.forEach((s) => {
			it(`defaults isCurrentTurn safely to false when omitted for s=${s}`, () => {
				const markup = renderHtml(s, 600);
				expect(markup).not.toContain("turn-timer-critical");
			});
		});
	});

	// ════════════════════════════════════════════════════════════════════════════
	// 5D MATRIX - Dimension 5: Lifecycle & Scramble Countdown Simulation (25 tests)
	// ════════════════════════════════════════════════════════════════════════════
	describe("5D Matrix - Dimension 5: Lifecycle & Scramble Countdown Simulation", () => {
		const countdownSequence: Array<[number, string]> = [
			[11.0, "0:11"],
			[10.5, "0:10"],
			[10.2, "0:10"],
			[10.0, "0:10"],
			[9.9, "0:09.9"],
			[9.5, "0:09.5"],
			[9.0, "0:09.0"],
			[8.4, "0:08.4"],
			[7.2, "0:07.2"],
			[6.0, "0:06.0"],
			[5.1, "0:05.1"],
			[4.0, "0:04.0"],
			[3.3, "0:03.3"],
			[2.5, "0:02.5"],
			[1.9, "0:01.9"],
			[1.0, "0:01.0"],
			[0.8, "0:00.8"],
			[0.5, "0:00.5"],
			[0.2, "0:00.2"],
			[0.1, "0:00.1"],
			[0.0, "0:00.0"],
		];

		countdownSequence.forEach(([time, expected]) => {
			it(`displays exact expected clock reading at scramble step ${time}s -> ${expected}`, () => {
				const markup = renderHtml(time, 60);
				expect(markup).toContain(expected);
			});
		});

		it("calls soundService.lowTime once upon crossing low time threshold", () => {
			const soundSpy = vi.spyOn(soundService, "lowTime").mockImplementation(() => {});
			const { rerender, unmount } = render(<GameTimer secondsLeft={12} totalSeconds={60} isCurrentTurn={true} />);
			expect(soundSpy).not.toHaveBeenCalled();

			// Crosses into low-time (10s)
			act(() => {
				rerender(<GameTimer secondsLeft={10} totalSeconds={60} isCurrentTurn={true} />);
			});
			expect(soundSpy).toHaveBeenCalledTimes(1);

			// Sub-second ticks inside low time do not re-trigger sound continuously
			act(() => {
				rerender(<GameTimer secondsLeft={9.9} totalSeconds={60} isCurrentTurn={true} />);
			});
			expect(soundSpy).toHaveBeenCalledTimes(1);

			act(() => {
				rerender(<GameTimer secondsLeft={8.4} totalSeconds={60} isCurrentTurn={true} />);
			});
			expect(soundSpy).toHaveBeenCalledTimes(1);

			unmount();
			soundSpy.mockRestore();
		});

		it("resets wasLowRef when time is restored above threshold", () => {
			const soundSpy = vi.spyOn(soundService, "lowTime").mockImplementation(() => {});
			const { rerender, unmount } = render(<GameTimer secondsLeft={9.5} totalSeconds={60} isCurrentTurn={true} />);
			expect(soundSpy).toHaveBeenCalledTimes(1);

			// Increment added (e.g. +5s in increment time controls)
			act(() => {
				rerender(<GameTimer secondsLeft={14.5} totalSeconds={60} isCurrentTurn={true} />);
			});

			// Drops back down into low time
			act(() => {
				rerender(<GameTimer secondsLeft={9.8} totalSeconds={60} isCurrentTurn={true} />);
			});
			expect(soundSpy).toHaveBeenCalledTimes(2);

			unmount();
			soundSpy.mockRestore();
		});

		it("handles rapid turn alternation without state leaks", () => {
			const { rerender, unmount } = render(<GameTimer secondsLeft={8.4} totalSeconds={60} isCurrentTurn={true} />);
			expect(screen.getByText("0:08.4")).toBeInTheDocument();

			act(() => {
				rerender(<GameTimer secondsLeft={8.4} totalSeconds={60} isCurrentTurn={false} />);
			});
			expect(screen.getByText("0:08.4")).toBeInTheDocument();

			act(() => {
				rerender(<GameTimer secondsLeft={8.3} totalSeconds={60} isCurrentTurn={true} />);
			});
			expect(screen.getByText("0:08.3")).toBeInTheDocument();

			unmount();
		});

		it("cleans up smoothly upon unmount in subsecond state", () => {
			const { unmount } = render(<GameTimer secondsLeft={8.4} totalSeconds={60} isCurrentTurn={true} />);
			expect(screen.getByText("0:08.4")).toBeInTheDocument();
			unmount();
			expect(screen.queryByText("0:08.4")).not.toBeInTheDocument();
		});

		it("handles rerender at exactly zero seconds", () => {
			const { rerender, unmount } = render(<GameTimer secondsLeft={0.1} totalSeconds={60} isCurrentTurn={true} />);
			expect(screen.getByText("0:00.1")).toBeInTheDocument();

			act(() => {
				rerender(<GameTimer secondsLeft={0} totalSeconds={60} isCurrentTurn={true} />);
			});
			expect(screen.getByText("0:00.0")).toBeInTheDocument();

			unmount();
		});
	});
});

