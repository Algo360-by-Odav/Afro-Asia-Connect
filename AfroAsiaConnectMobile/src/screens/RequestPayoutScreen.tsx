import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  RadioButton,
  HelperText,
  Divider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { apiService } from '../services/apiService';

interface PayoutRequest {
  amount: string;
  method: 'BANK_TRANSFER' | 'PAYPAL' | 'STRIPE';
  bankDetails?: {
    accountNumber: string;
    routingNumber: string;
    accountHolderName: string;
  };
  paypalEmail?: string;
  notes?: string;
}

export const RequestPayoutScreen: React.FC = ({ navigation }: any) => {
  const [availableBalance, setAvailableBalance] = useState(0);
  const [minimumPayout, setMinimumPayout] = useState(50);
  const [formData, setFormData] = useState<PayoutRequest>({
    amount: '',
    method: 'BANK_TRANSFER',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    loadPayoutInfo();
  }, []);

  const loadPayoutInfo = async () => {
    try {
      const response = await apiService.get('/payments/payout-info');
      if (response.success) {
        setAvailableBalance(response.data.availableBalance || 0);
        setMinimumPayout(response.data.minimumPayout || 50);
      }
    } catch (error) {
      console.error('Error loading payout info:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = Number(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Please enter a valid amount';
      } else if (amount < minimumPayout) {
        newErrors.amount = `Minimum payout amount is $${minimumPayout}`;
      } else if (amount > availableBalance) {
        newErrors.amount = 'Amount exceeds available balance';
      }
    }

    if (formData.method === 'BANK_TRANSFER') {
      if (!formData.bankDetails?.accountNumber?.trim()) {
        newErrors.accountNumber = 'Account number is required';
      }
      if (!formData.bankDetails?.routingNumber?.trim()) {
        newErrors.routingNumber = 'Routing number is required';
      }
      if (!formData.bankDetails?.accountHolderName?.trim()) {
        newErrors.accountHolderName = 'Account holder name is required';
      }
    }

    if (formData.method === 'PAYPAL') {
      if (!formData.paypalEmail?.trim()) {
        newErrors.paypalEmail = 'PayPal email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.paypalEmail)) {
        newErrors.paypalEmail = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const response = await apiService.post('/payments/request-payout', {
        ...formData,
        amount: Number(formData.amount),
      });

      if (response.success) {
        Alert.alert(
          'Payout Requested',
          'Your payout request has been submitted successfully. You will receive an email confirmation shortly.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to request payout');
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      Alert.alert('Error', 'Failed to request payout');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }));
    }
  };

  const updateBankDetails = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [field]: value,
      } as any,
    }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }));
    }
  };

  const setMaxAmount = () => {
    updateFormData('amount', availableBalance.toString());
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        {/* Balance Information */}
        <Card style={styles.balanceCard}>
          <Card.Content>
            <View style={styles.balanceInfo}>
              <Icon name="account-balance-wallet" size={32} color="#667eea" />
              <View style={styles.balanceText}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceAmount}>${availableBalance.toFixed(2)}</Text>
              </View>
            </View>
            <Text style={styles.minimumText}>
              Minimum payout amount: ${minimumPayout}
            </Text>
          </Card.Content>
        </Card>

        {/* Payout Amount */}
        <Card style={styles.card}>
          <Card.Title title="Payout Amount" />
          <Card.Content>
            <View style={styles.amountContainer}>
              <TextInput
                label="Amount (USD)"
                value={formData.amount}
                onChangeText={(text) => updateFormData('amount', text)}
                mode="outlined"
                keyboardType="numeric"
                style={styles.amountInput}
                error={!!errors.amount}
                left={<TextInput.Icon icon="currency-usd" />}
              />
              <Button
                mode="outlined"
                onPress={setMaxAmount}
                style={styles.maxButton}
                compact
              >
                Max
              </Button>
            </View>
            <HelperText type="error" visible={!!errors.amount}>
              {errors.amount}
            </HelperText>
          </Card.Content>
        </Card>

        {/* Payout Method */}
        <Card style={styles.card}>
          <Card.Title title="Payout Method" />
          <Card.Content>
            <RadioButton.Group
              onValueChange={(value) => updateFormData('method', value)}
              value={formData.method}
            >
              <View style={styles.radioOption}>
                <RadioButton value="BANK_TRANSFER" />
                <View style={styles.radioContent}>
                  <Text style={styles.radioLabel}>Bank Transfer</Text>
                  <Text style={styles.radioDescription}>
                    Direct deposit to your bank account (3-5 business days)
                  </Text>
                </View>
              </View>

              <View style={styles.radioOption}>
                <RadioButton value="PAYPAL" />
                <View style={styles.radioContent}>
                  <Text style={styles.radioLabel}>PayPal</Text>
                  <Text style={styles.radioDescription}>
                    Transfer to your PayPal account (1-2 business days)
                  </Text>
                </View>
              </View>

              <View style={styles.radioOption}>
                <RadioButton value="STRIPE" />
                <View style={styles.radioContent}>
                  <Text style={styles.radioLabel}>Stripe Express</Text>
                  <Text style={styles.radioDescription}>
                    Instant transfer to your Stripe account
                  </Text>
                </View>
              </View>
            </RadioButton.Group>
          </Card.Content>
        </Card>

        {/* Bank Transfer Details */}
        {formData.method === 'BANK_TRANSFER' && (
          <Card style={styles.card}>
            <Card.Title title="Bank Account Details" />
            <Card.Content>
              <TextInput
                label="Account Holder Name"
                value={formData.bankDetails?.accountHolderName || ''}
                onChangeText={(text) => updateBankDetails('accountHolderName', text)}
                mode="outlined"
                style={styles.input}
                error={!!errors.accountHolderName}
              />
              <HelperText type="error" visible={!!errors.accountHolderName}>
                {errors.accountHolderName}
              </HelperText>

              <TextInput
                label="Account Number"
                value={formData.bankDetails?.accountNumber || ''}
                onChangeText={(text) => updateBankDetails('accountNumber', text)}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
                error={!!errors.accountNumber}
              />
              <HelperText type="error" visible={!!errors.accountNumber}>
                {errors.accountNumber}
              </HelperText>

              <TextInput
                label="Routing Number"
                value={formData.bankDetails?.routingNumber || ''}
                onChangeText={(text) => updateBankDetails('routingNumber', text)}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
                error={!!errors.routingNumber}
              />
              <HelperText type="error" visible={!!errors.routingNumber}>
                {errors.routingNumber}
              </HelperText>
            </Card.Content>
          </Card>
        )}

        {/* PayPal Details */}
        {formData.method === 'PAYPAL' && (
          <Card style={styles.card}>
            <Card.Title title="PayPal Account Details" />
            <Card.Content>
              <TextInput
                label="PayPal Email Address"
                value={formData.paypalEmail || ''}
                onChangeText={(text) => updateFormData('paypalEmail', text)}
                mode="outlined"
                keyboardType="email-address"
                style={styles.input}
                error={!!errors.paypalEmail}
                left={<TextInput.Icon icon="email" />}
              />
              <HelperText type="error" visible={!!errors.paypalEmail}>
                {errors.paypalEmail}
              </HelperText>
            </Card.Content>
          </Card>
        )}

        {/* Additional Notes */}
        <Card style={styles.card}>
          <Card.Title title="Additional Notes (Optional)" />
          <Card.Content>
            <TextInput
              label="Notes"
              value={formData.notes || ''}
              onChangeText={(text) => updateFormData('notes', text)}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              placeholder="Any additional information or special instructions..."
            />
          </Card.Content>
        </Card>

        {/* Important Information */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoHeader}>
              <Icon name="info" size={24} color="#2196F3" />
              <Text style={styles.infoTitle}>Important Information</Text>
            </View>
            <Text style={styles.infoText}>
              • Payout requests are processed within 1-2 business days
            </Text>
            <Text style={styles.infoText}>
              • You will receive an email confirmation once processed
            </Text>
            <Text style={styles.infoText}>
              • Bank transfers may take 3-5 business days to appear in your account
            </Text>
            <Text style={styles.infoText}>
              • PayPal transfers are typically completed within 1-2 business days
            </Text>
          </Card.Content>
        </Card>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={loading}
            disabled={loading || availableBalance < minimumPayout}
          >
            Request Payout
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  balanceCard: {
    margin: 16,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: '#f8f9ff',
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceText: {
    marginLeft: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  minimumText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 4,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  amountInput: {
    flex: 1,
    marginRight: 12,
  },
  maxButton: {
    marginTop: 8,
  },
  input: {
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  radioContent: {
    marginLeft: 8,
    flex: 1,
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  radioDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  infoCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: '#e3f2fd',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 8,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#667eea',
  },
});

export default RequestPayoutScreen;
