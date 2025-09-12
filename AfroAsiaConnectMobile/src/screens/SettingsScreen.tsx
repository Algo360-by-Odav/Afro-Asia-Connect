import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  List,
  Divider,
  Switch,
  TouchableRipple,
  Button,
} from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const SettingsScreen: React.FC = ({ navigation }: any) => {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const { user } = useSelector((state: RootState) => state.auth);

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', onPress: () => Alert.alert('Success', 'Cache cleared successfully') }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Notification Settings */}
      <Card style={styles.card}>
        <Card.Title title="Notifications" />
        <Card.Content>
          <TouchableRipple onPress={() => setPushNotifications(!pushNotifications)}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive push notifications for bookings and messages
                </Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
              />
            </View>
          </TouchableRipple>
          
          <Divider style={styles.divider} />
          
          <TouchableRipple onPress={() => setEmailNotifications(!emailNotifications)}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Email Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive email updates about your account
                </Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
              />
            </View>
          </TouchableRipple>
          
          <Divider style={styles.divider} />
          
          <TouchableRipple onPress={() => setSmsNotifications(!smsNotifications)}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>SMS Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive SMS alerts for urgent updates
                </Text>
              </View>
              <Switch
                value={smsNotifications}
                onValueChange={setSmsNotifications}
              />
            </View>
          </TouchableRipple>
        </Card.Content>
      </Card>

      {/* App Preferences */}
      <Card style={styles.card}>
        <Card.Title title="App Preferences" />
        <Card.Content>
          <TouchableRipple onPress={() => setDarkMode(!darkMode)}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Dark Mode</Text>
                <Text style={styles.settingDescription}>
                  Use dark theme for the app
                </Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
              />
            </View>
          </TouchableRipple>
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Language"
            description="English (US)"
            left={(props) => <List.Icon {...props} icon="translate" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('LanguageSettings')}
          />
          
          <Divider />
          
          <List.Item
            title="Currency"
            description="USD ($)"
            left={(props) => <List.Icon {...props} icon="currency-usd" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('CurrencySettings')}
          />
        </Card.Content>
      </Card>

      {/* Privacy & Security */}
      <Card style={styles.card}>
        <Card.Title title="Privacy & Security" />
        <Card.Content>
          <List.Item
            title="Change Password"
            description="Update your account password"
            left={(props) => <List.Icon {...props} icon="lock" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('ChangePassword')}
          />
          
          <Divider />
          
          <List.Item
            title="Two-Factor Authentication"
            description="Add extra security to your account"
            left={(props) => <List.Icon {...props} icon="shield-check" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('TwoFactorAuth')}
          />
          
          <Divider />
          
          <List.Item
            title="Privacy Settings"
            description="Control your data and privacy"
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('PrivacySettings')}
          />
        </Card.Content>
      </Card>

      {/* Data & Storage */}
      <Card style={styles.card}>
        <Card.Title title="Data & Storage" />
        <Card.Content>
          <List.Item
            title="Download Data"
            description="Export your account data"
            left={(props) => <List.Icon {...props} icon="download" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('DataExport')}
          />
          
          <Divider />
          
          <List.Item
            title="Clear Cache"
            description="Free up storage space"
            left={(props) => <List.Icon {...props} icon="cached" />}
            onPress={handleClearCache}
          />
        </Card.Content>
      </Card>

      {/* About */}
      <Card style={styles.card}>
        <Card.Title title="About" />
        <Card.Content>
          <List.Item
            title="App Version"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
          
          <Divider />
          
          <List.Item
            title="Terms of Service"
            description="Read our terms"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('TermsOfService')}
          />
          
          <Divider />
          
          <List.Item
            title="Privacy Policy"
            description="Read our privacy policy"
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
        </Card.Content>
      </Card>

      {/* Danger Zone */}
      <Card style={[styles.card, styles.dangerCard]}>
        <Card.Title title="Danger Zone" titleStyle={styles.dangerTitle} />
        <Card.Content>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('DeleteAccount')}
            style={styles.dangerButton}
            textColor="#F44336"
            icon="delete-forever"
          >
            Delete Account
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    marginVertical: 8,
  },
  dangerCard: {
    borderColor: '#F44336',
    borderWidth: 1,
  },
  dangerTitle: {
    color: '#F44336',
  },
  dangerButton: {
    borderColor: '#F44336',
  },
});

export default SettingsScreen;
