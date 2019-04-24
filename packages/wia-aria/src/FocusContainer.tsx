import React, {
  FunctionComponent,
  forwardRef,
  ReactType,
  HTMLAttributes,
  useCallback,
  useRef,
} from "react";
import { WithForwardedRef, applyRef } from "@react-md/utils";

import usePreviousFocus, { FocusFallback } from "./usePreviousFocus";
import useFocusOnMount from "./useFocusOnMount";
import useFocusableElementCache from "./useFocusableElementCache";
import handleFocusWrap from "./handleFocusWrap";

export interface FocusContainerProps extends HTMLAttributes<HTMLElement> {
  /**
   * Boolean if the focus behavior should be disabled. This should really be
   * used if you are using nested focus containers for temporary material (such as
   * dialogs or menus).
   */
  disabled?: boolean;

  /**
   * By default, the focus container will try to maintain a cache of the focusable
   * elements that is updated only when this component re-renders. If the children
   * are extremely dynamic and focusable elements can be removed/added without this
   * component updating, you should disable the cache so that the focusable elements
   * are updated each time the tab key is pressed. Disabling the cache will be slightly
   * slower for larger focusable areas, but it might not be too bad.
   *
   * NOTE: The only important elements are the *first* and *last* elements in this list.
   * So if your children aren't changing the first and last elements, there's no need
   * to disable the cache.
   */
  disableFocusCache?: boolean;

  /**
   * The default behavior for the focus container is to focus an element once it is mounted
   * and the `disabled` prop is not enabled. This behavior can be disabled if this is not
   * wanted for some reason.
   */
  disableFocusOnMount?: boolean;

  /**
   * The default behavior for the focus container is to attempt to focus the element that
   * was focused before the focus container was mounted since it is generally used for
   * temporary material. If there are cases where this behavior is not wanted, you can
   * enable this prop.
   */
  disableFocusOnUnmount?: boolean;

  /**
   * This is the element that should be focused by default when the component is mounted.
   * This can either be the first or last focusable item or a query selector string that
   * is run against this component to focus.
   */
  defaultFocus?: "first" | "last" | string;

  /**
   * When the focus container unmounts, it will attempt to re-focus the element that was
   * focused before the focus container was mounted unless the `disableFocusOnUnmount`
   * prop is enabled. There might be cases where unmounting the focus container causes
   * the page to re-render and the previous element no longer exists. When this happens
   * keyboard users _might_ have a problem navigating through the page again depending
   * on how the browser implemented the native tab behavior so this prop allows you to
   * ensure that a specific element is focused in these cases.
   *
   * This can either be a query selector string, a specific HTMLElement, or a function
   * that finds a specific HTMLElement to focus.
   */
  unmountFocusFallback?: FocusFallback;

  /**
   * The component to render the focus container as. This should really not be used as
   * it is more for internal usage. The only base requirements for this prop is that it
   * must either be a element string (`"div"`, `"span"`, etc) or a custom component
   * that has forwarded the ref to the DOM node.
   */
  component?: ReactType;
}

type WithRef = WithForwardedRef<HTMLElement>;
type DefaultProps = Required<
  Pick<
    FocusContainerProps,
    | "disabled"
    | "disableFocusCache"
    | "disableFocusOnMount"
    | "disableFocusOnUnmount"
    | "defaultFocus"
    | "component"
  >
>;
type WithDefaultProps = FocusContainerProps & DefaultProps & WithRef;

const FocusContainer: FunctionComponent<
  FocusContainerProps & WithRef
> = providedProps => {
  const {
    disabled,
    disableFocusCache,
    disableFocusOnMount,
    disableFocusOnUnmount,
    defaultFocus,
    unmountFocusFallback,
    component: Component,
    forwardedRef,
    children,
    onKeyDown,
    ...props
  } = providedProps as WithDefaultProps;

  const ref = useRef<HTMLElement | null>(null);
  const refHandler = (instance: HTMLElement | null) => {
    applyRef(instance, forwardedRef);
    ref.current = instance;
  };

  const focusables = useFocusableElementCache(ref);
  usePreviousFocus(disableFocusOnUnmount, unmountFocusFallback);
  useFocusOnMount(ref, defaultFocus, disableFocusOnMount);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (onKeyDown) {
        onKeyDown(event);
      }

      if (handleFocusWrap(event, focusables, disableFocusCache)) {
        return;
      }
    },
    [onKeyDown]
  );

  return (
    <Component {...props} onKeyDown={handleKeyDown} ref={refHandler}>
      {children}
    </Component>
  );
};

const defaultProps: DefaultProps = {
  disabled: false,
  disableFocusCache: false,
  disableFocusOnMount: false,
  disableFocusOnUnmount: false,
  defaultFocus: "first",
  component: "div",
};

FocusContainer.defaultProps = defaultProps;

export default forwardRef<HTMLDivElement, FocusContainerProps>((props, ref) => (
  <FocusContainer {...props} forwardedRef={ref} />
));
