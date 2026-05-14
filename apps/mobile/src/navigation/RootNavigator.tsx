import React from 'react'
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'

import { WelcomeScreen } from '../screens/Auth/WelcomeScreen'
import { RegisterScreen } from '../screens/Auth/RegisterScreen'
import { LoginScreen } from '../screens/Auth/LoginScreen'
import { WorldMapScreen } from '../screens/Map/WorldMapScreen'
import { BattleScreen } from '../screens/Battle/BattleScreen'
import { GrimoireScreen } from '../screens/Grimoire/GrimoireScreen'
import { ParentReportScreen } from '../screens/Parent/ParentReportScreen'
import { CompanionScreen } from '../screens/Companion/CompanionScreen'
import { useAuthStore } from '../store/authStore'
import { colors, radius } from '../theme'

export type AuthStackParamList = {
  Welcome: undefined
  Register: undefined
  Login: undefined
}

type AppTabParamList = {
  WorldMap: undefined
  Battle: undefined
  Grimoire: undefined
}

type AppStackParamList = {
  Tabs: undefined
  ParentReport: undefined
  Companion: undefined
}

const AuthStack = createNativeStackNavigator<AuthStackParamList>()
const AppTab = createBottomTabNavigator<AppTabParamList>()
const AppStack = createNativeStackNavigator<AppStackParamList>()

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.tabBar}>
      {/* 世界地图 */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('WorldMap')}
      >
        <View style={[styles.tabIcon, state.index === 0 && styles.tabIconActive]}>
          <View style={styles.mapIcon} />
        </View>
      </TouchableOpacity>

      {/* 战斗按钮（居中悬浮） */}
      <TouchableOpacity
        style={styles.battleBtn}
        onPress={() => navigation.navigate('Battle')}
        activeOpacity={0.85}
      >
        <View style={styles.battleBtnInner} />
      </TouchableOpacity>

      {/* 图鉴 */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('Grimoire')}
      >
        <View style={[styles.tabIcon, state.index === 2 && styles.tabIconActive]}>
          <View style={styles.grimoireIcon} />
        </View>
      </TouchableOpacity>
    </View>
  )
}

function AppTabNavigator() {
  return (
    <AppTab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <AppTab.Screen name="WorldMap" component={WorldMapScreen} />
      <AppTab.Screen name="Battle" component={BattleScreen} />
      <AppTab.Screen name="Grimoire" component={GrimoireScreen} />
    </AppTab.Navigator>
  )
}

function AppStackNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="Tabs" component={AppTabNavigator} />
      <AppStack.Screen name="ParentReport" component={ParentReportScreen} />
      <AppStack.Screen name="Companion" component={CompanionScreen} />
    </AppStack.Navigator>
  )
}

export function RootNavigator() {
  const token = useAuthStore((s) => s.token)
  const isLoggedIn = !!token

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        <AppStackNavigator />
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
          <AuthStack.Screen name="Register" component={RegisterScreen} />
          <AuthStack.Screen name="Login" component={LoginScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface.primary,
    height: Platform.OS === 'ios' ? 88 : 64,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingBottom: Platform.OS === 'ios' ? 24 : 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  tabIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: colors.spiritPurple,
  },
  mapIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  grimoireIcon: {
    width: 12,
    height: 16,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  battleBtn: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.spiritPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 12 : 24,
    shadowColor: colors.spiritPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  battleBtnInner: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
})
