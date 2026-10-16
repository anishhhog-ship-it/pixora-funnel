import { Platform, ViewStyle } from 'react-native';

export const colors = {
  navy: '#07143D',
  blue: '#0B6BFF',
  blueDark: '#0757D5',
  blueSoft: '#EEF6FF',
  bluePale: '#F5F9FF',
  mint: '#E7F9F0',
  mintText: '#087443',
  orange: '#F59E0B',
  ink: '#0B1437',
  body: '#5D6B8A',
  muted: '#8A96AD',
  border: '#E5ECF7',
  surface: '#FFFFFF',
  background: '#FBFCFF',
  danger: '#B42318',
  dangerSoft: '#FFF1F0',
};

export const radii = {
  card: 22,
  button: 14,
  pill: 999,
};

export const shadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: '#5B7DB6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
  },
  android: {
    elevation: 3,
  },
  default: {},
});
