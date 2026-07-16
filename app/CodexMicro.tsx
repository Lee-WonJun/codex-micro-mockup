"use client";

/* eslint-disable @next/next/no-img-element -- exact layered assets are intentionally unoptimized */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

type ControlKind =
  | "agent-key"
  | "command-key"
  | "dial"
  | "joystick"
  | "touch";

type NormalizedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ControlSpec = {
  id: string;
  kind: ControlKind;
  asset: string;
  rect: NormalizedRect;
  ariaLabel: string;
};

export const CONTROL_SPECS: readonly ControlSpec[] = [
  {
    id: "joystick",
    kind: "joystick",
    asset: "joystick.webp",
    rect: { x: 0.170654, y: 0.145933, width: 0.133971, height: 0.133971 },
    ariaLabel: "Move joystick",
  },
  {
    id: "agent-1",
    kind: "agent-key",
    asset: "agent.webp",
    rect: { x: 0.339713, y: 0.151515, width: 0.136364, height: 0.144338 },
    ariaLabel: "Agent key 1",
  },
  {
    id: "agent-2",
    kind: "agent-key",
    asset: "agent.webp",
    rect: { x: 0.515949, y: 0.151515, width: 0.136364, height: 0.144338 },
    ariaLabel: "Agent key 2",
  },
  {
    id: "dial",
    kind: "dial",
    asset: "dial.webp",
    rect: { x: 0.700957, y: 0.161085, width: 0.11563, height: 0.11563 },
    ariaLabel: "Rotate dial",
  },
  {
    id: "agent-3",
    kind: "agent-key",
    asset: "agent.webp",
    rect: { x: 0.167464, y: 0.318182, width: 0.136364, height: 0.144338 },
    ariaLabel: "Agent key 3",
  },
  {
    id: "agent-4",
    kind: "agent-key",
    asset: "agent.webp",
    rect: { x: 0.338916, y: 0.318182, width: 0.136364, height: 0.144338 },
    ariaLabel: "Agent key 4",
  },
  {
    id: "agent-5",
    kind: "agent-key",
    asset: "agent.webp",
    rect: { x: 0.515152, y: 0.318182, width: 0.136364, height: 0.144338 },
    ariaLabel: "Agent key 5",
  },
  {
    id: "agent-6",
    kind: "agent-key",
    asset: "agent.webp",
    rect: { x: 0.6874, y: 0.318182, width: 0.136364, height: 0.144338 },
    ariaLabel: "Agent key 6",
  },
  {
    id: "lightning",
    kind: "command-key",
    asset: "lightning.webp",
    rect: { x: 0.167464, y: 0.484849, width: 0.136364, height: 0.147528 },
    ariaLabel: "Lightning key",
  },
  {
    id: "check",
    kind: "command-key",
    asset: "check.webp",
    rect: { x: 0.338916, y: 0.484849, width: 0.136364, height: 0.147528 },
    ariaLabel: "Check key",
  },
  {
    id: "cancel",
    kind: "command-key",
    asset: "x.webp",
    rect: { x: 0.515152, y: 0.484849, width: 0.136364, height: 0.147528 },
    ariaLabel: "Cancel key",
  },
  {
    id: "expand",
    kind: "command-key",
    asset: "expand.webp",
    rect: { x: 0.6874, y: 0.484849, width: 0.136364, height: 0.147528 },
    ariaLabel: "Expand key",
  },
  {
    id: "microphone",
    kind: "command-key",
    asset: "space.webp",
    rect: { x: 0.336523, y: 0.658692, width: 0.317384, height: 0.145933 },
    ariaLabel: "Microphone key",
  },
  {
    id: "assistant",
    kind: "command-key",
    asset: "assistant.webp",
    rect: { x: 0.686603, y: 0.658692, width: 0.139553, height: 0.145933 },
    ariaLabel: "Assistant key",
  },
  {
    id: "touch",
    kind: "touch",
    asset: "touch.webp",
    rect: { x: 0.194577, y: 0.698565, width: 0.096491, height: 0.100478 },
    ariaLabel: "Tap sensor",
  },
] as const;

const AGENT_IDS = CONTROL_SPECS.filter((control) => control.kind === "agent-key").map(
  (control) => control.id,
);

const GLOW_COLORS = [
  { name: "white", value: "#ffffff" },
  { name: "green", value: "#82f29a" },
  { name: "blue", value: "#79bfff" },
  { name: "peach", value: "#ffbd96" },
  { name: "red", value: "#ff6870" },
] as const;

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const assetUrl = (asset: string) => `${BASE_PATH}/assets/${asset}`;

type SoundKind = "press" | "release" | "tick" | "sensor";

function useAudio() {
  const contextRef = useRef<AudioContext | null>(null);

  const unlock = useCallback(() => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    if (contextRef.current.state === "suspended") {
      void contextRef.current.resume();
    }
    return contextRef.current;
  }, []);

  const play = useCallback(
    (kind: SoundKind) => {
      const context = unlock();
      const settings = {
        press: { frequency: 148, duration: 0.055, volume: 0.028, type: "sine" },
        release: { frequency: 218, duration: 0.045, volume: 0.018, type: "triangle" },
        tick: { frequency: 510, duration: 0.022, volume: 0.012, type: "triangle" },
        sensor: { frequency: 326, duration: 0.075, volume: 0.022, type: "sine" },
      }[kind] as {
        frequency: number;
        duration: number;
        volume: number;
        type: OscillatorType;
      };

      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      const variation = 1 + (Math.random() - 0.5) * 0.055;

      oscillator.type = settings.type;
      oscillator.frequency.setValueAtTime(settings.frequency * variation, now);
      oscillator.frequency.exponentialRampToValueAtTime(
        settings.frequency * 0.72 * variation,
        now + settings.duration,
      );
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(kind === "tick" ? 1800 : 820, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(
        settings.volume * (0.88 + Math.random() * 0.24),
        now + 0.004,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, now + settings.duration);

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + settings.duration + 0.01);
    },
    [unlock],
  );

  return { play, unlock };
}

function rectStyle(rect: NormalizedRect): CSSProperties {
  return {
    left: `${rect.x * 100}%`,
    top: `${rect.y * 100}%`,
    width: `${rect.width * 100}%`,
    height: `${rect.height * 100}%`,
  };
}

type AudioControls = ReturnType<typeof useAudio>;

function KeyControl({
  spec,
  glow,
  audio,
}: {
  spec: ControlSpec;
  glow?: string;
  audio: AudioControls;
}) {
  const [pressed, setPressed] = useState(false);
  const pointerActive = useRef(false);
  const assistiveTimer = useRef<number | null>(null);

  const press = useCallback(() => {
    if (pressed) return;
    setPressed(true);
    audio.play("press");
  }, [audio, pressed]);

  const release = useCallback(() => {
    if (!pointerActive.current && !pressed) return;
    pointerActive.current = false;
    setPressed(false);
    audio.play("release");
  }, [audio, pressed]);

  const pulseForAssistiveClick = useCallback(() => {
    press();
    if (assistiveTimer.current !== null) window.clearTimeout(assistiveTimer.current);
    assistiveTimer.current = window.setTimeout(() => {
      setPressed(false);
      audio.play("release");
    }, 110);
  }, [audio, press]);

  useEffect(
    () => () => {
      if (assistiveTimer.current !== null) window.clearTimeout(assistiveTimer.current);
    },
    [],
  );

  const style = {
    ...rectStyle(spec.rect),
    "--glow-color": glow ?? "transparent",
  } as CSSProperties;

  return (
    <button
      type="button"
      className={`control key-control ${spec.kind} ${pressed ? "is-pressed" : ""} ${
        glow ? "is-glowing" : ""
      }`}
      style={style}
      aria-label={spec.ariaLabel}
      data-control-id={spec.id}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        event.preventDefault();
        pointerActive.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        press();
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={() => {
        if (pointerActive.current) release();
      }}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
          event.preventDefault();
          press();
        }
      }}
      onKeyUp={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          release();
        }
      }}
      onClick={(event) => {
        if (event.detail === 0 && !pressed) pulseForAssistiveClick();
      }}
    >
      <span className="control-visual">
        <img src={assetUrl(spec.asset)} alt="" draggable={false} />
      </span>
    </button>
  );
}

function angleAt(event: ReactPointerEvent<HTMLElement>, element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return (
    Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2)) *
    (180 / Math.PI)
  );
}

function normalizedDelta(angle: number) {
  let result = angle;
  while (result > 180) result -= 360;
  while (result < -180) result += 360;
  return result;
}

function DialControl({ spec, audio }: { spec: ControlSpec; audio: AudioControls }) {
  const [rotation, setRotation] = useState(0);
  const [pressed, setPressed] = useState(false);
  const drag = useRef<{
    pointerId: number;
    startAngle: number;
    startRotation: number;
    startX: number;
    startY: number;
    lastStep: number;
  } | null>(null);
  const clickTimer = useRef<number | null>(null);

  const step = useCallback(
    (direction: number) => {
      setRotation((current) => current + direction * 12);
      audio.play("tick");
    },
    [audio],
  );

  useEffect(
    () => () => {
      if (clickTimer.current !== null) window.clearTimeout(clickTimer.current);
    },
    [],
  );

  const ariaRotation = ((rotation % 360) + 360) % 360;
  const style = {
    ...rectStyle(spec.rect),
    "--rotation": `${rotation}deg`,
  } as CSSProperties;

  return (
    <div
      role="slider"
      tabIndex={0}
      className={`control dial-control ${pressed ? "is-pressed" : ""}`}
      style={style}
      aria-label={spec.ariaLabel}
      aria-valuemin={0}
      aria-valuemax={348}
      aria-valuenow={ariaRotation}
      aria-valuetext={`${ariaRotation} degrees`}
      data-control-id={spec.id}
      data-rotation={rotation}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        event.preventDefault();
        audio.unlock();
        const target = event.currentTarget;
        target.setPointerCapture(event.pointerId);
        drag.current = {
          pointerId: event.pointerId,
          startAngle: angleAt(event, target),
          startRotation: rotation,
          startX: event.clientX,
          startY: event.clientY,
          lastStep: rotation,
        };
      }}
      onPointerMove={(event) => {
        const currentDrag = drag.current;
        if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;
        const next =
          Math.round(
            (currentDrag.startRotation +
              normalizedDelta(angleAt(event, event.currentTarget) - currentDrag.startAngle)) /
              12,
          ) * 12;
        if (next !== currentDrag.lastStep) {
          currentDrag.lastStep = next;
          setRotation(next);
          audio.play("tick");
        }
      }}
      onPointerUp={(event) => {
        const currentDrag = drag.current;
        if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;
        const distance = Math.hypot(event.clientX - currentDrag.startX, event.clientY - currentDrag.startY);
        drag.current = null;
        if (distance < 6) {
          setPressed(true);
          audio.play("press");
          if (clickTimer.current !== null) window.clearTimeout(clickTimer.current);
          clickTimer.current = window.setTimeout(() => {
            setPressed(false);
            audio.play("release");
          }, 105);
        }
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onWheel={(event: ReactWheelEvent<HTMLDivElement>) => {
        event.preventDefault();
        step(event.deltaY > 0 ? -1 : 1);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowUp") {
          event.preventDefault();
          step(1);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
          event.preventDefault();
          step(-1);
        } else if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
          event.preventDefault();
          setPressed(true);
          audio.play("press");
        }
      }}
      onKeyUp={(event) => {
        if ((event.key === "Enter" || event.key === " ") && pressed) {
          event.preventDefault();
          setPressed(false);
          audio.play("release");
        }
      }}
    >
      <span className="control-visual">
        <img src={assetUrl(spec.asset)} alt="" draggable={false} />
      </span>
    </div>
  );
}

function JoystickControl({ spec, audio }: { spec: ControlSpec; audio: AudioControls }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const pointerId = useRef<number | null>(null);
  const returnTimer = useRef<number | null>(null);

  const reset = useCallback(
    (withSound = true) => {
      pointerId.current = null;
      setDragging(false);
      setOffset({ x: 0, y: 0 });
      if (withSound) audio.play("release");
    },
    [audio],
  );

  const nudge = useCallback(
    (x: number, y: number) => {
      if (returnTimer.current !== null) window.clearTimeout(returnTimer.current);
      setOffset({ x, y });
      audio.play("tick");
      returnTimer.current = window.setTimeout(() => reset(false), 165);
    },
    [audio, reset],
  );

  useEffect(
    () => () => {
      if (returnTimer.current !== null) window.clearTimeout(returnTimer.current);
    },
    [],
  );

  const style = {
    ...rectStyle(spec.rect),
    "--joystick-x": `${offset.x}px`,
    "--joystick-y": `${offset.y}px`,
  } as CSSProperties;

  return (
    <div
      role="button"
      tabIndex={0}
      className={`control joystick-control ${dragging ? "is-dragging is-pressed" : ""}`}
      style={style}
      aria-label={spec.ariaLabel}
      data-control-id={spec.id}
      data-offset-x={Math.round(offset.x)}
      data-offset-y={Math.round(offset.y)}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        event.preventDefault();
        pointerId.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
        audio.play("press");
      }}
      onPointerMove={(event) => {
        if (pointerId.current !== event.pointerId) return;
        const rect = event.currentTarget.getBoundingClientRect();
        let x = event.clientX - (rect.left + rect.width / 2);
        let y = event.clientY - (rect.top + rect.height / 2);
        const radius = Math.min(rect.width, rect.height) * 0.16;
        const distance = Math.hypot(x, y);
        if (distance > radius) {
          x = (x / distance) * radius;
          y = (y / distance) * radius;
        }
        setOffset({ x, y });
      }}
      onPointerUp={() => reset(true)}
      onPointerCancel={() => reset(true)}
      onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
        const amount = 7;
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          nudge(-amount, 0);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          nudge(amount, 0);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          nudge(0, -amount);
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          nudge(0, amount);
        } else if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
          event.preventDefault();
          setDragging(true);
          audio.play("press");
        }
      }}
      onKeyUp={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          reset(true);
        }
      }}
    >
      <span className="control-visual">
        <img src={assetUrl(spec.asset)} alt="" draggable={false} />
      </span>
    </div>
  );
}

function TouchControl({ spec, audio }: { spec: ControlSpec; audio: AudioControls }) {
  const [active, setActive] = useState(false);
  const timer = useRef<number | null>(null);

  const pulse = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    setActive(true);
    audio.play("sensor");
    timer.current = window.setTimeout(() => setActive(false), 190);
  }, [audio]);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  return (
    <button
      type="button"
      className={`control touch-control ${active ? "is-active" : ""}`}
      style={rectStyle(spec.rect)}
      aria-label={spec.ariaLabel}
      data-control-id={spec.id}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        event.preventDefault();
        pulse();
      }}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
          event.preventDefault();
          pulse();
        }
      }}
      onClick={(event) => {
        if (event.detail === 0 && !active) pulse();
      }}
    >
      <span className="control-visual" aria-hidden="true" />
    </button>
  );
}

export function CodexMicro() {
  const audio = useAudio();
  const [glow, setGlow] = useState<{ id: string; color: string } | null>(null);
  const lastGlow = useRef<{ id: string; colorName: string } | null>(null);

  useEffect(() => {
    let lightTimer = 0;
    let clearTimer = 0;

    const trigger = () => {
      const availableIds = AGENT_IDS.filter((id) => id !== lastGlow.current?.id);
      const availableColors = GLOW_COLORS.filter(
        (color) => color.name !== lastGlow.current?.colorName,
      );
      const id = availableIds[Math.floor(Math.random() * availableIds.length)];
      const color = availableColors[Math.floor(Math.random() * availableColors.length)];

      lastGlow.current = { id, colorName: color.name };
      setGlow({ id, color: color.value });
      clearTimer = window.setTimeout(() => setGlow(null), 1500);
      lightTimer = window.setTimeout(trigger, 8000 + Math.random() * 6000);
    };

    lightTimer = window.setTimeout(trigger, 8000 + Math.random() * 6000);
    return () => {
      window.clearTimeout(lightTimer);
      window.clearTimeout(clearTimer);
    };
  }, []);

  const controllerStyle = {
    "--frame-glow": glow?.color ?? "transparent",
  } as CSSProperties;

  return (
    <section
      className="controller"
      style={controllerStyle}
      data-controller="codex-micro"
      data-glowing={glow ? "true" : "false"}
      aria-label="Codex Micro interactive mockup"
    >
      <img className="board" src={assetUrl("board.webp")} alt="" draggable={false} />

      {CONTROL_SPECS.map((spec) => {
        if (spec.kind === "dial") {
          return <DialControl key={spec.id} spec={spec} audio={audio} />;
        }
        if (spec.kind === "joystick") {
          return <JoystickControl key={spec.id} spec={spec} audio={audio} />;
        }
        if (spec.kind === "touch") {
          return <TouchControl key={spec.id} spec={spec} audio={audio} />;
        }
        return (
          <KeyControl
            key={spec.id}
            spec={spec}
            glow={glow?.id === spec.id ? glow.color : undefined}
            audio={audio}
          />
        );
      })}
    </section>
  );
}
