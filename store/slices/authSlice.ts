import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { User } from '@/types/domain';

type AuthState = {
  user: User | null;
  token: string | null;
  hydrated: boolean;
};

const initialState: AuthState = {
  user: null,
  token: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.hydrated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.hydrated = true;
    },
    hydrateAuth: (state, action: PayloadAction<{ user: User; token: string } | null>) => {
      if (action.payload) {
        state.user = action.payload.user;
        state.token = action.payload.token;
      } else {
        state.user = null;
        state.token = null;
      }
      state.hydrated = true;
    },
  },
});

export const { setCredentials, logout, hydrateAuth } = authSlice.actions;
export const authReducer = authSlice.reducer;
