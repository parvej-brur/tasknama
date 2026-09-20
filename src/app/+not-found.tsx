import { Stack } from "expo-router";

import { NotFoundState } from "@/components/feedback/not-found";

// Any link that doesn't match a route (a bad deep link) ends up here.
export default function NotFoundRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <NotFoundState title="Page not found" message="That link doesn’t lead anywhere in this app." />
    </>
  );
}
