import { Redirect } from "expo-router";

/** Default stocks tab opens the overview dashboard. */
export default function StocksIndexRedirect(): React.ReactElement {
  return <Redirect href="/(app)/(tabs)/stocks/overview" />;
}
