import React, { useEffect } from 'react'
import { StatusBar } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import NetInfo from '@react-native-community/netinfo'

import { RootNavigator } from './src/navigation/RootNavigator'
import { setupApiInterceptors } from './src/api/client'
import { useAuthStore } from './src/store/authStore'
import { useGameStore } from './src/store/gameStore'
import { SyncManager } from './src/utils/syncManager'

const queryClient = new QueryClient()

function AppContent() {
  const token = useAuthStore((s) => s.token)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const setOffline = useGameStore((s) => s.setOffline)

  useEffect(() => {
    setupApiInterceptors(() => token, clearAuth)
  }, [token, clearAuth])

  // Initialize SQLite + sync on first login
  useEffect(() => {
    if (!token) return
    SyncManager.initialize().catch(console.warn)
  }, [token])

  // NetInfo: update offline banner + trigger sync on reconnect
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false
      setOffline(!connected)
      if (connected && token) {
        SyncManager.onNetworkRestore().catch(console.warn)
      }
    })
    return unsubscribe
  }, [token, setOffline])

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F5EFE0" />
      <RootNavigator />
    </>
  )
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
