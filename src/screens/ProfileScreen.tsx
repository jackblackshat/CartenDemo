import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDarkMode } from '../context/DarkModeContext';
import ToggleSwitch from '../components/ToggleSwitch';
import SubscriptionModal from '../components/SubscriptionModal';
import DurationModal from '../components/DurationModal';
import type { ProfileStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<ProfileStackParamList>;

const CREDITS_FOR_FREE_MONTH = 5000;

export default function ProfileScreen() {
  const navigation = useNavigation<NavProp>();
  const { isDark, toggleDarkMode } = useDarkMode();
  const [showSubscription, setShowSubscription] = useState(false);
  const [showDuration, setShowDuration] = useState(false);
  const [carPlayEnabled, setCarPlayEnabled] = useState(true);
  const [defaultDuration, setDefaultDuration] = useState('1 hour');
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userName, setUserName] = useState('Alex Chen');
  const [userEmail, setUserEmail] = useState('alex.chen@email.com');
  const [credits, setCredits] = useState(247);
  const [freeMonthRedeemed, setFreeMonthRedeemed] = useState(false);

  const handleGoogleSignIn = () => {
    // Simulated Google sign-in
    setIsSignedIn(true);
    setUserName('Alex Chen');
    setUserEmail('alex.chen@gmail.com');
    Alert.alert('Signed In', 'Welcome back, Alex! Your data has been synced across devices.');
  };

  const handleSignOut = () => {
    setIsSignedIn(false);
    setUserEmail('alex.chen@email.com');
    Alert.alert('Signed Out', 'You have been signed out.');
  };

  const handleRedeemFreeMonth = () => {
    if (credits >= CREDITS_FOR_FREE_MONTH && !freeMonthRedeemed) {
      setCredits((c) => c - CREDITS_FOR_FREE_MONTH);
      setFreeMonthRedeemed(true);
      Alert.alert(
        'Pro Unlocked!',
        'You redeemed 5,000 credits for 1 month of Carten Pro. Enjoy real-time data, camera feeds, and priority alerts!',
      );
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#1C1C1E' : '#F5F1E8' }]}
      contentContainerStyle={styles.content}
    >
      {/* Header with sign-in */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Profile</Text>
        {!isSignedIn ? (
          <TouchableOpacity onPress={handleGoogleSignIn} style={[styles.googleBtn, {
            backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
            borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
          }]}>
            <Text style={styles.googleG}>G</Text>
            <Text style={[styles.googleText, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Sign in</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSignOut} style={[styles.signOutBtn, {
            backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
            borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
          }]}>
            <Ionicons name="log-out-outline" size={16} color={isDark ? '#AEAEB2' : '#8A8D91'} />
            <Text style={[styles.signOutText, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Sign out</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Profile card */}
      <View style={[styles.card, {
        backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
        borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
      }]}>
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, {
            backgroundColor: isDark ? '#3A3A3C' : 'rgba(127, 169, 142, 0.15)',
            borderColor: isSignedIn ? '#4285F4' : '#7FA98E',
          }]}>
            {isSignedIn ? (
              <Text style={styles.avatarLetter}>{userName.charAt(0)}</Text>
            ) : (
              <Ionicons name="person" size={32} color="#7FA98E" />
            )}
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{userName}</Text>
              {isSignedIn && (
                <View style={styles.syncedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#4285F4" />
                  <Text style={styles.syncedText}>Synced</Text>
                </View>
              )}
            </View>
            <Text style={[styles.email, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{userEmail}</Text>
          </View>
        </View>
      </View>

      {/* Stats Card */}
      <View style={[styles.card, {
        backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
        borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
      }]}>
        <View style={styles.statRow}>
          <View style={styles.statLeft}>
            <View style={styles.trustIcon}>
              <Ionicons name="trophy" size={24} color="#7FA98E" />
            </View>
            <View>
              <Text style={[styles.statLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Trust Score</Text>
              <Text style={[styles.statBig, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>87</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.statLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Tier</Text>
            <View style={styles.tierBadge}>
              <Text style={styles.tierText}>Free</Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: isDark ? '#3A3A3C' : '#D3D5D7' }]} />

        <View style={styles.statRow}>
          <View>
            <Text style={[styles.statLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Credits Balance</Text>
            <Text style={[styles.creditValue, { color: '#7FA98E' }]}>{credits.toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={styles.earnButton}>
            <Text style={styles.earnText}>Earn More</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Free Month Reward Card */}
      <View style={[styles.rewardCard, {
        backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
        borderColor: credits >= CREDITS_FOR_FREE_MONTH ? '#C9A96E' : isDark ? '#3A3A3C' : '#D3D5D7',
        borderWidth: credits >= CREDITS_FOR_FREE_MONTH ? 2 : 1,
      }]}>
        <View style={styles.rewardHeader}>
          <View style={[styles.rewardIcon, {
            backgroundColor: freeMonthRedeemed ? 'rgba(127, 169, 142, 0.15)' : 'rgba(201, 169, 110, 0.15)',
          }]}>
            <Ionicons
              name={freeMonthRedeemed ? 'checkmark-circle' : 'gift'}
              size={24}
              color={freeMonthRedeemed ? '#7FA98E' : '#C9A96E'}
            />
          </View>
          <View style={styles.rewardInfo}>
            <Text style={[styles.rewardTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>
              {freeMonthRedeemed ? '1 Month Pro — Active!' : '1 Month Free Pro'}
            </Text>
            <Text style={[styles.rewardSub, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
              {freeMonthRedeemed
                ? 'Enjoy real-time data, camera feeds & priority alerts'
                : `Earn ${CREDITS_FOR_FREE_MONTH.toLocaleString()} credits to unlock 1 month of Carten Pro`}
            </Text>
          </View>
        </View>
        {/* Progress bar */}
        {!freeMonthRedeemed && (
          <>
            <View style={styles.rewardProgressWrap}>
              <View style={[styles.rewardProgressBg, { backgroundColor: isDark ? '#3A3A3C' : '#E8E8E8' }]}>
                <View style={[styles.rewardProgressFill, {
                  width: `${Math.min(100, (credits / CREDITS_FOR_FREE_MONTH) * 100)}%`,
                }]} />
              </View>
              <Text style={[styles.rewardProgressText, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
                {credits.toLocaleString()} / {CREDITS_FOR_FREE_MONTH.toLocaleString()} credits
              </Text>
            </View>
            {credits >= CREDITS_FOR_FREE_MONTH ? (
              <TouchableOpacity onPress={handleRedeemFreeMonth} style={styles.redeemBtn} activeOpacity={0.8}>
                <Ionicons name="gift" size={18} color="#FFFFFF" />
                <Text style={styles.redeemBtnText}>Redeem Free Month</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.rewardTips}>
                <Text style={[styles.rewardTipTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Earn credits faster:</Text>
                {[
                  { icon: 'location-outline' as const, text: 'Report parking spots (+5-15)', color: '#7FA98E' },
                  { icon: 'flame-outline' as const, text: 'Complete weekly challenges (+25-50)', color: '#C9A96E' },
                  { icon: 'trending-up-outline' as const, text: 'Keep your streak for 2x bonus', color: '#4A90D9' },
                ].map((tip, i) => (
                  <View key={i} style={styles.rewardTipRow}>
                    <Ionicons name={tip.icon} size={14} color={tip.color} />
                    <Text style={[styles.rewardTipText, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{tip.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>

      {/* Activity Grid */}
      <Text style={[styles.sectionTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Your Activity</Text>
      <View style={styles.gridRow}>
        <View style={[styles.gridCard, {
          backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
          borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
        }]}>
          <View style={styles.gridIconRow}>
            <Ionicons name="trending-up" size={16} color="#7FA98E" />
            <Text style={[styles.gridLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Spots Shared</Text>
          </View>
          <Text style={[styles.gridValue, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>142</Text>
        </View>
        <View style={[styles.gridCard, {
          backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
          borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
        }]}>
          <View style={styles.gridIconRow}>
            <Ionicons name="checkmark" size={16} color="#7FA98E" />
            <Text style={[styles.gridLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Accuracy</Text>
          </View>
          <Text style={[styles.gridValue, { color: '#7FA98E' }]}>94%</Text>
        </View>
      </View>

      {/* Upgrade */}
      <TouchableOpacity
        onPress={() => setShowSubscription(true)}
        style={[styles.upgradeCard, {
          backgroundColor: '#7FA98E',
        }]}
      >
        <View style={styles.upgradeRow}>
          <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
          <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.upgradeSub}>Get real-time data, camera feeds, priority alerts & more</Text>
      </TouchableOpacity>

      {/* Settings */}
      <Text style={[styles.sectionTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Settings</Text>
      <View style={[styles.settingsCard, {
        backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
        borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
      }]}>
        <TouchableOpacity onPress={toggleDarkMode} style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={isDark ? '#AEAEB2' : '#8A8D91'} />
            <Text style={[styles.settingLabel, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Text>
          </View>
          <ToggleSwitch enabled={isDark} onChange={toggleDarkMode} />
        </TouchableOpacity>

        <View style={[styles.settingDivider, { backgroundColor: isDark ? '#3A3A3C' : '#D3D5D7' }]} />

        <TouchableOpacity onPress={() => navigation.navigate('NotificationSettings')} style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={20} color={isDark ? '#AEAEB2' : '#8A8D91'} />
            <Text style={[styles.settingLabel, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDark ? '#AEAEB2' : '#8A8D91'} />
        </TouchableOpacity>

        <View style={[styles.settingDivider, { backgroundColor: isDark ? '#3A3A3C' : '#D3D5D7' }]} />

        <TouchableOpacity onPress={() => setShowDuration(true)} style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="time-outline" size={20} color={isDark ? '#AEAEB2' : '#8A8D91'} />
            <Text style={[styles.settingLabel, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Default Duration</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={[styles.settingValue, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{defaultDuration}</Text>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#AEAEB2' : '#8A8D91'} />
          </View>
        </TouchableOpacity>

        <View style={[styles.settingDivider, { backgroundColor: isDark ? '#3A3A3C' : '#D3D5D7' }]} />

        <TouchableOpacity onPress={() => setCarPlayEnabled(!carPlayEnabled)} style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="bluetooth-outline" size={20} color={isDark ? '#AEAEB2' : '#8A8D91'} />
            <Text style={[styles.settingLabel, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>CarPlay Connection</Text>
          </View>
          <ToggleSwitch enabled={carPlayEnabled} onChange={() => setCarPlayEnabled(!carPlayEnabled)} />
        </TouchableOpacity>

        <View style={[styles.settingDivider, { backgroundColor: isDark ? '#3A3A3C' : '#D3D5D7' }]} />

        <TouchableOpacity onPress={() => navigation.navigate('MoreSettings')} style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="settings-outline" size={20} color={isDark ? '#AEAEB2' : '#8A8D91'} />
            <Text style={[styles.settingLabel, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>More Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDark ? '#AEAEB2' : '#8A8D91'} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 100 }} />

      <SubscriptionModal visible={showSubscription} onClose={() => setShowSubscription(false)} />
      <DurationModal
        visible={showDuration}
        onClose={() => setShowDuration(false)}
        currentDuration={defaultDuration}
        onSelect={setDefaultDuration}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  // Google sign-in
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8,
  },
  googleG: { fontSize: 18, fontWeight: '700', color: '#4285F4' },
  googleText: { fontSize: 14, fontWeight: '600' },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8,
  },
  signOutText: { fontSize: 13, fontWeight: '500' },
  // Avatar
  avatarLetter: { fontSize: 28, fontWeight: '700', color: '#4285F4' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  syncedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(66, 133, 244, 0.1)', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  syncedText: { fontSize: 11, fontWeight: '600', color: '#4285F4' },
  card: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: '700' },
  email: { fontSize: 14, marginTop: 2 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trustIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(127, 169, 142, 0.2)',
    borderWidth: 1, borderColor: '#7FA98E', alignItems: 'center', justifyContent: 'center',
  },
  statLabel: { fontSize: 13 },
  statBig: { fontSize: 24, fontWeight: '700' },
  tierBadge: {
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginTop: 4,
    backgroundColor: '#7FA98E',
  },
  tierText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  divider: { height: 1, marginVertical: 16 },
  creditValue: { fontSize: 32, fontWeight: '700' },
  earnButton: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
    backgroundColor: 'rgba(127, 169, 142, 0.2)', borderWidth: 1, borderColor: '#7FA98E',
  },
  earnText: { fontSize: 13, fontWeight: '600', color: '#5F7A61' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  gridCard: {
    flex: 1, borderRadius: 16, borderWidth: 1, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  gridIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  gridLabel: { fontSize: 13 },
  gridValue: { fontSize: 28, fontWeight: '700' },
  upgradeCard: { borderRadius: 16, padding: 24, marginBottom: 24 },
  upgradeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  upgradeTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  upgradeSub: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)' },
  settingsCard: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingLabel: { fontSize: 15 },
  settingValue: { fontSize: 14 },
  settingDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  // Reward card
  rewardCard: {
    borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  rewardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  rewardIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  rewardInfo: { flex: 1 },
  rewardTitle: { fontSize: 16, fontWeight: '700' },
  rewardSub: { fontSize: 12, marginTop: 3, lineHeight: 17 },
  rewardProgressWrap: { gap: 6, marginBottom: 12 },
  rewardProgressBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  rewardProgressFill: { height: 8, borderRadius: 4, backgroundColor: '#C9A96E' },
  rewardProgressText: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
  redeemBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#C9A96E', borderRadius: 14, paddingVertical: 14,
  },
  redeemBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  rewardTips: { gap: 6 },
  rewardTipTitle: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  rewardTipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rewardTipText: { fontSize: 12 },
});
