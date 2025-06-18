import { FontAwesome } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export default function FileCard({ file }) {
  return (
    <View style={styles.card}>
      <FontAwesome name="file" size={24} color="#AC8FF5" />
      <Text style={styles.name}>{file.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f7f7f7',
    flexDirection: 'row',
    padding: 12,
    marginVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
});
