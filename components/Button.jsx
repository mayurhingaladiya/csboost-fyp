import { View, Text, Pressable, StyleSheet } from 'react-native'
import React from 'react'
import { theme } from '../constants/theme'
import { hp } from '../app/helpers/common'
import Loading from './Loading'

const Button = ({
    buttonStyle,
    textStyle,
    title = '',
    onPress = () => {},
    loading = false,
    hasShadow = true,
}) => {
    const shadowStyle = {
        shadowColor: theme.colors.dark,
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 1,
        shadowRadius: 1,
    }

    if (loading){
        return (
            <View style={[styles.button, buttonStyle, {backgroundColor: 'white'}]}>
                <Loading/>
            </View>
        )
    }
  return (
    <Pressable onPress = {onPress} style={[styles.button, buttonStyle, hasShadow && shadowStyle]}>
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </Pressable>
  )
}

export default Button

const styles = StyleSheet.create({
    button: {
        backgroundColor: theme.colors.primary,
        height: hp(6.0),
        justifyContent: "center",
        alignItems: "center",
        borderCurve: "circular",
        borderRadius: theme.radius.xxxl,
    },
    text: {
        fontSize: hp(2.0),
        color: "white",
        fontWeight: theme.fonts.bold
    }
})