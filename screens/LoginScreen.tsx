import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/screen-header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { getApiBaseUrl } from "@/services/baseUrl";
import {
  useGoogleExchangeMutation,
  useLoginMutation,
  useRegisterMutation,
} from "@/store/api/authApi";
import {
  clearStoredAuthSession,
  persistAuthSession,
} from "@/store/authStorage";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import type { User } from "@/types/domain";

function joinUrl(base: string, path: string) {
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function waitForGoogleCallback(timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      subscription.remove();
      reject(new Error("Timed out waiting for Google callback."));
    }, timeoutMs);

    const subscription = Linking.addEventListener("url", ({ url }) => {
      if (url.includes("/auth/google/callback")) {
        clearTimeout(timeoutId);
        subscription.remove();
        resolve(url);
      }
    });
  });
}

function firstParamValue(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

function extractGoogleCode(url: string): string | null {
  const parsed = Linking.parse(url);
  const directCode = firstParamValue(parsed.queryParams?.code);
  if (directCode) return directCode;

  // Fallback for uncommon callback encodings where query lands in fragment
  const hashIndex = url.indexOf("#");
  if (hashIndex !== -1) {
    const hash = url.slice(hashIndex + 1);
    const params = new URLSearchParams(hash);
    const hashCode = params.get("code");
    if (hashCode) return hashCode;
  }

  return null;
}

function isPlaceholderCode(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.includes("paste_code_here") ||
    normalized.includes("paste code") ||
    normalized.startsWith("your_code")
  );
}

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const [loginMutation] = useLoginMutation();
  const [registerMutation] = useRegisterMutation();
  const [googleExchange] = useGoogleExchangeMutation();
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const borderColor = useThemeColor({}, "border");
  const inputBackground = useThemeColor({}, "inputBackground");
  const inputText = useThemeColor({}, "inputText");
  const primary = useThemeColor({}, "primary");
  const primaryText = useThemeColor({}, "primaryText");
  const muted = useThemeColor({}, "muted");
  const danger = useThemeColor({}, "danger");
  const googleAuthPath =
    process.env.EXPO_PUBLIC_GOOGLE_AUTH_START_PATH?.trim() || "/auth/google";
  const googleAuthBaseUrl =
    process.env.EXPO_PUBLIC_GOOGLE_AUTH_BASE_URL?.trim() || getApiBaseUrl();
  const googleAppCallbackUrl =
    process.env.EXPO_PUBLIC_GOOGLE_APP_CALLBACK_URL?.trim();
  const googleConfigured =
    process.env.EXPO_PUBLIC_ENABLE_GOOGLE_AUTH?.trim()?.toLowerCase() !== "false";

  const finishLogin = async (loginData: { user: User; access_token: string }) => {
    dispatch(
      setCredentials({
        user: loginData.user,
        token: loginData.access_token,
      }),
    );
    await persistAuthSession({
      user: loginData.user,
      token: loginData.access_token,
    });
    router.replace("/");
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (isRegisterMode) {
        if (!username.trim() || !email.trim() || !password.trim()) {
          setError("Username, email, and password are required.");
          setLoading(false);
          return;
        }
        await registerMutation({
          username: username.trim(),
          email: email.trim(),
          password,
        }).unwrap();
        const loginData = await loginMutation({
          identifier: username.trim(),
          password,
        }).unwrap();
        await finishLogin(loginData);
      } else {
        if (!identifier.trim() || !password.trim()) {
          setError("Please enter identifier and password.");
          setLoading(false);
          return;
        }
        const loginData = await loginMutation({
          identifier: identifier.trim(),
          password,
        }).unwrap();
        await finishLogin(loginData);
      }
    } catch (err) {
      await clearStoredAuthSession();
      const apiError = err as FetchBaseQueryError | undefined;
      if (
        apiError &&
        "status" in apiError &&
        apiError.status === "FETCH_ERROR"
      ) {
        setError(
          "Cannot reach backend. Check EXPO_PUBLIC_API_URL and server status.",
        );
      } else {
        setError(
          isRegisterMode
            ? "Signup failed. Please try again."
            : "Login failed. Please check your credentials.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!googleConfigured) {
      setError(
        "Google sign-in is disabled in env (EXPO_PUBLIC_ENABLE_GOOGLE_AUTH=false).",
      );
      return;
    }

    setError("");
    setGoogleLoading(true);
    try {
      const redirectUri =
        googleAppCallbackUrl || Linking.createURL("/auth/google/callback");
      const authUrl = joinUrl(googleAuthBaseUrl, googleAuthPath);
      let callbackUrl = "";
      if (Platform.OS === "web") {
        const authResult = await withTimeout(
          WebBrowser.openAuthSessionAsync(authUrl, redirectUri),
          90000,
          "Timed out waiting for Google callback.",
        );
        if (authResult.type !== "success" || !authResult.url) {
          setError("Google sign-in was cancelled.");
          return;
        }
        callbackUrl = authResult.url;
      } else {
        const callbackPromise = waitForGoogleCallback(90000);
        await WebBrowser.openBrowserAsync(authUrl);
        callbackUrl = await callbackPromise;
        WebBrowser.dismissBrowser();
      }

      const parsed = Linking.parse(callbackUrl);
      const code = extractGoogleCode(callbackUrl);
      const idToken = firstParamValue(parsed.queryParams?.id_token);
      const oauthError = firstParamValue(parsed.queryParams?.error);

      if (typeof oauthError === "string" && oauthError.length > 0) {
        setError(`Google sign-in failed: ${oauthError}`);
        return;
      }

      if (typeof code === "string" && code.length > 0) {
        if (isPlaceholderCode(code)) {
          setError("Invalid Google code detected (placeholder value).");
          return;
        }
        if (__DEV__) {
          console.log("[google-auth] exchanging code", {
            codePreview: `${code.slice(0, 12)}...`,
            callbackUrl,
          });
        }
        const loginData = await withTimeout(
          googleExchange({ code }).unwrap(),
          15000,
          "Timed out contacting backend for Google login.",
        );
        await finishLogin(loginData);
        return;
      }

      if (typeof idToken === "string" && idToken.length > 0) {
        if (__DEV__) {
          console.log("[google-auth] exchanging id_token", {
            tokenPreview: `${idToken.slice(0, 12)}...`,
          });
        }
        const loginData = await withTimeout(
          googleExchange({ id_token: idToken }).unwrap(),
          15000,
          "Timed out contacting backend for Google login.",
        );
        await finishLogin(loginData);
        return;
      }

      setError("Google sign-in failed: no auth code returned.");
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Google sign-in failed. Please try again.";
      if (message.includes("Timed out")) {
        setError(
          "Google callback received, but backend exchange timed out. If using a physical phone, replace localhost in frontend env with your computer LAN IP.",
        );
      } else {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const backgroundColor = useThemeColor({}, "background");
  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right", "bottom"]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardRoot}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.page}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={[styles.container, { backgroundColor }]}>
            <ScreenHeader title={isRegisterMode ? "Create Account" : "Login"} showBack={false} />
            <ThemedText style={[styles.helperText, { color: muted }]}>
              {isRegisterMode
                ? "Create your account to start ordering."
                : "Sign in with your email or username."}
            </ThemedText>
            {!isRegisterMode ? (
              <>
                <ThemedText style={styles.label}>Email or Username</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor,
                      backgroundColor: inputBackground,
                      color: inputText,
                    },
                  ]}
                  placeholder="Enter email or username"
                  placeholderTextColor={muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="username"
                  value={identifier}
                  onChangeText={setIdentifier}
                />
              </>
            ) : null}
            {isRegisterMode ? (
              <>
                <ThemedText style={styles.label}>Username</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor,
                      backgroundColor: inputBackground,
                      color: inputText,
                    },
                  ]}
                  placeholder="Choose a username"
                  placeholderTextColor={muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="username"
                  value={username}
                  onChangeText={setUsername}
                />
                <ThemedText style={styles.label}>Email</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor,
                      backgroundColor: inputBackground,
                      color: inputText,
                    },
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor={muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  value={email}
                  onChangeText={setEmail}
                />
              </>
            ) : null}
            <ThemedText style={styles.label}>Password</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor,
                  backgroundColor: inputBackground,
                  color: inputText,
                },
              ]}
              placeholder="Enter password"
              placeholderTextColor={muted}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable
              style={styles.toggleButton}
              onPress={() => setShowPassword((prev) => !prev)}
            >
              <ThemedText>
                {showPassword ? "Hide Password" : "Show Password"}
              </ThemedText>
            </Pressable>
            {!!error && (
              <ThemedText style={[styles.error, { color: danger }]}>
                {error}
              </ThemedText>
            )}
            <Pressable
              style={[
                styles.button,
                { backgroundColor: primary },
                (loading || googleLoading) && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading || googleLoading}
            >
              {loading ? (
                <ActivityIndicator color={primaryText} />
              ) : (
                <ThemedText style={[styles.buttonText, { color: primaryText }]}>
                  {isRegisterMode ? "Create Account" : "Sign In"}
                </ThemedText>
              )}
            </Pressable>
            <Pressable
              style={[
                styles.secondaryButton,
                { borderColor },
                (loading || googleLoading) && styles.buttonDisabled,
              ]}
              onPress={() => setIsRegisterMode((prev) => !prev)}
              disabled={loading || googleLoading}
            >
              <ThemedText>
                {isRegisterMode
                  ? "Already have an account? Login"
                  : "New user? Create account"}
              </ThemedText>
            </Pressable>
            {!isRegisterMode ? (
              <Pressable
                style={[
                  styles.googleButton,
                  { borderColor },
                  (loading || googleLoading) && styles.buttonDisabled,
                ]}
                onPress={handleGoogleSignIn}
                disabled={loading || googleLoading || !googleConfigured}
              >
                <ThemedText>
                  {!googleConfigured
                    ? "Google Sign-In Not Configured"
                    : googleLoading
                      ? "Connecting Google..."
                      : "Continue with Google"}
                </ThemedText>
              </Pressable>
            ) : null}
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardRoot: {
    flex: 1,
  },
  page: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
  container: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    padding: 16,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  helperText: {
    // color set from theme token
    marginTop: -4,
  },
  button: {
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    fontWeight: "700",
  },
  error: {
    // color set from theme token
  },
  secondaryButton: {
    borderWidth: 1,
    // border color set from theme token
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  googleButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  toggleButton: {
    alignSelf: "flex-end",
    paddingVertical: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
