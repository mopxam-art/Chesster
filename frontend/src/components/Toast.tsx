// SPDX-License-Identifier: MIT
import { useState, useEffect, useRef, type MouseEvent } from "react";
import { Loader2, Gamepad2, X } from "lucide-react";
import {
	useToastStore,
	type Toast as ToastItemType,
	MAX_VISIBLE_TOASTS,
	DEFAULT_TOAST_DURATION,
	PROGRESS_TICK_INTERVAL_MS,
} from "../store/toastStore";


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

export interface ToastItemProps {
	toast: ToastItemType;
	onDismiss: (id: number) => void;
}

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
	const shouldAutoDismiss = toast.type !== "loading" && toast.type !== "invitation";
	const duration = toast.duration ?? DEFAULT_TOAST_DURATION;

	const [remainingMs, setRemainingMs] = useState(duration);
	const [isPaused, setIsPaused] = useState(false);
	const isPausedRef = useRef(false);
	const dismissedRef = useRef(false);

	useEffect(() => {
		dismissedRef.current = false;
		if (!shouldAutoDismiss || duration <= 0) {
			if (duration === 0 && shouldAutoDismiss) {
				if (!dismissedRef.current) {
					dismissedRef.current = true;
					onDismiss(toast.id);
				}
			}
			return;
		}

		const interval = setInterval(() => {
			if (isPausedRef.current) return;

			setRemainingMs((prev) => {
				const next = prev - PROGRESS_TICK_INTERVAL_MS;
				if (next <= 0) {
					clearInterval(interval);
					if (!dismissedRef.current) {
						dismissedRef.current = true;
						onDismiss(toast.id);
					}
					return 0;
				}
				return next;
			});
		}, PROGRESS_TICK_INTERVAL_MS);

		return () => clearInterval(interval);
	}, [toast.id, shouldAutoDismiss, duration, onDismiss]);

	const progress = duration > 0 ? Math.max(0, Math.min(100, (remainingMs / duration) * 100)) : 0;
	const progressBarColor = PROGRESS_COLORS[toast.type] ?? "bg-white/40";

	const handleMouseEnter = () => {
		isPausedRef.current = true;
		setIsPaused(true);
	};

	const handleMouseLeave = () => {
		isPausedRef.current = false;
		setIsPaused(false);
	};

	const handleBodyClick = () => {
		if (toast.type !== "loading" && toast.type !== "invitation") {
			if (!dismissedRef.current) {
				dismissedRef.current = true;
				onDismiss(toast.id);
			}
		}
	};

	const handleActionClick = (e: MouseEvent) => {
		e.stopPropagation();
		toast.action?.onClick();
		if (!dismissedRef.current) {
			dismissedRef.current = true;
			onDismiss(toast.id);
		}
	};

	const handleDismissClick = (e: MouseEvent) => {
		e.stopPropagation();
		if (!dismissedRef.current) {
			dismissedRef.current = true;
			onDismiss(toast.id);
		}
	};

	return (
		<div
			className={`relative overflow-hidden px-4 py-3 rounded-xl shadow-lg text-white flex items-center gap-2 transition-all duration-200 ease-out transform translate-y-0 opacity-100 ${
				TYPE_STYLES[toast.type] ?? TYPE_STYLES.info
			} ${toast.type === "loading" ? "cursor-default" : "cursor-pointer"}`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onClick={handleBodyClick}
			data-testid={`toast-item-${toast.id}`}
			data-toast-type={toast.type}
			data-is-paused={isPaused ? "true" : "false"}
		>
			{toast.type === "loading" && (
				<Loader2 size={16} className="animate-spin shrink-0" data-testid="toast-spinner" />
			)}
			{toast.type === "invitation" && (
				<Gamepad2 size={16} className="shrink-0 text-purple-200" data-testid="toast-gamepad" />
			)}
			<span className="flex-1 text-sm select-none">{toast.message}</span>

			{toast.type === "invitation" && toast.action && (
				<button
					type="button"
					onClick={handleActionClick}
					className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer"
					data-testid={`toast-action-btn-${toast.id}`}
				>
					{toast.action.label}
				</button>
			)}

			{toast.type !== "loading" && toast.type !== "invitation" && (
				<button
					type="button"
					onClick={handleDismissClick}
					className="text-white/60 hover:text-white transition-colors shrink-0 cursor-pointer"
					aria-label="Dismiss"
					data-testid={`toast-dismiss-btn-${toast.id}`}
				>
					<X size={14} />
				</button>
			)}

			{shouldAutoDismiss && (
				<div
					className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700/50 overflow-hidden rounded-b"
					data-testid={`toast-progress-track-${toast.id}`}
				>
					<div
						className={`h-full transition-all linear ${progressBarColor}`}
						style={{ width: `${progress}%` }}
						role="progressbar"
						aria-valuenow={Math.round(progress)}
						aria-valuemin={0}
						aria-valuemax={100}
						data-testid={`toast-progress-bar-${toast.id}`}
					/>
				</div>
			)}
		</div>
	);
}

export default function Toast() {
	const { toasts, removeToast } = useToastStore();
	const visibleToasts = toasts.slice(0, MAX_VISIBLE_TOASTS);

	return (
		<div
			className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs"
			role="region"
			aria-label="Notifications"
		>
			{visibleToasts.map((toast) => (
				<ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
			))}
		</div>
	);
}
