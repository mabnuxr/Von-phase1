import React from "react";
import { Button, type ButtonProps } from "@vonlabs/design-components";
import { track } from "../lib/analytics/tracker";
import type { EventName, EventProps } from "../lib/analytics/events";

type TrackedButtonProps<E extends EventName> = ButtonProps & {
  phEvent?: E;
  phProps?: EventProps<E>;
};

/**
 * Drop-in replacement for Button that fires a PostHog event on click.
 *
 * @example
 * <TrackedButton
 *   phEvent="Settings - Tab Clicked"
 *   phProps={{ tab_name: "Integrations" }}
 *   variant="primary"
 * >
 *   Integrations
 * </TrackedButton>
 */
export function TrackedButton<E extends EventName>({
  phEvent,
  phProps,
  onClick,
  ...rest
}: TrackedButtonProps<E>) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (phEvent && phProps !== undefined) {
      track(phEvent, phProps);
    }
    onClick?.(e);
  };

  return <Button {...rest} onClick={handleClick} />;
}
