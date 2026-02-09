import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDarkMode } from '../context/DarkModeContext';

// ─── Crowdsource Spots Needing Reports ─────────────────────────────────────
const pendingReports = [
  { id: 'cs1', name: '5th Ave & Market St', area: 'Gaslamp', distance: '0.2 mi', reward: 10, urgency: 'high' as const },
  { id: 'cs2', name: 'India St & Fir St', area: 'Little Italy', distance: '0.6 mi', reward: 5, urgency: 'medium' as const },
  { id: 'cs3', name: 'Park Blvd & University Ave', area: 'Hillcrest', distance: '1.1 mi', reward: 8, urgency: 'low' as const },
  { id: 'cs4', name: '30th St & El Cajon Blvd', area: 'North Park', distance: '1.4 mi', reward: 5, urgency: 'medium' as const },
];

// ─── Weekly Challenges ──────────────────────────────────────────────────────
const challengesData = [
  { id: 'ch1', title: 'Report 5 spots this week', reward: 50, icon: 'location' as const, progress: 3, total: 5 },
  { id: 'ch2', title: 'Confirm 3 garage availabilities', reward: 30, icon: 'car' as const, progress: 1, total: 3 },
  { id: 'ch3', title: 'Report during peak hours (5-7 PM)', reward: 25, icon: 'time' as const, progress: 0, total: 2 },
];

// ─── Leaderboard ────────────────────────────────────────────────────────────
const leaderboard = [
  { rank: 1, name: 'Sarah M.', points: 1240, badge: 'diamond' as const },
  { rank: 2, name: 'Jason K.', points: 980, badge: 'gold' as const },
  { rank: 3, name: 'Alex T.', points: 875, badge: 'gold' as const },
  { rank: 4, name: 'You', points: 247, badge: 'silver' as const, isUser: true },
  { rank: 5, name: 'Maria L.', points: 210, badge: 'silver' as const },
];

// ─── Activity Feed ──────────────────────────────────────────────────────────
type ActivityItemType = {
  id: number;
  type: 'shared' | 'found' | 'achievement' | 'verified';
  location?: string;
  title?: string;
  description?: string;
  time: string;
  credits?: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

const initialActivity: ActivityItemType[] = [
  { id: 1, type: 'shared', location: '5th Ave (Gaslamp)', time: '2 hours ago', credits: 10, icon: 'location', color: '#7FA98E' },
  { id: 2, type: 'verified', location: 'Horton Plaza Garage', time: '4 hours ago', credits: 5, icon: 'checkmark-circle', color: '#4A90D9' },
  { id: 3, type: 'found', location: 'Island Ave', time: '5 hours ago', icon: 'trending-up', color: '#8B9D83' },
  { id: 4, type: 'shared', location: 'Horton Plaza Garage', time: '1 day ago', credits: 15, icon: 'location', color: '#7FA98E' },
  { id: 5, type: 'achievement', title: 'Trust Builder', description: 'Shared 100 spots', time: '2 days ago', icon: 'trophy', color: '#C9A96E' },
  { id: 6, type: 'found', location: 'India St (Little Italy)', time: '3 days ago', icon: 'trending-up', color: '#8B9D83' },
];

function getBadgeColor(badge: string) {
  if (badge === 'diamond') return '#B4C7FF';
  if (badge === 'gold') return '#C9A96E';
  return '#AEAEB2';
}

export default function ActivityScreen() {
  const { isDark } = useDarkMode();
  const [totalCredits, setTotalCredits] = useState(247);
  const [spotsShared, setSpotsShared] = useState(142);
  const [trustScore, setTrustScore] = useState(87);
  const [reports, setReports] = useState(pendingReports);
  const [challenges, setChallenges] = useState(challengesData);
  const [activity, setActivity] = useState(initialActivity);
  const [tab, setTab] = useState<'feed' | 'report' | 'challenges' | 'leaderboard'>('feed');

  const handleReport = useCallback((spotId: string, isOpen: boolean) => {
    const spot = reports.find((r) => r.id === spotId);
    if (!spot) return;

    const earned = spot.reward;
    setTotalCredits((c) => c + earned);
    setSpotsShared((s) => s + 1);
    setTrustScore((t) => Math.min(100, t + 1));
    setReports((r) => r.filter((s) => s.id !== spotId));

    // Update challenges progress
    setChallenges((chs) =>
      chs.map((ch) => {
        if (ch.id === 'ch1' && ch.progress < ch.total) return { ...ch, progress: ch.progress + 1 };
        return ch;
      }),
    );

    // Add to activity feed
    const newItem: ActivityItemType = {
      id: Date.now(),
      type: 'shared',
      location: spot.name,
      time: 'Just now',
      credits: earned,
      icon: 'location',
      color: '#7FA98E',
    };
    setActivity((a) => [newItem, ...a]);

    Alert.alert(
      `+${earned} Credits!`,
      `Thanks for reporting ${spot.name} as ${isOpen ? 'available' : 'taken'}. Your trust score is now ${Math.min(100, trustScore + 1)}.`,
    );
  }, [reports, trustScore]);

  const handleClaimChallenge = useCallback((challengeId: string) => {
    const ch = challenges.find((c) => c.id === challengeId);
    if (!ch || ch.progress < ch.total) return;

    setTotalCredits((c) => c + ch.reward);
    setChallenges((chs) => chs.filter((c) => c.id !== challengeId));

    const newItem: ActivityItemType = {
      id: Date.now(),
      type: 'achievement',
      title: 'Challenge Complete!',
      description: ch.title,
      time: 'Just now',
      credits: ch.reward,
      icon: 'trophy',
      color: '#C9A96E',
    };
    setActivity((a) => [newItem, ...a]);

    Alert.alert(`+${ch.reward} Credits!`, `Challenge "${ch.title}" completed!`);
  }, [challenges]);

  const urgencyColor = (u: string) => {
    if (u === 'high') return '#DC4C4C';
    if (u === 'medium') return '#C9A96E';
    return '#7FA98E';
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1C1C1E' : '#F5F1E8' }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={[styles.headerTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Community</Text>

        {/* Points & Trust */}
        <View style={[styles.heroCard, {
          backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
          borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
        }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.heroCredits, { color: '#C9A96E' }]}>{totalCredits}</Text>
              <Text style={[styles.heroLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Credits</Text>
            </View>
            <View style={styles.heroDivider} />
            <View>
              <Text style={[styles.heroCredits, { color: '#7FA98E' }]}>{spotsShared}</Text>
              <Text style={[styles.heroLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Shared</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.heroCredits, { color: '#4A90D9' }]}>{trustScore}</Text>
              <Text style={[styles.heroLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Trust</Text>
            </View>
          </View>
          {/* Trust bar */}
          <View style={styles.trustBarWrap}>
            <View style={[styles.trustBarBg, { backgroundColor: isDark ? '#3A3A3C' : '#E8E8E8' }]}>
              <View style={[styles.trustBarFill, { width: `${trustScore}%` }]} />
            </View>
            <Text style={[styles.trustLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
              {trustScore >= 90 ? 'Trusted Reporter' : trustScore >= 70 ? 'Reliable Reporter' : 'Building Trust'}
            </Text>
          </View>
        </View>

        {/* Tab bar */}
        <View style={styles.tabRow}>
          {([
            { key: 'feed', label: 'Feed', icon: 'list' },
            { key: 'report', label: 'Report', icon: 'add-circle' },
            { key: 'challenges', label: 'Challenges', icon: 'flame' },
            { key: 'leaderboard', label: 'Ranks', icon: 'podium' },
          ] as const).map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tabBtn, tab === t.key && styles.tabBtnActive, tab !== t.key && {
                backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
              }]}
            >
              <Ionicons
                name={t.icon as any}
                size={16}
                color={tab === t.key ? '#FFFFFF' : isDark ? '#AEAEB2' : '#8A8D91'}
              />
              <Text style={[styles.tabText, { color: tab === t.key ? '#FFFFFF' : isDark ? '#AEAEB2' : '#8A8D91' }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ═══ FEED TAB ═══ */}
        {tab === 'feed' && (
          <>
            <Text style={[styles.sectionTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Recent Activity</Text>
            {activity.map((item) => (
              <View key={item.id} style={[styles.activityCard, {
                backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
                borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
              }]}>
                <View style={styles.activityRow}>
                  <View style={[styles.activityIcon, { backgroundColor: `${item.color}20`, borderColor: item.color }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <View style={styles.activityContent}>
                    {item.type === 'shared' && (
                      <>
                        <Text style={[styles.activityTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Shared a parking spot</Text>
                        <Text style={[styles.activitySub, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{item.location}</Text>
                      </>
                    )}
                    {item.type === 'verified' && (
                      <>
                        <Text style={[styles.activityTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Verified spot status</Text>
                        <Text style={[styles.activitySub, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{item.location}</Text>
                      </>
                    )}
                    {item.type === 'found' && (
                      <>
                        <Text style={[styles.activityTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Found parking</Text>
                        <Text style={[styles.activitySub, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{item.location}</Text>
                      </>
                    )}
                    {item.type === 'achievement' && (
                      <>
                        <Text style={[styles.activityTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{item.title}</Text>
                        <Text style={[styles.activitySub, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{item.description}</Text>
                      </>
                    )}
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={12} color={isDark ? '#AEAEB2' : '#8A8D91'} />
                      <Text style={[styles.timeText, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{item.time}</Text>
                    </View>
                  </View>
                  {item.credits != null && item.credits > 0 && (
                    <View style={styles.creditBadge}>
                      <Text style={styles.creditText}>+{item.credits}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </>
        )}

        {/* ═══ REPORT TAB ═══ */}
        {tab === 'report' && (
          <>
            <Text style={[styles.sectionTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Spots Needing Reports</Text>
            <Text style={[styles.sectionSub, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
              Help fellow parkers — report if these spots are open or taken
            </Text>

            {reports.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', borderColor: isDark ? '#3A3A3C' : '#D3D5D7' }]}>
                <Ionicons name="checkmark-circle" size={40} color="#7FA98E" />
                <Text style={[styles.emptyTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>All caught up!</Text>
                <Text style={[styles.emptySub, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>No spots need reporting right now. Check back later.</Text>
              </View>
            ) : (
              reports.map((spot) => (
                <View key={spot.id} style={[styles.reportCard, {
                  backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
                  borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
                }]}>
                  <View style={styles.reportHeader}>
                    <View>
                      <View style={styles.reportNameRow}>
                        <Text style={[styles.reportName, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{spot.name}</Text>
                        <View style={[styles.urgencyDot, { backgroundColor: urgencyColor(spot.urgency) }]} />
                      </View>
                      <Text style={[styles.reportMeta, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
                        {spot.area} · {spot.distance}
                      </Text>
                    </View>
                    <View style={styles.rewardChip}>
                      <Ionicons name="star" size={12} color="#C9A96E" />
                      <Text style={styles.rewardChipText}>+{spot.reward}</Text>
                    </View>
                  </View>
                  <View style={styles.reportBtns}>
                    <TouchableOpacity
                      onPress={() => handleReport(spot.id, true)}
                      style={styles.reportBtnOpen}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      <Text style={styles.reportBtnOpenText}>Available</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleReport(spot.id, false)}
                      style={[styles.reportBtnTaken, {
                        backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8',
                        borderColor: isDark ? '#48484A' : '#D3D5D7',
                      }]}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={18} color={isDark ? '#F5F5F7' : '#4A4F55'} />
                      <Text style={[styles.reportBtnTakenText, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Taken</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* ═══ CHALLENGES TAB ═══ */}
        {tab === 'challenges' && (
          <>
            <Text style={[styles.sectionTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Weekly Challenges</Text>
            <Text style={[styles.sectionSub, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
              Complete challenges to earn bonus credits
            </Text>

            {challenges.map((ch) => {
              const done = ch.progress >= ch.total;
              return (
                <View key={ch.id} style={[styles.challengeCard, {
                  backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
                  borderColor: done ? '#7FA98E' : isDark ? '#3A3A3C' : '#D3D5D7',
                }]}>
                  <View style={styles.challengeTop}>
                    <View style={[styles.challengeIcon, {
                      backgroundColor: done ? 'rgba(127, 169, 142, 0.2)' : isDark ? '#3A3A3C' : '#F5F1E8',
                    }]}>
                      <Ionicons name={ch.icon as any} size={20} color={done ? '#7FA98E' : isDark ? '#AEAEB2' : '#8A8D91'} />
                    </View>
                    <View style={styles.challengeInfo}>
                      <Text style={[styles.challengeTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{ch.title}</Text>
                      <Text style={[styles.challengeProgress, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
                        {ch.progress}/{ch.total} completed
                      </Text>
                    </View>
                    <View style={styles.rewardChip}>
                      <Ionicons name="star" size={12} color="#C9A96E" />
                      <Text style={styles.rewardChipText}>+{ch.reward}</Text>
                    </View>
                  </View>
                  {/* Progress bar */}
                  <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#3A3A3C' : '#E8E8E8' }]}>
                    <View style={[styles.progressBarFill, {
                      width: `${(ch.progress / ch.total) * 100}%`,
                      backgroundColor: done ? '#7FA98E' : '#C9A96E',
                    }]} />
                  </View>
                  {done && (
                    <TouchableOpacity
                      onPress={() => handleClaimChallenge(ch.id)}
                      style={styles.claimBtn}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="gift" size={16} color="#FFFFFF" />
                      <Text style={styles.claimBtnText}>Claim Reward</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            {/* Streak bonus */}
            <View style={[styles.streakCard, {
              backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
              borderColor: '#C9A96E',
            }]}>
              <Ionicons name="flame" size={28} color="#C9A96E" />
              <View style={styles.streakInfo}>
                <Text style={[styles.streakTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>5-Day Streak!</Text>
                <Text style={[styles.streakSub, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
                  Report a spot today to keep your streak and earn 2x credits
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ═══ LEADERBOARD TAB ═══ */}
        {tab === 'leaderboard' && (
          <>
            <Text style={[styles.sectionTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Community Rankings</Text>
            <Text style={[styles.sectionSub, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
              This week's top contributors in San Diego
            </Text>

            {leaderboard.map((entry) => (
              <View key={entry.rank} style={[styles.leaderRow, {
                backgroundColor: entry.isUser
                  ? isDark ? 'rgba(127, 169, 142, 0.1)' : 'rgba(127, 169, 142, 0.08)'
                  : isDark ? '#2C2C2E' : '#FFFFFF',
                borderColor: entry.isUser ? '#7FA98E' : isDark ? '#3A3A3C' : '#D3D5D7',
                borderWidth: entry.isUser ? 2 : 1,
              }]}>
                <View style={[styles.rankCircle, {
                  backgroundColor: entry.rank <= 3 ? getBadgeColor(entry.badge) + '30' : isDark ? '#3A3A3C' : '#F5F1E8',
                }]}>
                  <Text style={[styles.rankNum, {
                    color: entry.rank <= 3 ? getBadgeColor(entry.badge) : isDark ? '#AEAEB2' : '#8A8D91',
                  }]}>{entry.rank}</Text>
                </View>
                <View style={styles.leaderInfo}>
                  <Text style={[styles.leaderName, {
                    color: isDark ? '#F5F5F7' : '#4A4F55',
                    fontWeight: entry.isUser ? '700' : '600',
                  }]}>
                    {entry.name} {entry.isUser ? '(You)' : ''}
                  </Text>
                  <View style={styles.leaderBadgeRow}>
                    <Ionicons name="shield-checkmark" size={12} color={getBadgeColor(entry.badge)} />
                    <Text style={[styles.leaderBadgeText, { color: getBadgeColor(entry.badge) }]}>
                      {entry.badge.charAt(0).toUpperCase() + entry.badge.slice(1)}
                    </Text>
                  </View>
                </View>
                <View style={styles.leaderPoints}>
                  <Text style={[styles.leaderPointsVal, { color: '#C9A96E' }]}>{entry.points}</Text>
                  <Text style={[styles.leaderPointsLbl, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>pts</Text>
                </View>
              </View>
            ))}

            {/* How points work */}
            <View style={[styles.howItWorks, {
              backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
              borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
            }]}>
              <Text style={[styles.howTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>How Points Work</Text>
              {[
                { action: 'Report a spot', pts: '+5-15', icon: 'location-outline' as const },
                { action: 'Verify someone else\'s report', pts: '+5', icon: 'checkmark-circle-outline' as const },
                { action: 'Complete a challenge', pts: '+25-50', icon: 'flame-outline' as const },
                { action: 'Accurate report confirmed', pts: '+3 bonus', icon: 'shield-checkmark-outline' as const },
                { action: 'Streak bonus (daily)', pts: '2x multiplier', icon: 'trending-up-outline' as const },
              ].map((item, i) => (
                <View key={i} style={styles.howRow}>
                  <Ionicons name={item.icon} size={16} color="#7FA98E" />
                  <Text style={[styles.howAction, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{item.action}</Text>
                  <Text style={[styles.howPts, { color: '#C9A96E' }]}>{item.pts}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 60 },
  headerTitle: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  // Hero card
  heroCard: {
    borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 16 },
  heroCredits: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  heroLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', textAlign: 'center', marginTop: 2 },
  heroDivider: { width: 1, height: 36, backgroundColor: 'rgba(150,150,150,0.2)' },
  trustBarWrap: { gap: 6 },
  trustBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  trustBarFill: { height: 6, borderRadius: 3, backgroundColor: '#4A90D9' },
  trustLabel: { fontSize: 11, fontWeight: '500', textAlign: 'center' },
  // Tab bar
  tabRow: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 10, borderRadius: 12,
  },
  tabBtnActive: { backgroundColor: '#7FA98E' },
  tabText: { fontSize: 12, fontWeight: '600' },
  // Section
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  sectionSub: { fontSize: 13, marginBottom: 14 },
  // Activity card
  activityCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  activityIcon: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  activitySub: { fontSize: 14 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  timeText: { fontSize: 12 },
  creditBadge: {
    backgroundColor: 'rgba(127, 169, 142, 0.2)', borderWidth: 1,
    borderColor: '#7FA98E', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4,
  },
  creditText: { fontSize: 13, fontWeight: '600', color: '#5F7A61' },
  // Report card
  reportCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12,
  },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  reportNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reportName: { fontSize: 15, fontWeight: '700' },
  urgencyDot: { width: 8, height: 8, borderRadius: 4 },
  reportMeta: { fontSize: 12, marginTop: 3 },
  rewardChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(201, 169, 110, 0.15)', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  rewardChipText: { fontSize: 12, fontWeight: '700', color: '#C9A96E' },
  reportBtns: { flexDirection: 'row', gap: 10 },
  reportBtnOpen: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#7FA98E', borderRadius: 14, paddingVertical: 12,
  },
  reportBtnOpenText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  reportBtnTaken: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 14, borderWidth: 1, paddingVertical: 12,
  },
  reportBtnTakenText: { fontSize: 14, fontWeight: '600' },
  // Empty state
  emptyCard: {
    borderRadius: 16, borderWidth: 1, padding: 32, alignItems: 'center', gap: 10,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center' },
  // Challenge card
  challengeCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12,
  },
  challengeTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  challengeIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  challengeInfo: { flex: 1 },
  challengeTitle: { fontSize: 14, fontWeight: '600' },
  challengeProgress: { fontSize: 12, marginTop: 2 },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressBarFill: { height: 6, borderRadius: 3 },
  claimBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#7FA98E', borderRadius: 14, paddingVertical: 12, marginTop: 10,
  },
  claimBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  // Streak
  streakCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, borderWidth: 2, padding: 16, marginTop: 4,
  },
  streakInfo: { flex: 1 },
  streakTitle: { fontSize: 15, fontWeight: '700' },
  streakSub: { fontSize: 12, marginTop: 3 },
  // Leaderboard
  leaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, padding: 14, marginBottom: 8,
  },
  rankCircle: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  rankNum: { fontSize: 16, fontWeight: '800' },
  leaderInfo: { flex: 1 },
  leaderName: { fontSize: 15 },
  leaderBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  leaderBadgeText: { fontSize: 11, fontWeight: '600' },
  leaderPoints: { alignItems: 'center' },
  leaderPointsVal: { fontSize: 18, fontWeight: '700' },
  leaderPointsLbl: { fontSize: 10, fontWeight: '500' },
  // How it works
  howItWorks: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 12, gap: 10 },
  howTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  howAction: { flex: 1, fontSize: 13 },
  howPts: { fontSize: 13, fontWeight: '700' },
});
