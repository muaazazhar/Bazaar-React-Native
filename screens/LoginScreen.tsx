import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function LoginScreen() {
  const { login, signup } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (isRegisterMode) {
        if (!username.trim()) {
          setError('Username is required.');
          setLoading(false);
          return;
        }
        await signup(username, email, password);
      } else {
        await login(identifier, password);
      }
      router.replace('/');
    } catch {
      setError(isRegisterMode ? 'Signup failed. Please try again.' : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{isRegisterMode ? 'Create Account' : 'Login'}</ThemedText>
      {!isRegisterMode ? (
        <TextInput
          style={styles.input}
          placeholder="Email or Username"
          autoCapitalize="none"
          value={identifier}
          onChangeText={setIdentifier}
        />
      ) : null}
      {isRegisterMode ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Username"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </>
      ) : null}
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {!!error && <ThemedText style={styles.error}>{error}</ThemedText>}
      <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.buttonText}>{isRegisterMode ? 'Create Account' : 'Sign In'}</ThemedText>
        )}
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={() => setIsRegisterMode((prev) => !prev)} disabled={loading}>
        <ThemedText>{isRegisterMode ? 'Already have an account? Login' : 'New user? Create account'}</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  error: {
    color: '#d32f2f',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
});
