import { useEffect, useState } from "react";
import { AppState } from "react-native";

import { clockAt, type Clock } from "@/utils/date";

// The current local date and minute. Updates on the minute and when the app
// returns to the foreground, so "today" and "overdue" never go stale.
export function useClock(): Clock {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const current = new Date();
      const untilNextMinute = 60_000 - (current.getSeconds() * 1000 + current.getMilliseconds());
      timer = setTimeout(() => {
        setNow(new Date());
        schedule();
      }, untilNextMinute + 50);
    };
    schedule();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") setNow(new Date());
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  const clock = clockAt(now);
  // Stable identity while the minute hasn't changed, so memoized rows and
  // selectors keyed on it don't re-run.
  const [stable, setStable] = useState(clock);
  if (stable.today !== clock.today || stable.time !== clock.time) setStable(clock);
  return stable;
}
