import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { fontFamily, spacing } from '../../constants/theme';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  light?: boolean;
}

const ICON_HEIGHT = { sm: 54, md: 76, lg: 104 } as const;
const WORDMARK_HEIGHT = { sm: 23, md: 31, lg: 42 } as const;

const ICON_ASPECT = 287 / 171;     // largura / altura de logo-icon.png
const WORDMARK_ASPECT = 390 / 56;  // largura / altura de logo-wordmark.png

export default function Logo({ size = 'md', showTagline = false, light = false }: LogoProps) {
  const iconHeight = ICON_HEIGHT[size];
  const iconWidth = iconHeight * ICON_ASPECT;

  const wordmarkHeight = WORDMARK_HEIGHT[size];
  const wordmarkWidth = wordmarkHeight * WORDMARK_ASPECT;

  return (
    <View style={styles.row}>
      <Image
        source={require('../../../assets/images/logo-icon.png')}
        style={{ width: iconWidth, height: iconHeight, marginRight: -16, marginBottom: -14 }}
        resizeMode="contain"
      />

      <View style={styles.textArea}>
        <Image
          source={require('../../../assets/images/logo-wordmark.png')}
          style={{ width: wordmarkWidth, height: wordmarkHeight }}
          resizeMode="contain"
        />
        {showTagline ? (
          <Text style={[styles.tagline, { color: light ? 'rgba(255,255,255,0.7)' : '#8A94A6' }]}>
            EXPLORE · CONECTE · VIVA ANGOLA
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  textArea: { justifyContent: 'center' },
  tagline: { fontFamily: fontFamily.textMedium, fontSize: 10, letterSpacing: 1.1, marginTop: 3 },
});






