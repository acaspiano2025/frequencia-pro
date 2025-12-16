import { StyleSheet, View } from 'react-native';

// Logo do Google simplificado usando apenas Views nativas
// Representa as 4 cores do logo do Google
export default function GoogleLogo({ size = 20 }: { size?: number }) {
  const halfSize = size / 2;
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.logo, { width: size, height: size, borderRadius: size * 0.1 }]}>
        {/* Quadrante azul (superior esquerdo) */}
        <View style={[styles.quadrant, styles.blue, { width: halfSize, height: halfSize, top: 0, left: 0, borderTopLeftRadius: size * 0.1 }]} />
        {/* Quadrante verde (superior direito) */}
        <View style={[styles.quadrant, styles.green, { width: halfSize, height: halfSize, top: 0, right: 0, borderTopRightRadius: size * 0.1 }]} />
        {/* Quadrante amarelo (inferior esquerdo) */}
        <View style={[styles.quadrant, styles.yellow, { width: halfSize, height: halfSize, bottom: 0, left: 0, borderBottomLeftRadius: size * 0.1 }]} />
        {/* Quadrante vermelho (inferior direito) */}
        <View style={[styles.quadrant, styles.red, { width: halfSize, height: halfSize, bottom: 0, right: 0, borderBottomRightRadius: size * 0.1 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    position: 'relative',
  },
  quadrant: {
    position: 'absolute',
  },
  blue: {
    backgroundColor: '#4285F4',
  },
  green: {
    backgroundColor: '#34A853',
  },
  yellow: {
    backgroundColor: '#FBCB05',
  },
  red: {
    backgroundColor: '#EA4335',
  },
});
