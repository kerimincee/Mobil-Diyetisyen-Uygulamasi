import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const GEMINI_API_KEY = 'AIzaSyDF0l8JeAJ0a38qGmKd4yCX-ROG4NW8xrY';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=' + GEMINI_API_KEY;

export default function ChatbotScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Merhaba! Ben sizin diyet asistanınızım. Size nasıl yardımcı olabilirim?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
            { role: 'user', parts: [{ text: input }] }
          ]
        })
      });
      const data = await res.json();
      if (data.error) {
        setMessages(prev => [...prev, { role: 'model', text: 'API Hatası: ' + (data.error.message || JSON.stringify(data.error)) }]);
      } else {
        let geminiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Bir hata oluştu.';
        setMessages(prev => [...prev, { role: 'model', text: geminiText }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: 'Bir hata oluştu. Lütfen tekrar deneyin.' }]);
    }
    setLoading(false);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View pointerEvents="none" style={styles.bgIconWrapper}>
        <Image source={require('@/assets/images/diyetasistani.png')} style={styles.bgIcon} />
      </View>
      <View style={styles.header}> 
        <Markdown style={markdownStyles.headerTitle}>Diyet Asistanı</Markdown>
      </View>
      <View style={styles.divider} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', paddingBottom: 16 }}
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg, idx) => (
            <View key={idx} style={[styles.messageRow, msg.role === 'user' ? styles.messageRowUser : styles.messageRowModel]}> 
              {msg.role === 'user' ? (
                <View style={[styles.avatarCircle, styles.avatarUser]}> 
                  <Ionicons name={'person'} size={28} color={'#fff'} />
                </View>
              ) : (
                <View style={[styles.avatarCircle, styles.avatarModel]}> 
                  <Image source={require('@/assets/images/diyetasistani.png')} style={styles.modelAvatarImg} />
                </View>
              )}
              <View style={[styles.messageBubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleModel]}> 
                <Markdown style={msg.role === 'user' ? markdownStyles.user : markdownStyles.model}>
                  {msg.text}
                </Markdown>
              </View>
            </View>
          ))}
          {loading && (
            <View style={styles.messageRowModel}>
              <View style={[styles.avatarCircle, styles.avatarModel]}>
                <Image source={require('@/assets/images/diyetasistani.png')} style={styles.modelAvatarImg} />
              </View>
              <View style={[styles.messageBubble, styles.bubbleModel]}>
                <ActivityIndicator size="small" color="#6b8e5e" />
              </View>
            </View>
          )}
        </ScrollView>
        <View style={[styles.inputBarWrapper, { paddingBottom: insets.bottom + 12, marginBottom: 12 }]}> 
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Mesajınızı yazın..."
              placeholderTextColor="#bdbdbd"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
              editable={!loading}
              returnKeyType="send"
            />
            <Pressable style={styles.sendButton} onPress={sendMessage} disabled={loading || !input.trim()}>
              <Ionicons name="send" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const FONT_FAMILY = Platform.select({ ios: 'Nunito', android: 'Nunito', default: 'Nunito' });

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#23272f',
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  bgIconWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
    opacity: 0.10,
  },
  bgIcon: {
    width: 260,
    height: 260,
    resizeMode: 'contain',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    gap: 8,
  },
  divider: {
    height: 2,
    backgroundColor: '#3a3f47',
    marginBottom: 8,
    marginHorizontal: 24,
    borderRadius: 2,
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowModel: {
    justifyContent: 'flex-start',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    backgroundColor: 'transparent',
  },
  avatarUser: {
    backgroundColor: '#467631',
  },
  avatarModel: {
    backgroundColor: '#2e333d',
  },
  modelAvatarImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    resizeMode: 'contain',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bubbleUser: {
    backgroundColor: '#467631',
    borderBottomRightRadius: 6,
    alignSelf: 'flex-end',
  },
  bubbleModel: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 6,
    alignSelf: 'flex-start',
  },
  inputBarWrapper: {
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2e333d',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  sendButton: {
    backgroundColor: '#6b8e5e',
    borderRadius: 16,
    padding: 8,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const markdownStyles = {
  headerTitle: {
    body: {
      fontSize: 24,
      fontWeight: 'bold' as 'bold',
      color: '#6b8e5e',
      letterSpacing: 0.5,
      fontFamily: FONT_FAMILY,
      textAlign: 'center' as 'center',
    },
  },
  user: {
    body: {
      color: '#fff',
      fontSize: 15,
      fontFamily: FONT_FAMILY,
    },
    strong: { color: '#fff', fontWeight: 'bold' as 'bold' },
    em: { color: '#fff', fontStyle: 'italic' as 'italic' },
    heading1: { color: '#fff', fontSize: 18, fontWeight: 'bold' as 'bold' },
    heading2: { color: '#fff', fontSize: 17, fontWeight: 'bold' as 'bold' },
    heading3: { color: '#fff', fontSize: 16, fontWeight: 'bold' as 'bold' },
    bullet_list: { color: '#fff' },
    ordered_list: { color: '#fff' },
    list_item: { color: '#fff' },
  },
  model: {
    body: {
      color: '#23272f',
      fontSize: 15,
      fontFamily: FONT_FAMILY,
    },
    strong: { color: '#23272f', fontWeight: 'bold' as 'bold' },
    em: { color: '#23272f', fontStyle: 'italic' as 'italic' },
    heading1: { color: '#467631', fontSize: 18, fontWeight: 'bold' as 'bold' },
    heading2: { color: '#467631', fontSize: 17, fontWeight: 'bold' as 'bold' },
    heading3: { color: '#467631', fontSize: 16, fontWeight: 'bold' as 'bold' },
    bullet_list: { color: '#23272f' },
    ordered_list: { color: '#23272f' },
    list_item: { color: '#23272f' },
  },
}; 