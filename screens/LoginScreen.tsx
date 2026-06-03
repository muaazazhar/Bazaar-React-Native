import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ValidatingTextInput } from "@/components/validating-text-input";
import { ScreenHeader } from "@/components/screen-header";
import { FIELD_LIMITS, validateEmail, validateRequired } from "@/constants/fieldLimits";
import { getApiErrorMessage } from "@/utils/apiError";
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
import { savePendingEmail } from "@/store/verificationStorage";
import {
  getEmailFromApiError,
  getResendCooldownSeconds,
  isEmailNotVerifiedError,
} from "@/utils/authApiErrors";
import { routeAfterAuth } from "@/utils/authRouting";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import type { User } from "@/types/domain";

function joinUrl(base: string, path: string) {
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
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
  const [fieldErrors, setFieldErrors] = useState<{
    identifier?: string;
    username?: string;
    email?: string;
    password?: string;
  }>({});
  const borderColor = useThemeColor({}, "border");
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
    process.env.EXPO_PUBLIC_ENABLE_GOOGLE_AUTH?.trim()?.toLowerCase() !==
    "false";

  const goToVerifyEmail = async (
    targetEmail: string,
    resendAvailableInSeconds: number,
    pendingPassword?: string,
  ) => {
    await savePendingEmail(targetEmail, pendingPassword);
    router.replace({
      pathname: "/verify-email",
      params: {
        email: targetEmail,
        resendIn: String(resendAvailableInSeconds),
      },
    });
  };

  const finishLogin = async (loginData: {
    user: User;
    access_token: string;
  }) => {
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
    routeAfterAuth(loginData.user);
  };

  const handleSubmit = async () => {
    setError("");
    const errors: {
      identifier?: string;
      username?: string;
      email?: string;
      password?: string;
    } = {};

    if (isRegisterMode) {
      const usernameError = validateRequired(username, "Username");
      if (usernameError) errors.username = usernameError;
      const emailError = validateEmail(email);
      if (emailError) errors.email = emailError;
      const passwordError = validateRequired(password, "Password");
      if (passwordError) errors.password = passwordError;
    } else {
      const identifierError = validateRequired(identifier, "Email or username");
      if (identifierError) errors.identifier = identifierError;
      const passwordError = validateRequired(password, "Password");
      if (passwordError) errors.password = passwordError;
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      if (isRegisterMode) {
        const registered = await registerMutation({
          username: username.trim(),
          email: email.trim(),
          password,
        }).unwrap();
        if (registered.requiresVerification) {
          await goToVerifyEmail(
            registered.email,
            registered.resendAvailableInSeconds,
            password,
          );
          return;
        }
        const loginData = await loginMutation({
          identifier: username.trim(),
          password,
        }).unwrap();
        await finishLogin(loginData);
      } else {
        const loginData = await loginMutation({
          identifier: identifier.trim(),
          password,
        }).unwrap();
        await finishLogin(loginData);
      }
    } catch (err) {
      await clearStoredAuthSession();
      if (!isRegisterMode && isEmailNotVerifiedError(err)) {
        const targetEmail = getEmailFromApiError(err) ?? (identifier.includes("@") ? identifier.trim() : "");
        if (targetEmail) {
          await goToVerifyEmail(
            targetEmail,
            getResendCooldownSeconds(err),
            password,
          );
          return;
        }
      }
      setError(
        getApiErrorMessage(
          err,
          isRegisterMode
            ? "Signup failed. Please try again."
            : "Login failed. Please check your credentials.",
        ),
      );
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
      if (err instanceof Error && err.message.includes("Timed out")) {
        setError(
          "Google callback received, but backend exchange timed out. If using a physical phone, replace localhost in frontend env with your computer LAN IP.",
        );
      } else {
        setError(getApiErrorMessage(err, "Google sign-in failed. Please try again."));
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
            <ScreenHeader
              title={isRegisterMode ? "Create Account" : "Login"}
              showBack={false}
            />
            <ThemedText style={[styles.helperText, { color: muted }]}>
              {isRegisterMode
                ? "Create your account to start ordering."
                : "Sign in with your email or username."}
            </ThemedText>
            {!isRegisterMode ? (
              <ValidatingTextInput
                label="Email or Username"
                placeholder="Enter email or username"
                value={identifier}
                onChangeText={(text) => {
                  setIdentifier(text);
                  if (fieldErrors.identifier) {
                    setFieldErrors((prev) => ({ ...prev, identifier: undefined }));
                  }
                }}
                maxLength={FIELD_LIMITS.identifier}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
                error={fieldErrors.identifier}
              />
            ) : null}
            {isRegisterMode ? (
              <>
                <ValidatingTextInput
                  label="Username"
                  placeholder="Choose a username"
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    if (fieldErrors.username) {
                      setFieldErrors((prev) => ({ ...prev, username: undefined }));
                    }
                  }}
                  maxLength={FIELD_LIMITS.username}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="username"
                  error={fieldErrors.username}
                />
                <ValidatingTextInput
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  maxLength={FIELD_LIMITS.email}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  error={fieldErrors.email}
                />
              </>
            ) : null}
            <ValidatingTextInput
              label="Password"
              placeholder="Enter password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              maxLength={FIELD_LIMITS.password}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              secureTextEntry={!showPassword}
              error={fieldErrors.password}
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
              onPress={() => {
                const nextMode = !isRegisterMode;
                setIsRegisterMode(nextMode);
                setPassword("");
                setShowPassword(false);
                setFieldErrors({});
                setError("");
                if (nextMode) {
                  setIdentifier("");
                } else {
                  setUsername("");
                  setEmail("");
                }
              }}
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
                style={[styles.googleButton, { borderColor, opacity: 0.6 }]}
                disabled={true}
                onHoverIn={() => setError("Google sign-in is under deployment")}
                onHoverOut={() => setError("")}
                onLongPress={() =>
                  setError("Google sign-in is under deployment")
                }
              >
                <ThemedText>Google Sign-In (Coming Soon)</ThemedText>
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
