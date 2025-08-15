import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MessagesScreen = () => {
  return (
    <View style={styles.container}>
      <Icon name="message" size={80} color="#D1D5DB" />
      <Text style={styles.title}>Messages</Text>
      <Text style={styles.subtitle}>Chat with service providers</Text>
      <Text style={styles.comingSoon}>Coming Soon!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  comingSoon: {
    fontSize: 18,
    color: '#3B82F6',
    fontWeight: '600',
  },
});

export default MessagesScreen;
