import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  TextInput,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { companionApi, type ChatMessage } from '../../api/companion.api'
import { colors } from '../../theme'

const GREETING = '*waves at you* Hello! I am your spirit friend! Say something!'

export function CompanionScreen() {
  const navigation = useNavigation()
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: GREETING },
  ])
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [remainingMinutes, setRemainingMinutes] = useState<number | null>(null)
  const [limitReached, setLimitReached] = useState(false)
  const listRef = useRef<FlatList>(null)
  const spiritBounce = useRef(new Animated.Value(0)).current

  useEffect(() => {
    companionApi.getStatus().then((s) => {
      setRemainingMinutes(s.remainingMinutes)
      if (s.remainingMinutes === 0) setLimitReached(true)
    })

    Animated.loop(
      Animated.sequence([
        Animated.timing(spiritBounce, { toValue: -8, duration: 600, useNativeDriver: true }),
        Animated.timing(spiritBounce, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ).start()
  }, [spiritBounce])

  const sendMessage = useCallback(async () => {
    const text = inputText.trim()
    if (!text || sending || limitReached) return

    const history = messages.slice(-12)
    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setSending(true)

    try {
      const res = await companionApi.chat(text, history)
      setMessages((prev) => [...prev, { role: 'assistant', content: res.text }])
    } catch (err: any) {
      if (err?.response?.data?.code === 'DAILY_LIMIT') {
        setLimitReached(true)
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'See you tomorrow! *waves goodbye*' },
        ])
      }
    } finally {
      setSending(false)
      companionApi.getStatus().then((s) => {
        setRemainingMinutes(s.remainingMinutes)
        if (s.remainingMinutes === 0) setLimitReached(true)
      })
    }
  }, [inputText, sending, limitReached, messages])

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user'
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && <View style={styles.spiritAvatar} />}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleSpirit]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{item.content}</Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>语灵伙伴</Text>
        {remainingMinutes !== null && (
          <Text style={styles.timeLabel}>
            {limitReached ? '今日已结束' : `今天还有 ${remainingMinutes} 分钟`}
          </Text>
        )}
      </View>

      {/* Spirit idle figure */}
      <Animated.View style={[styles.spiritContainer, { transform: [{ translateY: spiritBounce }] }]}>
        <View style={styles.spiritBody} />
        <Text style={styles.spiritEmoji}>{sending ? '💭' : '✨'}</Text>
      </Animated.View>

      {/* Chat history */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={limitReached ? '今日对话已结束～' : '说点什么…'}
          placeholderTextColor={colors.text.hint}
          editable={!limitReached && !sending}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (sending || limitReached || !inputText.trim()) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={sending || limitReached || !inputText.trim()}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendBtnText}>发送</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A4E',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: colors.text.inverse,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    color: colors.text.inverse,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  timeLabel: {
    color: colors.text.hint,
    fontSize: 12,
    minWidth: 80,
    textAlign: 'right',
  },
  spiritContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  spiritBody: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.spiritPurple,
    opacity: 0.8,
  },
  spiritEmoji: {
    fontSize: 28,
    position: 'absolute',
    bottom: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  msgRow: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  spiritAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.spiritPurple,
    marginRight: 8,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bubbleSpirit: {
    backgroundColor: '#2A2A4E',
  },
  bubbleUser: {
    backgroundColor: colors.spiritPurple,
  },
  bubbleText: {
    color: colors.text.inverse,
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: '#FFFFFF',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A4E',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A2A4E',
    paddingHorizontal: 16,
    color: colors.text.inverse,
    fontSize: 15,
  },
  sendBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: colors.spiritPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
})
