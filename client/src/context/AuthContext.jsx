import React, { createContext, useReducer, useEffect } from 'react';
import api from '../utils/api';

const initialState = {
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    loading: true,
    user: null
};

export const AuthContext = createContext(initialState);

const authReducer = (state, action) => {
    switch (action.type) {

        case 'USER_LOADED':
            return {
                ...state,
                isAuthenticated: true,
                loading: false,
                user: action.payload
            };

        case 'REGISTER_SUCCESS':
        case 'LOGIN_SUCCESS':
            localStorage.setItem('token', action.payload.token);
            return {
                ...state,
                token: action.payload.token,
                user: action.payload.user || null,
                isAuthenticated: true,
                loading: false
            };

        case 'REGISTER_FAIL':
        case 'LOGIN_FAIL':
        case 'LOGOUT':
        case 'AUTH_ERROR':
            localStorage.removeItem('token');
            return {
                ...state,
                token: null,
                isAuthenticated: false,
                loading: false,
                user: null
            };

        default:
            return state;
    }
};

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    const loadUser = async () => {
        const token = localStorage.getItem('token');

        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            try {
                const res = await api.get('/auth/profile'); // ✅ FIXED
                dispatch({
                    type: 'USER_LOADED',
                    payload: res.data
                });
            } catch (err) {
                dispatch({ type: 'AUTH_ERROR' });
            }
        } else {
            dispatch({ type: 'AUTH_ERROR' });
        }
    };

    const register = async (formData) => {
        try {
            const res = await api.post('/auth/register', formData); // ✅ FIXED

            dispatch({
                type: 'REGISTER_SUCCESS',
                payload: res.data
            });

            await loadUser();

        } catch (err) {
            dispatch({ type: 'REGISTER_FAIL' });
            throw err;
        }
    };

    const login = async (formData) => {
        try {
            const res = await api.post('/auth/login', formData); // ✅ FIXED

            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: res.data
            });

            const token = res.data.token;
            if (token) {
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                try {
                    const profileRes = await api.get('/auth/profile'); // ✅ FIXED
                    dispatch({ type: 'USER_LOADED', payload: profileRes.data });
                } catch (_) {
                    // ignore profile error
                }
            }

        } catch (err) {
            dispatch({ type: 'LOGIN_FAIL' });
            throw err;
        }
    };

    const logout = () => dispatch({ type: 'LOGOUT' });

    const updateProfile = async (data) => {
        await api.put('/auth/profile', data); // ✅ FIXED
        await loadUser();
    };

    useEffect(() => {
        loadUser();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                token: state.token,
                isAuthenticated: state.isAuthenticated,
                loading: state.loading,
                user: state.user,
                register,
                login,
                logout,
                loadUser,
                updateProfile
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};