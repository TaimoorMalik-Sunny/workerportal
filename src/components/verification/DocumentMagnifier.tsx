'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  Crosshair,
  Pin,
  PinOff,
  Sparkles,
  Minimize2,
  Maximize2,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface DocumentMagnifierProps {
  children: React.ReactNode;
  documentTitle?: string;
  initialZoom?: number;
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
  previewWidth?: number;
  previewHeight?: number;
  className?: string;
  isExternalActive?: boolean;
}

// React 18/19 hydration-safe client-side check
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export const SUPPORTED_ZOOM_LEVELS = [2, 2.5, 3, 4] as const;

export function DocumentMagnifier({
  children,
  documentTitle = 'Document Verification Scan',
  initialZoom = 2.5,
  zoomLevel: controlledZoom,
  onZoomChange,
  previewWidth = 320,
  previewHeight = 210,
  className = '',
  isExternalActive = false,
}: DocumentMagnifierProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isMounted = React.useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  const [isHoveringDoc, setIsHoveringDoc] = React.useState(false);
  const [isHoveringHUD, setIsHoveringHUD] = React.useState(false);
  const [isPinned, setIsPinned] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [internalZoom, setInternalZoom] = React.useState(initialZoom);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [docDimensions, setDocDimensions] = React.useState({
    width: 0,
    height: 0,
  });

  const leaveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const activeZoom =
    controlledZoom !== undefined ? controlledZoom : internalZoom;

  const handleZoomChange = React.useCallback(
    (newZoom: number) => {
      setInternalZoom(newZoom);
      onZoomChange?.(newZoom);
    },
    [onZoomChange]
  );

  // Dynamic dimension observer for the target document
  const updateDimensions = React.useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDocDimensions({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    }
  }, []);

  React.useEffect(() => {
    updateDimensions();

    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        updateDimensions();
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    } else {
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, [updateDimensions]);

  React.useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  // Track pointer coordinates relative to document container
  const handlePointerMove = (clientX: number, clientY: number) => {
    if (isPinned) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));

    setMousePos({ x, y });
    if (
      Math.abs(docDimensions.width - rect.width) > 2 ||
      Math.abs(docDimensions.height - rect.height) > 2
    ) {
      setDocDimensions({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    }
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isExternalActive) return;
    handlePointerMove(e.clientX, e.clientY);
  };

  const onMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    if (!isExternalActive) return;
    setIsHoveringDoc(true);
    setIsDismissed(false);
    handlePointerMove(e.clientX, e.clientY);
  };

  const onMouseLeave = () => {
    if (!isPinned) {
      // Grace period (400ms) allowing the user to move cursor from document to the Loupe HUD without closing
      leaveTimeoutRef.current = setTimeout(() => {
        setIsHoveringDoc(false);
      }, 400);
    }
  };

  const onHUDMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsHoveringHUD(true);
  };

  const onHUDMouseLeave = () => {
    setIsHoveringHUD(false);
    if (!isPinned) {
      setIsHoveringDoc(false);
    }
  };

  // Touch Support
  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isExternalActive) return;
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handlePointerMove(touch.clientX, touch.clientY);
    }
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    if (!isExternalActive) return;
    setIsHoveringDoc(true);
    setIsDismissed(false);
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handlePointerMove(touch.clientX, touch.clientY);
    }
  };

  // Mouse wheel zoom support: scrolling wheel over document steps zoom intensity smoothly
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!isExternalActive) return;
    // Prevent document zoom from interfering with normal page scroll unless active
    e.stopPropagation();
    if (e.deltaY < 0) {
      // Scroll Up: Increase zoom
      if (activeZoom < 2.5) handleZoomChange(2.5);
      else if (activeZoom < 3) handleZoomChange(3);
      else if (activeZoom < 4) handleZoomChange(4);
    } else if (e.deltaY > 0) {
      // Scroll Down: Decrease zoom
      if (activeZoom > 3) handleZoomChange(3);
      else if (activeZoom > 2.5) handleZoomChange(2.5);
      else if (activeZoom > 2) handleZoomChange(2);
    }
  };

  const handleTogglePin = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsPinned((prev) => !prev);
    if (!isPinned) {
      setIsHoveringDoc(true);
      setIsDismissed(false);
    }
  };

  // Dimensions of the reticle rectangular lens on the source document
  const lensWidth = Math.min(
    Math.round(previewWidth / activeZoom),
    Math.max(Math.round(docDimensions.width * 0.8), 60)
  );
  const lensHeight = Math.min(
    Math.round(previewHeight / activeZoom),
    Math.max(Math.round(docDimensions.height * 0.8), 40)
  );

  // Clamped coordinates to keep reticle within document borders
  const maxLensX = Math.max(docDimensions.width - lensWidth, 0);
  const maxLensY = Math.max(docDimensions.height - lensHeight, 0);

  const lensX = Math.max(0, Math.min(mousePos.x - lensWidth / 2, maxLensX));
  const lensY = Math.max(0, Math.min(mousePos.y - lensHeight / 2, maxLensY));

  // The center point of the lens being magnified
  const lensCenterX = lensX + lensWidth / 2;
  const lensCenterY = lensY + lensHeight / 2;

  // Zoomed viewport translation: precisely centers the lens region
  const translateX = previewWidth / 2 - lensCenterX * activeZoom;
  const translateY = previewHeight / 2 - lensCenterY * activeZoom;

  // Percentage readout for inspector HUD
  const percentX = docDimensions.width
    ? Math.round((lensCenterX / docDimensions.width) * 100)
    : 50;
  const percentY = docDimensions.height
    ? Math.round((lensCenterY / docDimensions.height) * 100)
    : 50;

  const showLoupe =
    (isHoveringDoc || isHoveringHUD || isPinned) &&
    isExternalActive &&
    !isDismissed &&
    docDimensions.width > 0;

  // Render the external floating Picture-in-Picture window into document.body
  const renderExternalLoupeHUD = () => {
    if (!isMounted || !showLoupe || typeof document === 'undefined')
      return null;

    // Minimized Floating Pill State
    if (isMinimized) {
      return createPortal(
        <div
          onMouseEnter={onHUDMouseEnter}
          onMouseLeave={onHUDMouseLeave}
          className="fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-full border-2 border-[#13c2b6] bg-[#0a1630] px-4 py-2 text-white shadow-xl backdrop-blur-md"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#13c2b6] opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-[#13c2b6]" />
          </span>
          <span className="font-orbitron text-xs font-bold text-[#13c2b6]">
            Loupe {activeZoom}x Active
          </span>
          <span className="font-mono text-[10px] text-slate-300">
            ({percentX}%, {percentY}%)
          </span>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsMinimized(false)}
            title="Expand Optical Loupe"
            className="size-6 text-white hover:bg-white/20"
          >
            <Maximize2 className="size-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setIsPinned(false);
              setIsHoveringDoc(false);
              setIsHoveringHUD(false);
              setIsDismissed(true);
            }}
            title="Dismiss"
            className="size-6 text-white hover:bg-white/20"
          >
            <X className="size-3.5" />
          </Button>
        </div>,
        document.body
      );
    }

    // Full High-Resolution External Inspection Window (Docked away from document)
    return createPortal(
      <aside
        aria-label="Document Magnifier HUD"
        onMouseEnter={onHUDMouseEnter}
        onMouseLeave={onHUDMouseLeave}
        style={{ width: `${previewWidth}px`, maxWidth: '94vw' }}
        className="animate-in fade-in slide-in-from-bottom-3 fixed right-6 bottom-6 z-50 overflow-hidden rounded-2xl border-2 border-[#13c2b6]/70 bg-white shadow-[0px_20px_50px_rgba(8,27,88,0.28)] transition-all duration-200 select-none"
      >
        {/* Header Bar with Zoom Intensity Controls */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#0a1630] px-3.5 py-2 text-white">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#13c2b6] opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-[#13c2b6]" />
            </span>
            <span className="font-orbitron text-[11px] font-bold tracking-wider text-[#13c2b6]">
              FORENSIC LOUPE
            </span>
            <Badge className="h-4.5 border-none bg-[#13c2b6]/20 px-1.5 font-mono text-[9px] font-bold text-[#87cbde]">
              {activeZoom}x
            </Badge>
          </div>

          {/* Interactive Zoom Intensity Buttons (2x, 2.5x, 3x, 4x) */}
          <div className="flex items-center gap-1">
            <div className="flex items-center rounded bg-white/10 p-0.5">
              {SUPPORTED_ZOOM_LEVELS.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomChange(z);
                  }}
                  title={`Switch Zoom Intensity to ${z}x`}
                  className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold transition-all ${
                    activeZoom === z
                      ? 'bg-[#13c2b6] text-[#0a1630] shadow-xs'
                      : 'text-white/80 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {z}x
                </button>
              ))}
            </div>

            {/* Pin Action */}
            <Button
              size="icon"
              variant="ghost"
              onClick={handleTogglePin}
              title={isPinned ? 'Unpin Focus (Tracking)' : 'Pin Focus on Spot'}
              className={`size-6 rounded ${
                isPinned
                  ? 'bg-[#13c2b6] text-[#0a1630]'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              {isPinned ? (
                <Pin className="size-3" />
              ) : (
                <PinOff className="size-3" />
              )}
            </Button>

            {/* Minimize Action */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsMinimized(true)}
              title="Minimize to Floating Pill"
              className="size-6 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Minimize2 className="size-3" />
            </Button>

            {/* Close Action */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setIsPinned(false);
                setIsHoveringDoc(false);
                setIsHoveringHUD(false);
                setIsDismissed(true);
              }}
              title="Close Loupe Inspector"
              className="size-6 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <X className="size-3" />
            </Button>
          </div>
        </div>

        {/* High-Resolution Magnified Viewport */}
        <div
          style={{
            width: `${previewWidth}px`,
            height: `${previewHeight}px`,
          }}
          className="relative overflow-hidden bg-slate-950"
        >
          {/* Cloned Scaled Content */}
          <div
            style={{
              width: `${docDimensions.width}px`,
              height: `${docDimensions.height}px`,
              transform: `translate(${translateX}px, ${translateY}px) scale(${activeZoom})`,
              transformOrigin: '0 0',
              willChange: 'transform',
            }}
            className="pointer-events-none absolute top-0 left-0"
          >
            {children}
          </div>

          {/* Central Precision Forensic Crosshairs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-1/2 left-0 h-[1px] w-full -translate-y-1/2 bg-gradient-to-r from-[#13c2b6]/0 via-[#13c2b6]/40 to-[#13c2b6]/0" />
            <div className="absolute top-0 left-1/2 h-full w-[1px] -translate-x-1/2 bg-gradient-to-b from-[#13c2b6]/0 via-[#13c2b6]/40 to-[#13c2b6]/0" />
            <div className="absolute top-1/2 left-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#13c2b6]/60 bg-[#13c2b6]/10" />
            <div className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#13c2b6]" />
          </div>

          {/* Live Telemetry Pill with Instructions */}
          <div className="pointer-events-none absolute right-2.5 bottom-2.5 left-2.5 flex items-center justify-between rounded-md bg-[#0a1630]/90 px-2.5 py-1 text-[10px] text-white/90 backdrop-blur-sm">
            <span className="font-mono text-[9px] text-[#87cbde]">
              X: {percentX}% · Y: {percentY}% ({activeZoom}x)
            </span>
            <span className="truncate pl-2 text-[9px] font-medium text-white/80">
              {isPinned ? '📌 Focus Pinned' : 'Click document to Pin focus'}
            </span>
          </div>
        </div>

        {/* Footer Sub-Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-3 py-1.5 text-[10px] text-slate-600">
          <span className="flex items-center gap-1 font-semibold text-[#009588]">
            <Sparkles className="size-3 text-[#13c2b6]" />
            <span>Forensic Loupe Screen</span>
          </span>
          <span className="truncate pl-2 font-mono text-[9px] text-slate-500">
            {documentTitle}
          </span>
        </div>
      </aside>,
      document.body
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Target Document Wrapper - Stays 100% Unobstructed */}
      <div
        ref={containerRef}
        onMouseMove={onMouseMove}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onTouchMove={onTouchMove}
        onTouchStart={onTouchStart}
        onWheel={onWheel}
        onClick={() => {
          if (isExternalActive && isHoveringDoc) {
            handleTogglePin();
          }
        }}
        className={`group relative overflow-hidden select-none ${
          isExternalActive ? 'cursor-crosshair' : 'cursor-default'
        }`}
      >
        {children}

        {/* ONLY the Reticle Rectangular Lens appears on the source document */}
        {showLoupe && (
          <div
            style={{
              width: `${lensWidth}px`,
              height: `${lensHeight}px`,
              transform: `translate3d(${lensX}px, ${lensY}px, 0)`,
              transition: isPinned ? 'none' : 'transform 0.03s ease-out',
            }}
            className="pointer-events-none absolute top-0 left-0 z-30 rounded-lg border-2 border-[#13c2b6] bg-[#13c2b6]/15 shadow-md backdrop-brightness-105"
          >
            {/* 4 Precision Forensic Corner Brackets */}
            <div className="absolute -top-1 -left-1 size-2 border-t-2 border-l-2 border-[#009588]" />
            <div className="absolute -top-1 -right-1 size-2 border-t-2 border-r-2 border-[#009588]" />
            <div className="absolute -bottom-1 -left-1 size-2 border-b-2 border-l-2 border-[#009588]" />
            <div className="absolute -right-1 -bottom-1 size-2 border-r-2 border-b-2 border-[#009588]" />

            {/* Central Target Crosshair (+) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Crosshair className="size-4 text-[#009588] drop-shadow-xs" />
            </div>

            {/* Subtle Zoom Badge */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-[#0a1630]/95 px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-wider text-[#13c2b6] uppercase shadow-xs">
              {activeZoom}x Focus {isPinned ? '📌' : ''}
            </div>
          </div>
        )}
      </div>

      {/* The Zoomed Viewport renders OUTSIDE the document in document.body via Portal */}
      {renderExternalLoupeHUD()}
    </div>
  );
}
