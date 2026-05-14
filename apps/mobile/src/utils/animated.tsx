/**
 * Reanimated Animated.View 在 @types/react 18.3 下有 JSX 返回类型兼容问题。
 * 手写 props 类型（含 AnimatedStyleHandle），用函数封装让 TS 推断正确返回类型。
 */
import React from 'react'
import { ViewProps } from 'react-native'
import Animated from 'react-native-reanimated'

// Accept animated styles via `any` — avoids pulling in AnimatedComponentType constraint
export interface AnimViewProps extends Omit<ViewProps, 'style'> {
  style?: any
  children?: React.ReactNode
}

export function AnimView(props: AnimViewProps): React.ReactElement {
  const V = Animated.View as any
  return <V {...props} />
}
