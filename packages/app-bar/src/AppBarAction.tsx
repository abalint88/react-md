import React, { FunctionComponent, forwardRef } from "react";
import cn from "classnames";
import { Button, IButtonProps, ButtonType } from "@react-md/button";
import { IWithForwardedRef } from "@react-md/utils";

export interface IAppBarActionProps
  extends IButtonProps,
    IWithForwardedRef<HTMLButtonElement> {
  /**
   * Boolean if this is the first action within the app bar. This is really just used to
   * automatically right-align all the actions by applying `margin-left: auto` to this action.
   */
  first?: boolean;

  /**
   * Boolean if this is the last action within the app bar's row. This will just apply the
   * `$rmd-app-bar-lr-margin` as `margin-right`.
   *
   * NOTE: This should not be used when using an overflow menu.
   */
  last?: boolean;
}

interface IAppBarActionDefaultProps {
  first: boolean;
  last: boolean;
  buttonType: ButtonType;
}

/**
 * This component is really just a simple wrapper for the `Button` component that adds a few
 * additional styles to prevent the button from shrinking when an `AppBar` has a lot of content.
 * It also will automatically add spacing either before or after this button when the `first`
 * or `last` props are provided.
 */
const AppBarAction: FunctionComponent<IAppBarActionProps> = ({
  className,
  first,
  last,
  children,
  ...props
}) => (
  <Button
    {...props}
    className={cn(
      "rmd-app-bar__action",
      {
        "rmd-app-bar__action--first": first,
        "rmd-app-bar__action--last": last,
      },
      className
    )}
  >
    {children}
  </Button>
);

const defaultProps: IAppBarActionDefaultProps = {
  first: false,
  last: false,
  buttonType: "icon",
};

AppBarAction.defaultProps = defaultProps;

if (process.env.NODE_ENV !== "production") {
  AppBarAction.displayName = "AppBarAction";

  let PropTypes = null;
  try {
    PropTypes = require("prop-types");
  } catch (e) {}

  if (PropTypes) {
    AppBarAction.propTypes = {
      className: PropTypes.string,
      children: PropTypes.node,
      first: PropTypes.bool,
      last: PropTypes.bool,
    };
  }
}

export default forwardRef<HTMLButtonElement, IAppBarActionProps>(
  (props, ref) => <AppBarAction {...props} forwardedRef={ref} />
);