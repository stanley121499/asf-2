import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import {
  clearLastCrash,
  formatFatalForMetro,
  persistLastCrash,
  readLastCrash,
} from "@/lib/earlyCrashLog";

type RootErrorBoundaryProps = {
  children: ReactNode;
};

type RootErrorBoundaryState = {
  hasError: boolean;
  message: string;
  stack: string | null;
  sourceLabel: string;
};

/**
 * Extracts a safe message string from a thrown render error.
 *
 * @param error - Error thrown during render
 */
function readErrorMessage(error: Error): string {
  if (typeof error.message === "string" && error.message.trim().length > 0) {
    return error.message.trim();
  }
  return "Unexpected application error";
}

/**
 * Extracts an optional stack string from a thrown render error.
 *
 * @param error - Error thrown during render
 */
function readErrorStack(error: Error): string | null {
  if (typeof error.stack === "string" && error.stack.trim().length > 0) {
    return error.stack.trim();
  }
  return null;
}

/**
 * Emits a single grep-friendly Metro line for a caught render error.
 *
 * @param prefix - Log tag after `[RootErrorBoundary]`
 * @param error - Thrown error (or synthetic fields for lastCrash)
 * @param message - Display message
 * @param stack - Optional stack
 */
function logRootErrorBoundary(
  prefix: string,
  errorName: string,
  message: string,
  stack: string | null,
): void {
  console.error(
    `[RootErrorBoundary] ${prefix}`,
    formatFatalForMetro({ name: errorName, message, stack }),
  );
}

/**
 * True when a persisted crash is obsolete after a successful remount — e.g. a
 * fixed "must be used within XProvider" throw that would otherwise sticky-block
 * Expo Go via hydratePersistedCrash even though the live tree is healthy.
 *
 * @param message - Persisted crash message
 */
function isObsoleteProviderMissingCrash(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  if (normalized.includes("unable to resolve module")) {
    return true;
  }
  // Fixed hooks now fall back instead of throwing; stale records must not block.
  if (normalized.includes("must be used within a") && normalized.includes("provider")) {
    return true;
  }
  if (normalized.includes("usedesignpreview")) {
    return true;
  }
  return false;
}

/**
 * Catches uncaught render errors so production/dev-client builds show a recover
 * screen with the actual JS error string instead of an instant OS crash + exit.
 * Also surfaces the last fatal crash persisted by {@link installEarlyCrashLog}.
 */
export class RootErrorBoundary extends Component<
  RootErrorBoundaryProps,
  RootErrorBoundaryState
> {
  public constructor(props: RootErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      message: "",
      stack: null,
      sourceLabel: "",
    };
  }

  public override componentDidMount(): void {
    void this.hydratePersistedCrash();
  }

  /**
   * On cold start after a fatal JS kill, show the stored crash reason immediately.
   * Metro "Unable to resolve module" records are discarded: if this boundary
   * mounted, the current bundle already resolved, so that crash is obsolete.
   */
  private async hydratePersistedCrash(): Promise<void> {
    if (this.state.hasError) {
      return;
    }
    const last = await readLastCrash();
    if (last === null) {
      return;
    }
    if (isObsoleteProviderMissingCrash(last.message)) {
      await clearLastCrash();
      return;
    }
    logRootErrorBoundary("lastCrash", "LastCrash", last.message, last.stack);
    this.setState({
      hasError: true,
      message: last.message,
      stack: last.stack,
      sourceLabel: `Last crash (${last.source}) · ${last.at}`,
    });
  }

  /**
   * Maps a thrown render error into recoverable UI state.
   *
   * @param error - Error thrown during render
   */
  public static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    const message = readErrorMessage(error);
    const stack = readErrorStack(error);
    const name =
      typeof error.name === "string" && error.name.trim().length > 0
        ? error.name.trim()
        : "Error";
    logRootErrorBoundary("getDerivedStateFromError", name, message, stack);
    return {
      hasError: true,
      message,
      stack,
      sourceLabel: "Render error",
    };
  }

  /**
   * Logs + persists the error for the next launch and for logcat / Metro.
   */
  public override componentDidCatch(error: Error, info: ErrorInfo): void {
    const message = readErrorMessage(error);
    const stack = readErrorStack(error);
    const name =
      typeof error.name === "string" && error.name.trim().length > 0
        ? error.name.trim()
        : "Error";
    const componentStack =
      typeof info.componentStack === "string" && info.componentStack.trim().length > 0
        ? info.componentStack.trim()
        : null;
    const combinedStack =
      stack !== null && componentStack !== null
        ? `${stack}\n${componentStack}`
        : stack !== null
          ? stack
          : componentStack;
    logRootErrorBoundary("componentDidCatch", name, message, combinedStack);
    // Bundler resolve failures / fixed provider-hook throws are obsolete once
    // the next graph mounts — do not persist or the recover screen sticky-blocks.
    if (isObsoleteProviderMissingCrash(message)) {
      void clearLastCrash();
      return;
    }
    void persistLastCrash({
      message,
      stack,
      source: "render",
      at: new Date().toISOString(),
    });
  }

  /**
   * Clears the error state so the tree can remount.
   */
  private handleRetry = (): void => {
    void clearLastCrash();
    this.setState({
      hasError: false,
      message: "",
      stack: null,
      sourceLabel: "",
    });
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: "#ffffff",
            paddingTop: 64,
            paddingHorizontal: 24,
            paddingBottom: 32,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: "#0A0A0A",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Something went wrong
          </Text>
          {this.state.sourceLabel.length > 0 ? (
            <Text
              style={{
                fontSize: 12,
                color: "#888888",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              {this.state.sourceLabel}
            </Text>
          ) : null}
          <ScrollView
            style={{ flexGrow: 0, maxHeight: "55%", marginBottom: 20 }}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            <Text
              selectable
              style={{
                fontSize: 14,
                color: "#333333",
                textAlign: "left",
                fontFamily: "Courier",
              }}
            >
              {this.state.message}
            </Text>
            {this.state.stack !== null ? (
              <Text
                selectable
                style={{
                  marginTop: 16,
                  fontSize: 11,
                  color: "#666666",
                  textAlign: "left",
                  fontFamily: "Courier",
                }}
              >
                {this.state.stack}
              </Text>
            ) : null}
          </ScrollView>
          <Text
            style={{
              fontSize: 12,
              color: "#888888",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            Screenshot this message and send it to Stanley. Tap Try again to remount.
          </Text>
          <Pressable
            onPress={this.handleRetry}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            style={{
              alignSelf: "center",
              paddingHorizontal: 20,
              paddingVertical: 12,
              backgroundColor: "#0A0A0A",
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "600" }}>
              Try again
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
