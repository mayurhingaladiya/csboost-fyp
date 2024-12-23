import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { theme } from '../../constants/theme'
import Home from './Home'
import ArrowLeft from './ArrowLeft'
import Email from './Email'
import Lock from './Lock'

const icons = {
    home: Home,
    arrowleft: ArrowLeft,
    email: Email,
    lock: Lock,
}

const Icon = ({ name, ...props }) => {
    const IconComponent = icons[name]
    return (
        <IconComponent height={props.size || 24}
            width={props.size || 24}
            strokeWidth = {props.strokeWidth || 1.9}
            color = {theme.colors.textLight}
            {...props}

        />
    )
}

export default Icon;

