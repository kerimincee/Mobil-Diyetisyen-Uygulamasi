import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React, { useState } from 'react';
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const { width } = Dimensions.get('window');

// VKI aralıkları ve renkleri
const bmiRanges = [
  { label: 'Zayıf', min: 0, max: 18.5, color: '#4fc3f7', icon: require('../../assets/images/zayif.png') },
  { label: 'Sağlıklı', min: 18.5, max: 25, color: '#8bc34a', icon: require('../../assets/images/saglikli.png') },
  { label: 'Şişman', min: 25, max: 30, color: '#ffeb3b', icon: require('../../assets/images/sisman.png') },
  { label: 'Obez', min: 30, max: 35, color: '#ff9800', icon: require('../../assets/images/obez.png') },
  { label: 'Aşırı Obez', min: 35, max: 60, color: '#e53935', icon: require('../../assets/images/asiriobez.png') },
];

export default function BMI() {
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Kadın' | 'Erkek'>('Kadın');
  const [result, setResult] = useState<null | { vki: number; desc: string; label: string }>(null);
  const [infoVisible, setInfoVisible] = useState(false);

  function calculateBMI() {
    const boyMetre = Number(height) / 100;
    const vki = Number(weight) / (boyMetre * boyMetre);
    let label = '';
    let desc = '';
    if (vki < 18.5) {
      label = 'Zayıf';
      desc = 'Vücut kitle indeksiniz düşük. Sağlıklı bir kiloya ulaşmak için beslenme ve yaşam tarzınızı gözden geçirin.';
    } else if (vki < 25) {
      label = 'Sağlıklı';
      desc = 'Tebrikler! Vücut kitle indeksiniz sağlıklı aralıkta.';
    } else if (vki < 30) {
      label = 'Şişman';
      desc = 'Vücut kitle indeksiniz Şişman aralığında. Sağlıklı beslenme ve egzersiz ile ideal kilonuza ulaşabilirsiniz.';
    } else if (vki < 35) {
      label = 'Obez';
      desc = 'Vücut kitle indeksiniz obez aralığında. Sağlığınız için bir uzmana danışmanız önerilir.';
    } else {
      label = 'Aşırı Obez'; 
      desc = 'Vücut kitle indeksiniz aşırı obez aralığında. Sağlığınız için mutlaka bir uzmana başvurun.';
    }
    setResult({ vki, desc, label });
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={[styles.container, { minHeight: '100%', paddingBottom: 64 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Vücut Kitle Endeksi{"\n"}Hesaplama Aracı</Text>
      <View style={styles.divider} />
      {/* Boy */}
      <Text style={styles.label}>Boyunuz</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={height.toString()}
          keyboardType="numeric"
          onChangeText={v => setHeight(Number(v))}
        />
        <Text style={styles.unit}>cm</Text>
      </View>
      <View style={styles.sliderRow}>
        <Slider
          style={{ width: width * 0.7, height: 40 }}
          minimumValue={100}
          maximumValue={220}
          step={1}
          value={height}
          onValueChange={setHeight}
          minimumTrackTintColor="#4B6C4B"
          maximumTrackTintColor="#e0e4e0"
          thumbTintColor="#4B6C4B"
        />
      </View>
      {/* Kilo */}
      <Text style={styles.label}>Kilonuz</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={weight.toString()}
          keyboardType="numeric"
          onChangeText={v => setWeight(Number(v))}
        />
        <Text style={styles.unit}>kg</Text>
      </View>
      <View style={styles.sliderRow}>
        <Slider
          style={{ width: width * 0.7, height: 40 }}
          minimumValue={30}
          maximumValue={200}
          step={1}
          value={weight}
          onValueChange={setWeight}
          minimumTrackTintColor="#4B6C4B"
          maximumTrackTintColor="#e0e4e0"
          thumbTintColor="#4B6C4B"
        />
      </View>
      {/* Yaş ve Cinsiyet */}
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 10 }]}
          value={age}
          keyboardType="numeric"
          placeholder="Yaşınız"
          placeholderTextColor="#bdbdbd"
          onChangeText={setAge}
        />
        <Pressable
          style={[styles.genderButton, gender === 'Kadın' && styles.genderButtonActive]}
          onPress={() => setGender('Kadın')}
        >
          <Text style={[styles.genderText, gender === 'Kadın' && styles.genderTextActive]}>Kadın</Text>
        </Pressable>
        <Pressable
          style={[styles.genderButton, gender === 'Erkek' && styles.genderButtonActive, { marginLeft: 8 }]}
          onPress={() => setGender('Erkek')}
        >
          <Text style={[styles.genderText, gender === 'Erkek' && styles.genderTextActive]}>Erkek</Text>
        </Pressable>
      </View>
      {/* Hesapla Butonu */}
      <Pressable style={styles.calcButton} onPress={calculateBMI}>
        <Text style={styles.calcButtonText}>VKI Hesapla</Text>
      </Pressable>
      {/* VKI Nedir Butonu */}
      <Pressable style={styles.infoButton} onPress={() => setInfoVisible(true)}>
        <Ionicons name="information-circle-outline" size={20} color="#4B6C4B" style={{ marginRight: 6 }} />
        <Text style={styles.infoButtonText}>VKI Nedir?</Text>
      </Pressable>
      {/* VKI Nedir Modal */}
      {infoVisible && (
        <View style={styles.infoModalOverlay}>
          <View style={styles.infoModalContent}>
            <Pressable style={styles.infoModalCloseIcon} onPress={() => setInfoVisible(false)}>
            <Ionicons name="close" size={18} color="#888" />
            </Pressable>
            <Text style={styles.infoModalTitle}>Vücut Kitle İndeksi (VKİ) Nedir?</Text>
            <Text style={styles.infoModalText}>
              Vücut Kitle İndeksi (VKİ), kilogram cinsinden ağırlığın, metre cinsinden boyun karesine bölünmesiyle elde edilen bir değerdir. VKİ, kişinin zayıf, sağlıklı, fazla kilolu veya obez olup olmadığını belirlemede kullanılır. Sağlık risklerini değerlendirmek için pratik bir göstergedir.
            </Text>
          </View>
        </View>
      )}
      {/* Sonuç ve Açıklama */}
      {result && (
        <View style={styles.resultBox}>
          {/* VKI renk skalası ve gösterge */}
          <View style={styles.bmiBarWrapper}>
            <View style={styles.bmiBar}>
              {bmiRanges.map((range, idx) => (
                <View key={range.label} style={[styles.bmiBarSegment, { backgroundColor: range.color, flex: range.max - range.min }]} />
              ))}
              {/* VKI göstergesi */}
              <View style={[styles.bmiIndicator, { left: `${((Math.min(result.vki, 60) / 60) * 100)}%` }]}/>
            </View>
            <View style={styles.bmiLabelsRow}>
              {bmiRanges.map((range, idx) => (
                <View key={range.label} style={styles.bmiLabelCol}>
                  <Image
                    source={range.icon}
                    style={{ width: 38, height: 38, marginBottom: 2, opacity: result.label === range.label ? 1 : 0.35 }}
                    resizeMode="contain"
                  />
                  <Text style={[styles.bmiLabelText, result.label === range.label && { color: range.color, fontWeight: 'bold' }]}>{range.label}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={styles.resultLabel}>{`Vücut Kitle İndeksiniz: ${result.vki.toFixed(1)}`}</Text>
          <Text style={[styles.resultStatus, result.label === 'Sağlıklı' ? styles.statusHealthy : result.label === 'Zayıf' ? styles.statusThin : result.label === 'Şişman' ? styles.statusOver : result.label === 'Obez' ? styles.statusObese : styles.statusVeryObese]}>{result.label}</Text>
          <Text style={styles.resultDesc}>{result.desc}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const mainColor = '#4B6C4B';
const bgColor = '#f5f7f7';

const styles = StyleSheet.create({
  container: {
    paddingTop: 68,
    paddingHorizontal: 20,
    paddingBottom: 32,
    backgroundColor: bgColor,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: mainColor,
    textAlign: 'center',
    marginBottom: 4,
    marginTop: 4,
  },
  divider: {
    height: 2,
    backgroundColor: '#e0e0e0',
    marginBottom: 18,
    marginHorizontal: 6,
    borderRadius: 2,
  },
  label: {
    fontSize: 14,
    color: '#222',
    marginBottom: 4,
    marginTop: 6,
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#222',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  unit: {
    fontSize: 13,
    color: mainColor,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sliderRow: {
    height: 24,
    justifyContent: 'center',
    marginBottom: 10,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#e0e4e0',
    borderRadius: 3,
    width: width * 0.7,
    alignSelf: 'center',
  },
  sliderFill: {
    height: 6,
    backgroundColor: mainColor,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  sliderThumb: {
    position: 'absolute',
    top: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: mainColor,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 2,
  },
  genderButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: mainColor,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  genderButtonActive: {
    backgroundColor: mainColor,
    borderColor: mainColor,
  },
  genderText: {
    color: mainColor,
    fontWeight: 'bold',
    fontSize: 14,
  },
  genderTextActive: {
    color: '#fff',
  },
  calcButton: {
    backgroundColor: mainColor,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  calcButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  resultBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 10,
    marginTop: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: mainColor,
    marginBottom: 2,
  },
  resultStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statusHealthy: {
    color: '#4caf50',
  },
  statusThin: {
    color: '#2196f3',
  },
  statusOver: {
    color: '#ff9800',
  },
  statusObese: {
    color: '#e53935',
  },
  statusVeryObese: {
    color: '#b71c1c',
  },
  resultDesc: {
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
    marginTop: 1,
    lineHeight: 15,
  },
  bmiBarWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 6,
  },
  bmiBar: {
    flexDirection: 'row',
    width: '100%',
    height: 6,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
    position: 'relative',
    backgroundColor: '#eee',
  },
  bmiBarSegment: {
    height: 6,
  },
  bmiIndicator: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#222',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 2,
    marginLeft: -6,
  },
  bmiLabelsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 0,
  },
  bmiLabelCol: {
    alignItems: 'center',
    flex: 1,
  },
  bmiLabelText: {
    fontSize: 10,
    color: '#bbb',
    textAlign: 'center',
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 4,
    alignSelf: 'center',
    backgroundColor: '#eaf2ea',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoButtonText: {
    color: '#4B6C4B',
    fontWeight: 'bold',
    fontSize: 13,
  },
  infoModalOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  infoModalContent: {
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 14,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
    position: 'relative',
  },
  infoModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B6C4B',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  infoModalText: {
    fontSize: 13,
    color: '#444',
    textAlign: 'center',
    marginBottom: 0,
    lineHeight: 18,
    fontWeight: '400',
  },
  infoModalCloseIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    padding: 4,
  },
}); 