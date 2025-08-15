import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

// Redux
import { useAppDispatch, useAppSelector } from '../../store';
import { loginStart, loginSuccess, loginFailure, clearError, setLoading } from '../../store/slices/authSlice';
import { useRegisterMutation } from '../../store/api';

// Types
import { RegisterData } from '../../types';

const RegisterScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  // Form state
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'CUSTOMER',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isServiceProvider, setIsServiceProvider] = useState(false);
  const [errors, setErrors] = useState<Partial<RegisterData & { confirmPassword: string }>>({});

  // RTK Query mutation
  const [registerMutation] = useRegisterMutation();

  // Clear error and loading state on mount
  useEffect(() => {
    dispatch(clearError());
    dispatch(setLoading(false));
  }, [dispatch]);

  // Update role when switch changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      role: isServiceProvider ? 'SERVICE_PROVIDER' : 'CUSTOMER',
    }));
  }, [isServiceProvider]);

  // Handle input change
  const handleInputChange = (field: keyof RegisterData | 'confirmPassword', value: string) => {
    if (field === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterData & { confirmPassword: string }> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle registration
  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      dispatch(loginStart());
      const result = await registerMutation(formData).unwrap();
      
      if (result.success && result.data) {
        console.log('✅ Registration successful:', result.data);
        
        dispatch(loginSuccess({
          user: result.data.user,
          token: result.data.token,
        }));
        console.log('🔄 Redux state updated with registration success');
        console.log('🔄 Auth state should be persisted by Redux Persist');
        
        Alert.alert('Success', 'Account created successfully!');
      } else {
        dispatch(loginFailure(result.message || 'Registration failed'));
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Registration failed. Please try again.';
      dispatch(loginFailure(errorMessage));
      Alert.alert('Registration Failed', errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Icon name="person-add" size={60} color="#3B82F6" />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join AfroAsiaConnect today</Text>
        </View>

        {/* Registration Form */}
        <View style={styles.form}>
          {/* Name Inputs */}
          <View style={styles.nameRow}>
            <View style={[styles.inputContainer, styles.nameInput]}>
              <Icon name="person" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, errors.firstName && styles.inputError]}
                placeholder="First Name"
                placeholderTextColor="#9CA3AF"
                value={formData.firstName}
                onChangeText={(text) => handleInputChange('firstName', text)}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            <View style={[styles.inputContainer, styles.nameInput]}>
              <TextInput
                style={[styles.input, errors.lastName && styles.inputError]}
                placeholder="Last Name"
                placeholderTextColor="#9CA3AF"
                value={formData.lastName}
                onChangeText={(text) => handleInputChange('lastName', text)}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>
          {(errors.firstName || errors.lastName) && (
            <Text style={styles.errorText}>
              {errors.firstName || errors.lastName}
            </Text>
          )}

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Icon name="email" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Email Address"
              placeholderTextColor="#9CA3AF"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          {/* Phone Input */}
          <View style={styles.inputContainer}>
            <Icon name="phone" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              placeholder="Phone Number (Optional)"
              placeholderTextColor="#9CA3AF"
              value={formData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              keyboardType="phone-pad"
              autoCorrect={false}
            />
          </View>
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Icon 
                name={showPassword ? 'visibility' : 'visibility-off'} 
                size={20} 
                color="#6B7280" 
              />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Icon name="lock-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, errors.confirmPassword && styles.inputError]}
              placeholder="Confirm Password"
              placeholderTextColor="#9CA3AF"
              value={confirmPassword}
              onChangeText={(text) => handleInputChange('confirmPassword', text)}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Icon 
                name={showConfirmPassword ? 'visibility' : 'visibility-off'} 
                size={20} 
                color="#6B7280" 
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

          {/* Role Selection */}
          <View style={styles.roleContainer}>
            <View style={styles.roleHeader}>
              <Icon name="work" size={20} color="#6B7280" />
              <Text style={styles.roleTitle}>Account Type</Text>
            </View>
            <View style={styles.roleSwitch}>
              <Text style={[styles.roleLabel, !isServiceProvider && styles.roleLabelActive]}>
                Customer
              </Text>
              <Switch
                value={isServiceProvider}
                onValueChange={setIsServiceProvider}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={isServiceProvider ? '#FFFFFF' : '#FFFFFF'}
              />
              <Text style={[styles.roleLabel, isServiceProvider && styles.roleLabelActive]}>
                Service Provider
              </Text>
            </View>
            <Text style={styles.roleDescription}>
              {isServiceProvider 
                ? 'Offer your services and grow your business'
                : 'Book services from trusted providers'
              }
            </Text>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.registerButtonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameInput: {
    flex: 1,
    marginRight: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
    marginLeft: 4,
  },
  roleContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 24,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  roleSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  roleLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginHorizontal: 12,
  },
  roleLabelActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  roleDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  registerButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  signInLink: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;
