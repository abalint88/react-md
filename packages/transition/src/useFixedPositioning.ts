import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { TransitionProps } from "react-transition-group/Transition";
import { useResizeListener } from "@react-md/sizing";
import {
  getFixedPosition,
  useScrollListener,
  Omit,
  HorizontalPosition,
  VerticalPosition,
  FixedPositionOptions,
} from "@react-md/utils";

type FixedToFunction = () => HTMLElement | null;
type FixedTo = string | HTMLElement | null | FixedToFunction;
type OptionalFixedPositionOptions = Omit<
  FixedPositionOptions,
  "container" | "element"
>;

export interface PositionAnchor {
  x: HorizontalPosition;
  y: VerticalPosition;
}

type PositionChange = (wanted: PositionAnchor, actual: PositionAnchor) => void;

export interface FixedPositioningOptions
  extends OptionalFixedPositionOptions,
    Pick<TransitionProps, "onEnter" | "onEntering" | "onEntered" | "onExited"> {
  /**
   * The element that the transitioning node should be fixed to.
   */
  fixedTo: FixedTo;

  /**
   * An optional function to call to dynamically get the options when the node
   * has been added to the DOM. This is helpful if you need to check sizes or other
   * things once the DOM node has been added for initial positioning or other things
   * like that. The returned options will override the existing options
   */
  getOptions?: (node: HTMLElement) => OptionalFixedPositionOptions;

  /**
   * An optional function to call when the element is in the DOM and a window resize
   * event has occurred. The main use-case for this is hiding the fixed element when
   * the page is resized.
   */
  onResize?: (event: Event) => void;

  /**
   * An optional function to call when the element is in the DOM and a window scroll
   * event has occurred. The main use-case for this is hiding the fixed element when
   * the an element or the entire page has a scroll event.
   */
  onScroll?: (event: Event) => void;

  /**
   * An optional function to call when the providex `xPosition` and `yPosition` are not
   * the same as the "calculated" position after tyring to make the element fixed
   * within the viewport.
   */
  onPositionChange?: PositionChange;

  /**
   * Boolean if the style object should also return the correct `transform-origin` value
   * in the style object.
   */
  transformOrigin?: boolean;
}

function getFixedTo(fixedTo: FixedTo) {
  if (!fixedTo) {
    return null;
  }

  const t = typeof fixedTo;
  switch (t) {
    case "string":
      fixedTo = fixedTo as string;
      return (
        document.getElementById(fixedTo) ||
        document.querySelector<HTMLElement>(fixedTo)
      );
    case "function":
      return (fixedTo as FixedToFunction)();
    default:
      return fixedTo as HTMLElement;
  }
}

function getTransformOrigin(anchor: PositionAnchor) {
  let x = "0";
  switch (anchor.x) {
    case "left":
    case "inner-left":
      x = "0";
      break;
    case "center":
      x = "50%";
      break;
    case "right":
    case "inner-right":
      x = "100%";
      break;
  }

  let y = "0";
  switch (anchor.y) {
    case "above":
    case "top":
      y = "0";
      break;
    case "center":
      y = "50%";
      break;
    case "below":
    case "bottom":
      y = "100%";
      break;
  }

  return `${x} ${y}`;
}

/**
 * This hook is used to automatically handle fixed positioning when an element is used alongside a
 * `Transition` from `react-transition-group`. This will provide merged `onEnter`, `onEntering`,
 * `onEntered`, and `onExited` handlers to pass down as well as the current style object to apply
 * to the element.
 *
 * Until the element has been removed from the DOM and is visible, the positiong will automatically
 * update when the user scrolls or resizes the screen.
 *
 * > It is recommended to start the exit animation when that happens though.
 */
export default function useFixedPositioning({
  onEnter,
  onEntering,
  onEntered,
  onExited,
  fixedTo,
  getOptions,
  onResize,
  onScroll,
  ...remainingOptions
}: FixedPositioningOptions) {
  const [style, setStyle] = useState<CSSProperties | undefined>();
  const handlers = useRef({ onEnter, onEntering, onEntered, onExited });
  const options = useRef({
    fixedTo,
    getOptions,
    ...remainingOptions,
  });
  useEffect(() => {
    handlers.current = {
      onEnter,
      onEntering,
      onEntered,
      onExited,
    };

    options.current = {
      fixedTo,
      getOptions,
      ...remainingOptions,
    };
  });

  const element = useRef<HTMLElement | null>(null);

  const updateStyle = useCallback(() => {
    const node = element.current;
    if (!node) {
      return;
    }

    const {
      fixedTo,
      getOptions,
      onPositionChange,
      transformOrigin,
      ...remaining
    } = options.current;
    const overrides = typeof getOptions === "function" ? getOptions(node) : {};
    const opts = {
      ...remaining,
      ...overrides,
      x: overrides.x || remaining.x || "center",
      y: overrides.y || remaining.y || "below",
    };

    const { style, actualX, actualY } = getFixedPosition({
      container: getFixedTo(fixedTo),
      element: node,
      ...opts,
    });

    const wanted = { x: opts.x, y: opts.y };
    const actual = { x: actualX, y: actualY };
    if (onPositionChange && (wanted.x !== actual.x || wanted.y !== actual.y)) {
      onPositionChange(wanted, actual);
    }

    setStyle({
      ...style,
      position: "fixed",
      transformOrigin: transformOrigin ? getTransformOrigin(opts) : undefined,
    });
  }, []);

  const updateNodeAndStyle = useCallback((node: HTMLElement) => {
    element.current = node;
    updateStyle();
  }, []);

  const handleEnter = useCallback((node: HTMLElement, appear: boolean) => {
    const { onEnter } = handlers.current;
    if (onEnter) {
      onEnter(node, appear);
    }

    updateNodeAndStyle(node);
  }, []);

  const handleEntering = useCallback((node: HTMLElement, appear: boolean) => {
    const { onEntering } = handlers.current;
    if (onEntering) {
      onEntering(node, appear);
    }

    updateNodeAndStyle(node);
  }, []);

  const handleEntered = useCallback((node: HTMLElement, appear: boolean) => {
    const { onEntered } = handlers.current;
    if (onEntered) {
      onEntered(node, appear);
    }

    updateNodeAndStyle(node);
  }, []);

  const handleExited = useCallback((node: HTMLElement) => {
    const { onExited } = handlers.current;
    if (onExited) {
      onExited(node);
    }

    element.current = null;
  }, []);

  useResizeListener({
    enabled: !!element.current,
    onResize: event => {
      if (onResize) {
        onResize(event);
      }

      updateStyle();
    },
  });

  useScrollListener({
    enabled: !!element.current,
    onScroll: event => {
      if (onScroll) {
        onScroll(event);
      }

      updateStyle();
    },
  });

  return {
    style,
    onEnter: handleEnter,
    onEntering: handleEntering,
    onEntered: handleEntered,
    onExited: handleExited,
  };
}