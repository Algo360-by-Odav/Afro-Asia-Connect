import React, { useState } from 'react';
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
  Chip,
  HelperText,
} from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { apiService } from '../services/apiService';

interface ServiceFormData {
  serviceName: string;
  description: string;
  category: string;
  price: string;
  duration: string;
  location: string;
}

const CATEGORIES = [
  'Beauty & Wellness',
  'Home Services',
  'Professional Services',
  'Health & Fitness',
  'Education & Training',
  'Technology',
  'Automotive',
  'Events & Entertainment',
  'Other'
];

export const AddServiceScreen: React.FC = ({ navigation }: any) => {
  const [formData, setFormData] = useState<ServiceFormData>({
    serviceName: '',
    description: '',
    category: '',
    price: '',
    duration: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<ServiceFormData>>({});

  const { user } = useSelector((state: RootState) => state.auth);

  const validateForm = (): boolean => {
    const newErrors: Partial<ServiceFormData> = {};

    if (!formData.serviceName.trim()) {
      newErrors.serviceName = 'Service name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Please enter a valid price';
    }

    if (!formData.duration.trim()) {
      newErrors.duration = 'Duration is required';
    } else if (isNaN(Number(formData.duration)) || Number(formData.duration) <= 0) {
      newErrors.duration = 'Please enter a valid duration in minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const response = await apiService.post('/services', {
        ...formData,
        price: Number(formData.price),
        duration: Number(formData.duration),
      });

      if (response.success) {
        Alert.alert('Success', 'Service created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.error || 'Failed to create service');
      }
    } catch (error) {
      console.error('Error creating service:', error);
      Alert.alert('Error', 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof ServiceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Title title="Service Information" />
          <Card.Content>
            <TextInput
              label="Service Name *"
              value={formData.serviceName}
              onChangeText={(text) => updateFormData('serviceName', text)}
              mode="outlined"
              style={styles.input}
              error={!!errors.serviceName}
            />
            <HelperText type="error" visible={!!errors.serviceName}>
              {errors.serviceName}
            </HelperText>

            <TextInput
              label="Description *"
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              error={!!errors.description}
            />
            <HelperText type="error" visible={!!errors.description}>
              {errors.description}
            </HelperText>

            <Text style={styles.sectionTitle}>Category *</Text>
            <View style={styles.categoryContainer}>
              {CATEGORIES.map((category) => (
                <Chip
                  key={category}
                  selected={formData.category === category}
                  onPress={() => updateFormData('category', category)}
                  style={[
                    styles.categoryChip,
                    formData.category === category && styles.selectedChip
                  ]}
                  textStyle={[
                    styles.chipText,
                    formData.category === category && styles.selectedChipText
                  ]}
                >
                  {category}
                </Chip>
              ))}
            </View>
            <HelperText type="error" visible={!!errors.category}>
              {errors.category}
            </HelperText>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Pricing & Duration" />
          <Card.Content>
            <TextInput
              label="Price (USD) *"
              value={formData.price}
              onChangeText={(text) => updateFormData('price', text)}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              error={!!errors.price}
              left={<TextInput.Icon icon="currency-usd" />}
            />
            <HelperText type="error" visible={!!errors.price}>
              {errors.price}
            </HelperText>

            <TextInput
              label="Duration (minutes) *"
              value={formData.duration}
              onChangeText={(text) => updateFormData('duration', text)}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              error={!!errors.duration}
              left={<TextInput.Icon icon="clock-outline" />}
            />
            <HelperText type="error" visible={!!errors.duration}>
              {errors.duration}
            </HelperText>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Location" />
          <Card.Content>
            <TextInput
              label="Service Location"
              value={formData.location}
              onChangeText={(text) => updateFormData('location', text)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="map-marker-outline" />}
              placeholder="e.g., Your business address or 'Client location'"
            />
          </Card.Content>
        </Card>

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
            disabled={loading}
          >
            Create Service
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
  card: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 4,
  },
  input: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  categoryChip: {
    margin: 4,
    backgroundColor: '#f0f0f0',
  },
  selectedChip: {
    backgroundColor: '#667eea',
  },
  chipText: {
    color: '#666',
  },
  selectedChipText: {
    color: '#fff',
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

export default AddServiceScreen;
