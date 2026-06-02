import React, { useCallback } from "react";
import { posthog } from "../lib/posthog";
import type { EventName, EventMap } from "../lib/analytics/events";

type NoPropsEventName = {
  [E in EventName]: EventMap[E] extends Record<never, never> ? E : never;
}[EventName];

type AsButton = React.ComponentPropsWithoutRef<"button"> & {
  posthogEventName: NoPropsEventName;
  href?: never;
};

type AsAnchor = React.ComponentPropsWithoutRef<"a"> & {
  posthogEventName: NoPropsEventName;
  href: string;
};

type TrackedButtonProps = AsButton | AsAnchor;

export function TrackedButton(props: TrackedButtonProps) {
  const { posthogEventName, onClick, children, ...rest } = props;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      posthog.capture(posthogEventName);
      (
        onClick as React.MouseEventHandler<typeof e.currentTarget> | undefined
      )?.(e as never);
    },
    [posthogEventName, onClick],
  );

  if ("href" in rest && rest.href !== undefined) {
    return (
      <a
        {...(rest as React.ComponentPropsWithoutRef<"a">)}
        onClick={handleClick as React.MouseEventHandler<HTMLAnchorElement>}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      {...(rest as React.ComponentPropsWithoutRef<"button">)}
      onClick={handleClick as React.MouseEventHandler<HTMLButtonElement>}
    >
      {children}
    </button>
  );
}
