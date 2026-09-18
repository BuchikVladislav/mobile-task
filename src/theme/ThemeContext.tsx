import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  background: string;
  card: string;
  input: string;
  text: string;
  secondaryText: string;
  border: string;
  primary: string;
  primaryText: string;
  danger: string;
  muted: string;
}

interface ThemeContextValue {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = '@mobile-task/theme';

const lightColors: ThemeColors = {
  background: '#fff',
  card: '#f5f5f5',
  input: '#fff',
  text: '#222',
  secondaryText: '#666',
  border: '#ccc',
  primary: '#222',
  primaryText: '#fff',
  danger: '#c00',
  muted: '#eee',
};

const darkColors: ThemeColors = {
  background: '#121212',
  card: '#1e1e1e',
  input: '#1e1e1e',
  text: '#fff',
  secondaryText: '#aaa',
  border: '#444',
  primary: '#fff',
  primaryText: '#121212',
  danger: '#ff6b6b',
  muted: '#2a2a2a',
};

const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme =
          await AsyncStorage.getItem(THEME_STORAGE_KEY);

        if (savedTheme === 'dark') {
          setIsDark(true);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newIsDark = !isDark;

    setIsDark(newIsDark);

    try {
      await AsyncStorage.setItem(
        THEME_STORAGE_KEY,
        newIsDark ? 'dark' : 'light',
      );
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        colors,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used inside ThemeProvider',
    );
  }

  return context;
}